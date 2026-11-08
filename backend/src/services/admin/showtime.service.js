import prisma from "../../config/prisma.js";
import { AppError } from "../../utils/AppError.js";
import { buildPagination, getSkip } from "../../utils/pagination.js";

// Time needed to clean the hall between two shows.
const CLEANING_GAP_MINUTES = 15;
const MINUTE = 60 * 1000;

const fieldError = (status, field, message) =>
  new AppError(message, status, [{ field, message }]);

const baseInclude = {
  movie: { select: { id: true, title: true, durationMinutes: true } },
  screen: { select: { id: true, name: true } },
  _count: { select: { bookings: true } },
};

// Adds seat and booking numbers to a list of showtimes with 3 grouped queries
// (instead of 3 queries per showtime).
const withCounts = async (showtimes) => {
  if (showtimes.length === 0) return [];
  const ids = showtimes.map((s) => s.id);

  const [seatGroups, bookedGroups, confirmedGroups] = await Promise.all([
    prisma.showSeat.groupBy({
      by: ["showtimeId"],
      where: { showtimeId: { in: ids } },
      _count: { _all: true },
    }),
    prisma.showSeat.groupBy({
      by: ["showtimeId"],
      where: { showtimeId: { in: ids }, status: "BOOKED" },
      _count: { _all: true },
    }),
    prisma.booking.groupBy({
      by: ["showtimeId"],
      where: { showtimeId: { in: ids }, status: "CONFIRMED" },
      _count: { _all: true },
    }),
  ]);
  const toMap = (groups) =>
    new Map(groups.map((g) => [g.showtimeId, g._count._all]));
  const total = toMap(seatGroups);
  const booked = toMap(bookedGroups);
  const confirmed = toMap(confirmedGroups);

  return showtimes.map(({ _count, ...showtime }) => ({
    ...showtime,
    totalSeats: total.get(showtime.id) ?? 0,
    bookedSeats: booked.get(showtime.id) ?? 0,
    confirmedBookings: confirmed.get(showtime.id) ?? 0,
    hasBookings: _count.bookings > 0, // any status, including cancelled
  }));
};

// Finds a SCHEDULED showtime on the same screen that clashes with the new time,
// including the cleaning gap on both sides.
const findConflict = ({ screenId, startTime, endTime, excludeId }) =>
  prisma.showtime.findFirst({
    where: {
      screenId,
      status: "SCHEDULED",
      ...(excludeId && { id: { not: excludeId } }),
      startTime: {
        lt: new Date(endTime.getTime() + CLEANING_GAP_MINUTES * MINUTE),
      },
      endTime: {
        gt: new Date(startTime.getTime() - CLEANING_GAP_MINUTES * MINUTE),
      },
    },
    include: { movie: { select: { title: true } } },
  });

const conflictError = (conflict) =>
  fieldError(
    409,
    "startTime",
    `This screen already has "${conflict.movie.title}" at an overlapping time ` +
      `(${CLEANING_GAP_MINUTES} minutes are needed between shows).`,
  );

const countConfirmedBookings = (showtimeId) =>
  prisma.booking.count({ where: { showtimeId, status: "CONFIRMED" } });

// queries

export const listShowtimes = async ({
  page,
  limit,
  movieId,
  screenId,
  status,
  from,
  to,
}) => {
  const where = {
    ...(movieId && { movieId }),
    ...(screenId && { screenId }),
    ...(status && { status }),
    ...((from || to) && {
      startTime: { ...(from && { gte: from }), ...(to && { lte: to }) },
    }),
  };

  const [rows, total] = await prisma.$transaction([
    prisma.showtime.findMany({
      where,
      orderBy: [{ startTime: "asc" }, { id: "asc" }],
      skip: getSkip(page, limit),
      take: limit,
      include: baseInclude,
    }),
    prisma.showtime.count({ where }),
  ]);

  return {
    items: await withCounts(rows),
    pagination: buildPagination(page, limit, total),
  };
};

export const getShowtime = async (id) => {
  const row = await prisma.showtime.findUnique({
    where: { id },
    include: baseInclude,
  });
  if (!row) throw new AppError("Showtime not found", 404);
  const [showtime] = await withCounts([row]);
  return showtime;
};

// ---------------------------------------------------------------- create

export const createShowtime = async ({
  movieId,
  screenId,
  startTime,
  standardPrice,
  premiumPrice,
}) => {
  const movie = await prisma.movie.findUnique({ where: { id: movieId } });
  if (!movie) throw new AppError("Movie not found", 404);
  if (movie.status === "ENDED") {
    throw fieldError(
      400,
      "movieId",
      "This movie has ended and cannot be scheduled",
    );
  }

  const screen = await prisma.screen.findUnique({
    where: { id: screenId },
    include: { seats: { where: { isActive: true } } },
  });
  if (!screen) throw new AppError("Screen not found", 404);
  if (!screen.isActive)
    throw fieldError(400, "screenId", "This screen is inactive");
  if (screen.seats.length === 0) {
    throw fieldError(
      400,
      "screenId",
      "This screen has no seats yet. Set up its seat layout first.",
    );
  }

  if (startTime.getTime() <= Date.now()) {
    throw fieldError(400, "startTime", "Start time must be in the future");
  }

  const endTime = new Date(
    startTime.getTime() + movie.durationMinutes * MINUTE,
  );

  const conflict = await findConflict({ screenId, startTime, endTime });
  if (conflict) throw conflictError(conflict);

  // The showtime and one show seat per physical seat are created together.
  // The database's no-overlap constraint is the final safety net if two admins
  // submit clashing times at the same moment.
  const created = await prisma.showtime.create({
    data: {
      movieId,
      screenId,
      startTime,
      endTime,
      standardPrice,
      premiumPrice,
      showSeats: {
        create: screen.seats.map((seat) => ({
          seatId: seat.id,
          price: seat.type === "PREMIUM" ? premiumPrice : standardPrice,
        })),
      },
    },
  });

  return getShowtime(created.id);
};

// ---------------------------------------------------------------- update

export const updateShowtime = async (
  id,
  { startTime, standardPrice, premiumPrice },
) => {
  const existing = await prisma.showtime.findUnique({
    where: { id },
    include: { movie: { select: { durationMinutes: true } } },
  });
  if (!existing) throw new AppError("Showtime not found", 404);
  if (existing.status !== "SCHEDULED")
    throw new AppError("Only scheduled showtimes can be edited", 409);
  if (existing.startTime.getTime() <= Date.now()) {
    throw new AppError(
      "This showtime has already started and cannot be edited",
      409,
    );
  }

  const data = {};

  if (startTime && startTime.getTime() !== existing.startTime.getTime()) {
    const confirmed = await countConfirmedBookings(id);
    if (confirmed > 0) {
      throw fieldError(
        409,
        "startTime",
        `${confirmed} confirmed booking(s) exist, so the time cannot be changed`,
      );
    }
    if (startTime.getTime() <= Date.now()) {
      throw fieldError(400, "startTime", "Start time must be in the future");
    }

    const endTime = new Date(
      startTime.getTime() + existing.movie.durationMinutes * MINUTE,
    );
    const conflict = await findConflict({
      screenId: existing.screenId,
      startTime,
      endTime,
      excludeId: id,
    });
    if (conflict) throw conflictError(conflict);

    data.startTime = startTime;
    data.endTime = endTime;
  }

  if (standardPrice !== undefined) data.standardPrice = standardPrice;
  if (premiumPrice !== undefined) data.premiumPrice = premiumPrice;

  // New prices apply to seats that are still free. Seats already booked keep
  // the price the customer paid.
  const operations = [prisma.showtime.update({ where: { id }, data })];
  if (standardPrice !== undefined) {
    operations.push(
      prisma.showSeat.updateMany({
        where: {
          showtimeId: id,
          status: "AVAILABLE",
          seat: { type: "STANDARD" },
        },
        data: { price: standardPrice },
      }),
    );
  }
  if (premiumPrice !== undefined) {
    operations.push(
      prisma.showSeat.updateMany({
        where: {
          showtimeId: id,
          status: "AVAILABLE",
          seat: { type: "PREMIUM" },
        },
        data: { price: premiumPrice },
      }),
    );
  }
  await prisma.$transaction(operations);

  return getShowtime(id);
};

// ---------------------------------------------------------------- cancel / delete

// Cancelling a showtime that already has confirmed bookings would require
// refunding them, which belongs to the booking module. It is blocked for now.
export const cancelShowtime = async (id) => {
  const showtime = await prisma.showtime.findUnique({ where: { id } });
  if (!showtime) throw new AppError("Showtime not found", 404);
  if (showtime.status === "CANCELLED")
    throw new AppError("This showtime is already cancelled", 409);

  const confirmed = await countConfirmedBookings(id);
  if (confirmed > 0) {
    throw new AppError(
      `This showtime has ${confirmed} confirmed booking(s) and cannot be cancelled.`,
      409,
    );
  }

  await prisma.showtime.update({
    where: { id },
    data: { status: "CANCELLED" },
  });
  return getShowtime(id);
};

export const deleteShowtime = async (id) => {
  const showtime = await prisma.showtime.findUnique({ where: { id } });
  if (!showtime) throw new AppError("Showtime not found", 404);

  const confirmed = await countConfirmedBookings(id);
  if (confirmed > 0) {
    throw new AppError(
      `This showtime has ${confirmed} confirmed booking(s) and cannot be deleted.`,
      409,
    );
  }

  const history = await prisma.booking.count({ where: { showtimeId: id } });
  if (history > 0) {
    throw new AppError(
      "This showtime has booking history and cannot be deleted. Cancel it instead.",
      409,
    );
  }

  await prisma.showtime.delete({ where: { id } }); // show seats cascade
};
