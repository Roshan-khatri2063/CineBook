import prisma from "../../config/prisma.js";
import { AppError } from "../../utils/AppError.js";
import { buildPagination, getSkip } from "../../utils/pagination.js";

export const listMovies = async ({ page, limit, q, status, genre }) => {
  const where = {
    ...(q && { title: { contains: q, mode: "insensitive" } }),
    ...(status && { status }),
    ...(genre && { genre: { equals: genre, mode: "insensitive" } }),
  };

  const [items, total] = await prisma.$transaction([
    prisma.movie.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: getSkip(page, limit),
      take: limit,
      include: { _count: { select: { showtimes: true } } },
    }),
    prisma.movie.count({ where }),
  ]);

  return { items, pagination: buildPagination(page, limit, total) };
};

export const getMovie = async (id) => {
  const movie = await prisma.movie.findUnique({
    where: { id },
    include: { _count: { select: { showtimes: true } } },
  });
  if (!movie) throw new AppError("Movie not found", 404);
  return movie;
};

export const createMovie = (data) =>
  prisma.movie.create({
    data: {
      ...data,
      ageRating: data.ageRating ?? null,
      posterUrl: data.posterUrl ?? null,
      trailerUrl: data.trailerUrl ?? null,
    },
  });

export const updateMovie = async (id, data) => {
  await getMovie(id); // 404 if missing
  return prisma.movie.update({ where: { id }, data });
};

// A movie can be deleted only when no booking exists on any of its showtimes.
//  - confirmed bookings  -> blocked (customers hold tickets)
//  - cancelled bookings  -> blocked (booking history is kept)
// Showtimes that nobody booked are removed together with the movie.
export const deleteMovie = async (id) => {
  await getMovie(id);

  const confirmed = await prisma.booking.count({
    where: { status: "CONFIRMED", showtime: { movieId: id } },
  });
  if (confirmed > 0) {
    throw new AppError(
      `This movie has ${confirmed} confirmed booking(s) and cannot be deleted. Set its status to ENDED instead.`,
      409,
    );
  }

  const history = await prisma.booking.count({
    where: { showtime: { movieId: id } },
  });
  if (history > 0) {
    throw new AppError(
      "This movie has booking history and cannot be deleted. Set its status to ENDED instead.",
      409,
    );
  }

  await prisma.$transaction([
    prisma.showtime.deleteMany({ where: { movieId: id } }), // their show seats cascade
    prisma.movie.delete({ where: { id } }),
  ]);
};
