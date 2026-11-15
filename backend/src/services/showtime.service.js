import prisma from "../config/prisma.js";
import { MAX_SEATS_PER_BOOKING } from "../config/bookingRules.js";
import { AppError } from "../utils/AppError.js";

// Everything the seat-selection screen needs for one showtime.
// Seat status for customers: AVAILABLE, BOOKED, or UNAVAILABLE (seat out of order).
export const getSeatMap = async (id) => {
  const showtime = await prisma.showtime.findUnique({
    where: { id },
    select: {
      id: true,
      startTime: true,
      endTime: true,
      status: true,
      standardPrice: true,
      premiumPrice: true,
      movie: { select: { id: true, title: true, posterUrl: true, ageRating: true, durationMinutes: true, genre: true, language: true } },
      screen: { select: { id: true, name: true } },
    },
  });
  if (!showtime || showtime.status === "CANCELLED") throw new AppError("Showtime not found", 404);

  const rows = await prisma.showSeat.findMany({
    where: { showtimeId: id },
    orderBy: [{ seat: { rowLabel: "asc" } }, { seat: { seatNumber: "asc" } }],
    select: {
      id: true,
      status: true,
      price: true,
      seat: { select: { rowLabel: true, seatNumber: true, type: true, isActive: true } },
    },
  });

  const seats = rows.map((row) => ({
    id: row.id, // the show seat id: this is what the booking request sends
    label: `${row.seat.rowLabel}${row.seat.seatNumber}`,
    rowLabel: row.seat.rowLabel,
    seatNumber: row.seat.seatNumber,
    type: row.seat.type,
    price: row.price,
    status: row.seat.isActive ? row.status : "UNAVAILABLE",
  }));

  const started = showtime.startTime.getTime() <= Date.now();
  const { status, ...showtimeInfo } = showtime;

  return {
    showtime: showtimeInfo,
    seats,
    bookable: !started,
    closedReason: started ? "This showtime has already started" : null,
    maxSeatsPerBooking: MAX_SEATS_PER_BOOKING,
  };
};
