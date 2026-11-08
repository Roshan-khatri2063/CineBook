import { Prisma } from "@prisma/client";
import prisma from "../../config/prisma.js";
import { AppError } from "../../utils/AppError.js";

const withCounts = { _count: { select: { seats: true, showtimes: true } } };

const rethrowDuplicateName = (error) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    throw new AppError("A screen with this name already exists", 409);
  }
  throw error;
};

export const listScreens = () =>
  prisma.screen.findMany({ orderBy: { name: "asc" }, include: withCounts });

export const getScreen = async (id) => {
  const screen = await prisma.screen.findUnique({ where: { id }, include: withCounts });
  if (!screen) throw new AppError("Screen not found", 404);
  return screen;
};

export const createScreen = async (data) => {
  try {
    return await prisma.screen.create({ data, include: withCounts });
  } catch (error) {
    return rethrowDuplicateName(error);
  }
};

export const updateScreen = async (id, data) => {
  await getScreen(id);
  try {
    return await prisma.screen.update({ where: { id }, data, include: withCounts });
  } catch (error) {
    return rethrowDuplicateName(error);
  }
};

// Same protection as movies: any booking on any showtime of this screen blocks
// the delete. Unbooked showtimes are removed together with the screen.
export const deleteScreen = async (id) => {
  await getScreen(id);

  const confirmed = await prisma.booking.count({
    where: { status: "CONFIRMED", showtime: { screenId: id } },
  });
  if (confirmed > 0) {
    throw new AppError(
      `This screen has ${confirmed} confirmed booking(s) and cannot be deleted. You can deactivate it instead.`,
      409,
    );
  }

  const history = await prisma.booking.count({ where: { showtime: { screenId: id } } });
  if (history > 0) {
    throw new AppError("This screen has booking history and cannot be deleted. You can deactivate it instead.", 409);
  }

  await prisma.$transaction([
    prisma.showtime.deleteMany({ where: { screenId: id } }), // show seats cascade
    prisma.screen.delete({ where: { id } }), // seats cascade
  ]);
};

// seats

const SEATS_LOCKED =
  "This screen already has showtimes, so its seat layout cannot be rebuilt. " +
  "Delete its showtimes first, or just change individual seats.";

export const getSeatLayout = async (screenId) => {
  const screen = await prisma.screen.findUnique({
    where: { id: screenId },
    select: { id: true, name: true, isActive: true },
  });
  if (!screen) throw new AppError("Screen not found", 404);

  const [seats, showtimeCount] = await Promise.all([
    prisma.seat.findMany({ where: { screenId }, orderBy: [{ rowLabel: "asc" }, { seatNumber: "asc" }] }),
    prisma.showtime.count({ where: { screenId } }),
  ]);

  return { screen, seats, showtimeCount, canRebuildLayout: showtimeCount === 0 };
};

// Replaces the whole layout. Only allowed while the screen has no showtimes,
// because every showtime keeps its own copy of the seats (show seats).
export const generateSeatLayout = async (screenId, { rows, seatsPerRow, premiumRows }) => {
  const screen = await prisma.screen.findUnique({ where: { id: screenId }, select: { id: true } });
  if (!screen) throw new AppError("Screen not found", 404);

  const showtimeCount = await prisma.showtime.count({ where: { screenId } });
  if (showtimeCount > 0) throw new AppError(SEATS_LOCKED, 409);

  const seats = [];
  for (let r = 0; r < rows; r++) {
    const rowLabel = String.fromCharCode(65 + r); // A, B, C...
    const type = r >= rows - premiumRows ? "PREMIUM" : "STANDARD";
    for (let n = 1; n <= seatsPerRow; n++) seats.push({ screenId, rowLabel, seatNumber: n, type });
  }

  await prisma.$transaction([
    prisma.seat.deleteMany({ where: { screenId } }),
    prisma.seat.createMany({ data: seats }),
  ]);

  return getSeatLayout(screenId);
};

// Changing a single seat's type or availability is always allowed.
// (Existing showtimes keep the price they were created with.)
export const updateSeat = async (seatId, data) => {
  const seat = await prisma.seat.findUnique({ where: { id: seatId } });
  if (!seat) throw new AppError("Seat not found", 404);
  return prisma.seat.update({ where: { id: seatId }, data });
};
