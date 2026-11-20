import QRCode from "qrcode";
import prisma from "../config/prisma.js";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";
import { buildPagination, getSkip } from "../utils/pagination.js";
import { createQrToken } from "../utils/ticketToken.js";

// Everything a ticket shows. Note what is NOT here: no customer name, email or phone.
export const ticketSelect = {
  id: true,
  ticketCode: true,
  status: true,
  usedAt: true,
  bookingSeat: {
    select: {
      booking: { select: { id: true, bookingReference: true, status: true } },
      showSeat: {
        select: {
          seat: { select: { rowLabel: true, seatNumber: true, type: true } },
          showtime: {
            select: {
              startTime: true,
              endTime: true,
              movie: {
                select: {
                  id: true,
                  title: true,
                  posterUrl: true,
                  ageRating: true,
                  durationMinutes: true,
                  language: true,
                },
              },
              screen: { select: { name: true } },
            },
          },
        },
      },
    },
  },
};

// The one status a person (or the entrance scanner) cares about.
//   CANCELLED: the booking or ticket was cancelled
//   USED:      already scanned at the entrance
//   EXPIRED:   still marked valid, but the showtime has already ended
//   VALID:     can be used
export const validityOf = (ticket, now = new Date()) => {
  const { booking, showSeat } = ticket.bookingSeat;
  if (ticket.status === "CANCELLED" || booking.status !== "CONFIRMED")
    return "CANCELLED";
  if (ticket.status === "USED") return "USED";
  if (showSeat.showtime.endTime <= now) return "EXPIRED";
  return "VALID";
};

export const formatTicket = (ticket) => {
  const { booking, showSeat } = ticket.bookingSeat;
  const { seat, showtime } = showSeat;
  return {
    id: ticket.id,
    ticketCode: ticket.ticketCode,
    status: ticket.status,
    validity: validityOf(ticket),
    usedAt: ticket.usedAt,
    cinemaName: env.CINEMA_NAME,
    bookingId: booking.id,
    bookingReference: booking.bookingReference,
    seat: { label: `${seat.rowLabel}${seat.seatNumber}`, type: seat.type },
    movie: showtime.movie,
    screen: showtime.screen,
    showtime: { startTime: showtime.startTime, endTime: showtime.endTime },
  };
};

// PNG image of the QR code, as a data URL that can go straight into <img src>.
const qrImage = (token) =>
  QRCode.toDataURL(token, { errorCorrectionLevel: "M", margin: 2, width: 320 });

const withQrCode = async (ticket) => {
  const qrToken = createQrToken(ticket.ticketCode);
  return { ...formatTicket(ticket), qrToken, qrCode: await qrImage(qrToken) };
};

// A customer can only ever read tickets of their OWN bookings. Someone else's
// ticket looks exactly like a ticket that does not exist (404, not 403).
const ownedBy = (userId) => ({ bookingSeat: { booking: { userId } } });

export const listMyTickets = async (userId, { scope, page, limit }) => {
  const now = new Date();
  const timing =
    scope === "upcoming"
      ? { endTime: { gt: now } }
      : scope === "past"
        ? { endTime: { lte: now } }
        : null;
  const where = {
    bookingSeat: {
      booking: { userId },
      ...(timing && { showSeat: { showtime: timing } }),
    },
  };
  const direction = scope === "upcoming" ? "asc" : "desc";

  const [rows, total] = await prisma.$transaction([
    prisma.ticket.findMany({
      where,
      orderBy: [
        { bookingSeat: { showSeat: { showtime: { startTime: direction } } } },
        { id: "asc" },
      ],
      skip: getSkip(page, limit),
      take: limit,
      select: ticketSelect,
    }),
    prisma.ticket.count({ where }),
  ]);

  return {
    items: rows.map(formatTicket),
    pagination: buildPagination(page, limit, total),
  };
};

export const getMyTicket = async (userId, ticketId) => {
  const ticket = await prisma.ticket.findFirst({
    where: { id: ticketId, ...ownedBy(userId) },
    select: ticketSelect,
  });
  if (!ticket) throw new AppError("Ticket not found", 404);
  return withQrCode(ticket);
};

// All tickets of one booking (used by the "print all tickets" page).
export const getMyBookingTickets = async (userId, bookingId) => {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, userId },
    select: { id: true, bookingReference: true },
  });
  if (!booking) throw new AppError("Booking not found", 404);

  const tickets = await prisma.ticket.findMany({
    where: { bookingSeat: { bookingId } },
    orderBy: { id: "asc" },
    select: ticketSelect,
  });
  return { booking, tickets: await Promise.all(tickets.map(withQrCode)) };
};
