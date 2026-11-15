import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import prisma from "../config/prisma.js";
import { DECLINED_CARD_SUFFIX } from "../config/bookingRules.js";
import { AppError } from "../utils/AppError.js";

// ------------------------------------------------------------ small helpers

// Money is added up in whole cents so there are no floating point surprises.
const toCents = (value) => Math.round(Number(value) * 100);
const fromCents = (cents) => (cents / 100).toFixed(2);

// No 0, O, 1, I or L, so codes are easy to read out loud.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const randomCode = (length) =>
  Array.from(crypto.randomBytes(length), (byte) => ALPHABET[byte % ALPHABET.length]).join("");

const newBookingReference = () =>
  `CB-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${randomCode(6)}`;

// Prisma prints the decimal 800.00 as "800". Customers always get "800.00".
const money = (value) => Number(value).toFixed(2);

const seatLabel = (showSeat) => `${showSeat.seat.rowLabel}${showSeat.seat.seatNumber}`;

// ------------------------------------------------------- simulated payment

// There is no payment gateway. This function only pretends to charge a card:
// numbers ending in 0002 are declined, everything else is approved.
// The card number is read here and then forgotten: it is never stored or logged.
const simulatePayment = ({ cardNumber }) => {
  if (cardNumber.endsWith(DECLINED_CARD_SUFFIX)) {
    throw new AppError("Your card was declined. (This is a simulated payment.)", 402, null, "PAYMENT_DECLINED");
  }
  return { status: "PAID", reference: `SIM-${randomCode(10)}`, paidAt: new Date() };
};

// ------------------------------------------------------ how a booking is read

const bookingSelect = {
  id: true,
  bookingReference: true,
  status: true,
  totalAmount: true,
  paymentStatus: true,
  paymentReference: true,
  paidAt: true,
  cancelledAt: true,
  createdAt: true,
  showtime: {
    select: {
      id: true,
      startTime: true,
      endTime: true,
      movie: { select: { id: true, title: true, posterUrl: true, ageRating: true, durationMinutes: true } },
      screen: { select: { name: true } },
    },
  },
  bookingSeats: {
    orderBy: { id: "asc" },
    select: {
      id: true,
      price: true,
      isActive: true,
      showSeat: { select: { seat: { select: { rowLabel: true, seatNumber: true, type: true } } } },
      ticket: { select: { ticketCode: true, status: true } },
    },
  },
};

const formatBooking = ({ bookingSeats, paymentStatus, paymentReference, paidAt, totalAmount, ...booking }) => ({
  ...booking,
  totalAmount: money(totalAmount),
  payment: { status: paymentStatus, reference: paymentReference, paidAt, simulated: true },
  seatCount: bookingSeats.length,
  seats: bookingSeats.map((bs) => ({
    id: bs.id,
    label: seatLabel(bs.showSeat),
    type: bs.showSeat.seat.type,
    price: money(bs.price),
    isActive: bs.isActive,
    ticketCode: bs.ticket?.ticketCode ?? null,
    ticketStatus: bs.ticket?.status ?? null,
  })),
});

// A customer can only ever read their OWN bookings. Someone else's booking
// looks exactly like a booking that does not exist (404, not 403).
export const getMyBooking = async (userId, bookingId) => {
  const booking = await prisma.booking.findFirst({ where: { id: bookingId, userId }, select: bookingSelect });
  if (!booking) throw new AppError("Booking not found", 404);
  return formatBooking(booking);
};

// ------------------------------------------------------------ the booking

const seatsTaken = (labels) =>
  new AppError(
    labels.length === 1
      ? `Seat ${labels[0]} is no longer available`
      : `Seats ${labels.join(", ")} are no longer available`,
    409,
    { unavailableSeats: labels },
    "SEATS_UNAVAILABLE",
  );

// Everything below runs inside ONE database transaction. If anything throws,
// PostgreSQL rolls back and nothing is written: no booking, no BOOKED seats.
const bookInTransaction = async (tx, userId, { showtimeId, showSeatIds, expectedTotal, payment }) => {
  // 1. Lock the showtime row in shared mode. Other customers can book at the same
  //    time, but an admin cannot cancel or move the showtime until we commit.
  await tx.$queryRaw`SELECT id FROM showtimes WHERE id = ${showtimeId} FOR SHARE`;
  const showtime = await tx.showtime.findUnique({
    where: { id: showtimeId },
    select: { status: true, startTime: true },
  });
  if (!showtime) throw new AppError("Showtime not found", 404);
  if (showtime.status !== "SCHEDULED") {
    throw new AppError("This showtime has been cancelled", 409, null, "SHOWTIME_CLOSED");
  }
  if (showtime.startTime.getTime() <= Date.now()) {
    throw new AppError("Booking for this showtime has closed", 409, null, "SHOWTIME_CLOSED");
  }

  // 2. Lock the selected seat rows (FOR UPDATE). Anyone else trying to book one
  //    of these seats now WAITS here until we commit or roll back, and then sees
  //    the final state. Rows are locked in id order, so two customers choosing
  //    overlapping seats in different orders can never deadlock each other.
  const ids = [...showSeatIds].sort((a, b) => a - b);
  await tx.$queryRaw`SELECT id FROM show_seats WHERE id IN (${Prisma.join(ids)}) ORDER BY id FOR UPDATE`;

  // 3. Read the locked seats. Nobody can change them until we finish.
  const seats = await tx.showSeat.findMany({
    where: { id: { in: ids } },
    include: { seat: true },
    orderBy: { id: "asc" },
  });

  // 4. Every seat must exist and belong to THIS showtime.
  if (seats.length !== ids.length) {
    throw new AppError("One or more selected seats do not exist", 400, null, "INVALID_SEATS");
  }
  if (seats.some((s) => s.showtimeId !== showtimeId)) {
    throw new AppError("One or more selected seats do not belong to this showtime", 400, null, "INVALID_SEATS");
  }

  // 5. Every seat must still be free (and not out of order).
  const unavailable = seats.filter((s) => s.status !== "AVAILABLE" || !s.seat.isActive);
  if (unavailable.length > 0) throw seatsTaken(unavailable.map(seatLabel));

  // 6. The price is decided HERE, from the database. The total the customer saw
  //    is only compared against it, so a tampered or outdated total is refused.
  const totalCents = seats.reduce((sum, s) => sum + toCents(s.price), 0);
  if (toCents(expectedTotal) !== totalCents) {
    throw new AppError(
      "The ticket prices have changed. Please review the new total.",
      409,
      { newTotal: fromCents(totalCents) },
      "PRICE_CHANGED",
    );
  }

  // 7. Simulated payment. A decline throws, which rolls everything back.
  const paid = simulatePayment(payment);

  // 8. Booking + one booking seat and one ticket per seat, created together.
  const booking = await tx.booking.create({
    data: {
      bookingReference: newBookingReference(),
      userId,
      showtimeId,
      status: "CONFIRMED",
      totalAmount: fromCents(totalCents),
      paymentStatus: paid.status,
      paymentReference: paid.reference,
      paidAt: paid.paidAt,
      bookingSeats: {
        create: seats.map((s) => ({
          showSeatId: s.id,
          price: s.price,
          isActive: true,
          ticket: { create: { ticketCode: `TK-${randomCode(10)}`, status: "VALID" } },
        })),
      },
    },
    select: { id: true },
  });

  // 9. Only now are the seats marked BOOKED. The status check is a second safety
  //    net: if a single row did not change, the whole transaction is undone.
  const marked = await tx.showSeat.updateMany({
    where: { id: { in: ids }, status: "AVAILABLE" },
    data: { status: "BOOKED" },
  });
  if (marked.count !== ids.length) throw seatsTaken(seats.map(seatLabel));

  return booking.id;
};

export const createBooking = async (userId, input) => {
  // A booking reference, ticket code or payment reference that happens to
  // collide is astronomically unlikely, but if it does the whole booking is
  // simply tried again with new codes.
  for (let attempt = 1; ; attempt++) {
    try {
      const bookingId = await prisma.$transaction((tx) => bookInTransaction(tx, userId, input), {
        maxWait: 5000,
        timeout: 15000,
      });
      return getMyBooking(userId, bookingId);
    } catch (error) {
      const collision = error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
      if (collision && attempt < 3) continue;
      // Last line of defence: the database refused a second active booking of one seat.
      if (String(error?.message).includes("booking_seats_one_active_per_show_seat")) {
        throw new AppError("One of the selected seats has just been booked", 409, null, "SEATS_UNAVAILABLE");
      }
      throw error;
    }
  }
};
