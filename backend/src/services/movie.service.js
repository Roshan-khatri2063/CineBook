import prisma from "../config/prisma.js";
import { escapeLike } from "../utils/search.js";
import { AppError } from "../utils/AppError.js";
import { buildPagination, getSkip } from "../utils/pagination.js";

// Customers only ever get these fields (no timestamps, no internal data).
const publicFields = {
  id: true,
  title: true,
  description: true,
  genre: true,
  language: true,
  durationMinutes: true,
  releaseDate: true,
  ageRating: true,
  posterUrl: true,
  status: true,
};

const upcomingShowtimes = () => ({ status: "SCHEDULED", startTime: { gt: new Date() } });

export const listMovies = async ({ page, limit, q, genre, status }) => {
  const where = {
    status: status ?? { not: "ENDED" }, // ended movies are hidden from customers
    ...(q && { title: { contains: escapeLike(q), mode: "insensitive" } }),
    ...(genre && { genre: { equals: genre, mode: "insensitive" } }),
  };

  const [rows, total] = await prisma.$transaction([
    prisma.movie.findMany({
      where,
      orderBy: [{ releaseDate: "desc" }, { id: "desc" }],
      skip: getSkip(page, limit),
      take: limit,
      select: { ...publicFields, _count: { select: { showtimes: { where: upcomingShowtimes() } } } },
    }),
    prisma.movie.count({ where }),
  ]);

  const items = rows.map(({ _count, ...movie }) => ({ ...movie, upcomingShowtimes: _count.showtimes }));
  return { items, pagination: buildPagination(page, limit, total) };
};

export const listGenres = async () => {
  const rows = await prisma.movie.findMany({
    where: { status: { not: "ENDED" } },
    select: { genre: true },
    distinct: ["genre"],
    orderBy: { genre: "asc" },
  });
  return rows.map((row) => row.genre);
};

const findPublicMovie = async (id) => {
  const movie = await prisma.movie.findFirst({
    where: { id, status: { not: "ENDED" } },
    select: { ...publicFields, trailerUrl: true },
  });
  if (!movie) throw new AppError("Movie not found", 404);
  return movie;
};

export const getMovie = findPublicMovie;

// Upcoming showtimes of one movie, with how many seats are still free.
export const listMovieShowtimes = async (movieId) => {
  await findPublicMovie(movieId);

  const showtimes = await prisma.showtime.findMany({
    where: { movieId, ...upcomingShowtimes() },
    orderBy: { startTime: "asc" },
    select: {
      id: true,
      startTime: true,
      endTime: true,
      standardPrice: true,
      premiumPrice: true,
      screen: { select: { id: true, name: true } },
    },
  });
  if (showtimes.length === 0) return [];

  const ids = showtimes.map((s) => s.id);
  const usable = { showtimeId: { in: ids }, seat: { isActive: true } };
  const [totals, free] = await Promise.all([
    prisma.showSeat.groupBy({ by: ["showtimeId"], where: usable, _count: { _all: true } }),
    prisma.showSeat.groupBy({ by: ["showtimeId"], where: { ...usable, status: "AVAILABLE" }, _count: { _all: true } }),
  ]);
  const toMap = (groups) => new Map(groups.map((g) => [g.showtimeId, g._count._all]));
  const totalMap = toMap(totals);
  const freeMap = toMap(free);

  return showtimes.map((s) => ({
    ...s,
    totalSeats: totalMap.get(s.id) ?? 0,
    availableSeats: freeMap.get(s.id) ?? 0,
  }));
};
