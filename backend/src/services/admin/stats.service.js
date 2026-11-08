import prisma from "../../config/prisma.js";
import { listBookings } from "./booking.service.js";

const toNumber = (value) => Number(value ?? 0);
const dateKey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const countsBy = (groups, key) =>
  Object.fromEntries(groups.map((g) => [g[key], g._count._all]));

export const getOverview = async () => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const sixDaysAgo = new Date(startOfToday);
  sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);

  const [
    movieGroups,
    screenCount,
    upcomingShowtimes,
    customerCount,
    activeCustomerCount,
    bookingGroups,
    revenueTotal,
    ticketsSold,
    bookingsToday,
    revenueToday,
    recentWeek,
    topMovies,
    recentBookings,
  ] = await Promise.all([
    prisma.movie.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.screen.count(),
    prisma.showtime.count({
      where: { status: "SCHEDULED", startTime: { gt: new Date() } },
    }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.user.count({ where: { role: "CUSTOMER", isActive: true } }),
    prisma.booking.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.booking.aggregate({
      where: { status: "CONFIRMED" },
      _sum: { totalAmount: true },
    }),
    prisma.bookingSeat.count({
      where: { isActive: true, booking: { status: "CONFIRMED" } },
    }),
    prisma.booking.count({
      where: { status: "CONFIRMED", createdAt: { gte: startOfToday } },
    }),
    prisma.booking.aggregate({
      where: { status: "CONFIRMED", createdAt: { gte: startOfToday } },
      _sum: { totalAmount: true },
    }),
    prisma.booking.findMany({
      where: { status: "CONFIRMED", createdAt: { gte: sixDaysAgo } },
      select: { createdAt: true, totalAmount: true },
    }),
    // Top 5 movies by tickets sold. Counts are cast to plain numbers.
    prisma.$queryRaw`
      SELECT m.id AS id, m.title AS title,
             COUNT(bs.id)::int AS tickets,
             COALESCE(SUM(bs.price), 0)::float8 AS revenue
      FROM booking_seats bs
      JOIN bookings b ON b.id = bs."bookingId"
      JOIN showtimes s ON s.id = b."showtimeId"
      JOIN movies m ON m.id = s."movieId"
      WHERE bs."isActive" = true AND b.status = 'CONFIRMED'
      GROUP BY m.id, m.title
      ORDER BY tickets DESC, m.title ASC
      LIMIT 5`,
    listBookings({ page: 1, limit: 5 }).then((result) => result.items),
  ]);

  // Revenue per day for the last 7 days (today included), zero-filled.
  const days = new Map();
  for (let i = 0; i < 7; i++) {
    const d = new Date(sixDaysAgo);
    d.setDate(sixDaysAgo.getDate() + i);
    days.set(dateKey(d), { date: dateKey(d), revenue: 0, bookings: 0 });
  }
  for (const booking of recentWeek) {
    const day = days.get(dateKey(booking.createdAt));
    if (day) {
      day.revenue += toNumber(booking.totalAmount);
      day.bookings += 1;
    }
  }

  const movies = countsBy(movieGroups, "status");
  const bookings = countsBy(bookingGroups, "status");

  return {
    movies: {
      total: Object.values(movies).reduce((a, b) => a + b, 0),
      nowShowing: movies.NOW_SHOWING ?? 0,
      comingSoon: movies.COMING_SOON ?? 0,
      ended: movies.ENDED ?? 0,
    },
    screens: screenCount,
    upcomingShowtimes,
    customers: { total: customerCount, active: activeCustomerCount },
    bookings: {
      confirmed: bookings.CONFIRMED ?? 0,
      cancelled: bookings.CANCELLED ?? 0,
      today: bookingsToday,
    },
    revenue: {
      total: toNumber(revenueTotal._sum.totalAmount),
      today: toNumber(revenueToday._sum.totalAmount),
    },
    ticketsSold,
    revenueLast7Days: [...days.values()],
    topMovies,
    recentBookings,
  };
};
