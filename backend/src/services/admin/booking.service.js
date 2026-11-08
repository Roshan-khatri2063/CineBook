import prisma from "../../config/prisma.js";
import { AppError } from "../../utils/AppError.js";
import { buildPagination, getSkip } from "../../utils/pagination.js";

// The customer is selected field by field, so passwordHash can never leak.
const bookingInclude = {
  user: { select: { id: true, name: true, email: true } },
  showtime: {
    select: {
      id: true,
      startTime: true,
      movie: { select: { id: true, title: true } },
      screen: { select: { id: true, name: true } },
    },
  },
  bookingSeats: {
    orderBy: { id: "asc" },
    select: {
      id: true,
      price: true,
      isActive: true,
      showSeat: {
        select: {
          seat: { select: { rowLabel: true, seatNumber: true, type: true } },
        },
      },
      ticket: { select: { ticketCode: true, status: true } },
    },
  },
};

const seatLabel = (bs) =>
  `${bs.showSeat.seat.rowLabel}${bs.showSeat.seat.seatNumber}`;

// Turns a raw booking into the shape the admin UI needs.
export const formatBooking = ({ bookingSeats, ...booking }) => ({
  ...booking,
  seatCount: bookingSeats.length,
  seats: bookingSeats.map((bs) => ({
    id: bs.id,
    label: seatLabel(bs),
    type: bs.showSeat.seat.type,
    price: bs.price,
    isActive: bs.isActive,
    ticketCode: bs.ticket?.ticketCode ?? null,
    ticketStatus: bs.ticket?.status ?? null,
  })),
});

export const listBookings = async ({
  page,
  limit,
  status,
  showtimeId,
  q,
  from,
  to,
}) => {
  const where = {
    ...(status && { status }),
    ...(showtimeId && { showtimeId }),
    ...((from || to) && {
      createdAt: { ...(from && { gte: from }), ...(to && { lte: to }) },
    }),
    ...(q && {
      OR: [
        { bookingReference: { contains: q, mode: "insensitive" } },
        { user: { name: { contains: q, mode: "insensitive" } } },
        { user: { email: { contains: q, mode: "insensitive" } } },
      ],
    }),
  };

  const [rows, total] = await prisma.$transaction([
    prisma.booking.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: getSkip(page, limit),
      take: limit,
      include: bookingInclude,
    }),
    prisma.booking.count({ where }),
  ]);

  return {
    items: rows.map(formatBooking),
    pagination: buildPagination(page, limit, total),
  };
};

export const getBooking = async (id) => {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: bookingInclude,
  });
  if (!booking) throw new AppError("Booking not found", 404);
  return formatBooking(booking);
};
