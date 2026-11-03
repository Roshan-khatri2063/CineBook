// Development seed: admin account, screens + seats, movies and showtimes.
// Safe to run more than once: existing rows are skipped, never duplicated.
// Run with:  npm run db:seed
import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ------------------------------------------------------------ sample data

const SCREENS = [
  { name: "Screen 1", rows: "ABCDEFGH", seatsPerRow: 10, premiumRows: "GH" },
  { name: "Screen 2", rows: "ABCDEF", seatsPerRow: 8, premiumRows: "EF" },
  { name: "Screen 3", rows: "ABCDE", seatsPerRow: 6, premiumRows: "DE" },
];

// Fictional titles, so there are no poster or copyright issues.
const MOVIES = [
  {
    title: "The Last Lighthouse",
    description: "A retired keeper guards a remote lighthouse through one final storm, and a secret the sea has kept for decades.",
    genre: "Drama", language: "English", durationMinutes: 118,
    releaseDate: "2026-09-12", ageRating: "PG-13", status: "NOW_SHOWING",
  },
  {
    title: "Neon Skyline",
    description: "In a city that never sleeps, a courier discovers a package that could shut down the power grid.",
    genre: "Sci-Fi", language: "English", durationMinutes: 134,
    releaseDate: "2026-10-03", ageRating: "PG-13", status: "NOW_SHOWING",
  },
  {
    title: "Himalayan Echoes",
    description: "Three friends trek to a hidden valley to find a lost village and the story behind its legend.",
    genre: "Adventure", language: "Nepali", durationMinutes: 126,
    releaseDate: "2026-10-10", ageRating: "PG", status: "NOW_SHOWING",
  },
  {
    title: "Laugh Track",
    description: "A struggling stand-up comedian accidentally becomes the face of a small-town festival.",
    genre: "Comedy", language: "English", durationMinutes: 98,
    releaseDate: "2026-10-17", ageRating: "PG", status: "NOW_SHOWING",
  },
  {
    title: "Starlit Summer",
    description: "Two strangers share one unforgettable summer in a seaside town.",
    genre: "Romance", language: "Hindi", durationMinutes: 105,
    releaseDate: "2026-12-05", ageRating: "PG", status: "COMING_SOON",
  },
  {
    title: "Shadows of Kathmandu",
    description: "A detective follows a trail of clues through the old streets of the valley.",
    genre: "Thriller", language: "Nepali", durationMinutes: 112,
    releaseDate: "2026-06-20", ageRating: "R", status: "ENDED",
  },
];

const STANDARD_PRICE = "400.00";
const PREMIUM_PRICE = "600.00";
const SLOTS = [[10, 0], [13, 30], [17, 0], [20, 30]]; // [hour, minute], 3.5h apart
const DAYS_AHEAD = 3; // showtimes for tomorrow + the next 2 days

// ---------------------------------------------------------------- seeders

async function seedAdmin() {
  const { SEED_ADMIN_NAME, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD } = process.env;

  if (!SEED_ADMIN_EMAIL || !SEED_ADMIN_PASSWORD) {
    throw new Error("Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in backend/.env before seeding.");
  }
  if (SEED_ADMIN_PASSWORD.length < 8) {
    throw new Error("SEED_ADMIN_PASSWORD must be at least 8 characters.");
  }

  const email = SEED_ADMIN_EMAIL.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(SEED_ADMIN_PASSWORD, 10);

  // update: {} means an existing admin keeps its current password.
  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { name: SEED_ADMIN_NAME || "CineBook Admin", email, passwordHash, role: "ADMIN" },
  });
  console.log(`Admin ready: ${admin.email}`);
}

async function seedScreens() {
  for (const def of SCREENS) {
    const screen = await prisma.screen.upsert({
      where: { name: def.name },
      update: {},
      create: { name: def.name },
    });

    const seats = [];
    for (const rowLabel of def.rows) {
      for (let seatNumber = 1; seatNumber <= def.seatsPerRow; seatNumber++) {
        seats.push({
          screenId: screen.id,
          rowLabel,
          seatNumber,
          type: def.premiumRows.includes(rowLabel) ? "PREMIUM" : "STANDARD",
        });
      }
    }
    // skipDuplicates relies on the unique (screenId, rowLabel, seatNumber) constraint
    const result = await prisma.seat.createMany({ data: seats, skipDuplicates: true });
    console.log(`${screen.name}: ${result.count} new seats (layout has ${seats.length})`);
  }
}

async function seedMovies() {
  let created = 0;
  for (const movie of MOVIES) {
    const exists = await prisma.movie.findFirst({ where: { title: movie.title } });
    if (exists) continue;
    await prisma.movie.create({ data: { ...movie, releaseDate: new Date(movie.releaseDate) } });
    created++;
  }
  console.log(`Movies: ${created} new`);
}

async function seedShowtimes() {
  const screens = await prisma.screen.findMany({
    orderBy: { id: "asc" },
    include: { seats: { where: { isActive: true } } },
  });
  const movies = await prisma.movie.findMany({
    where: { status: "NOW_SHOWING" },
    orderBy: { id: "asc" },
  });
  if (movies.length === 0) throw new Error("No NOW_SHOWING movies found to schedule.");

  let created = 0;
  for (let day = 1; day <= DAYS_AHEAD; day++) {
    for (const [screenIndex, screen] of screens.entries()) {
      for (const [slotIndex, [hour, minute]] of SLOTS.entries()) {
        const startTime = new Date();
        startTime.setDate(startTime.getDate() + day);
        startTime.setHours(hour, minute, 0, 0);

        const exists = await prisma.showtime.findFirst({
          where: { screenId: screen.id, startTime },
        });
        if (exists) continue;

        const movie = movies[(screenIndex + slotIndex + day) % movies.length];
        const endTime = new Date(startTime.getTime() + movie.durationMinutes * 60 * 1000);

        // One ShowSeat per physical seat, created together with the showtime.
        await prisma.showtime.create({
          data: {
            movieId: movie.id,
            screenId: screen.id,
            startTime,
            endTime,
            standardPrice: STANDARD_PRICE,
            premiumPrice: PREMIUM_PRICE,
            showSeats: {
              create: screen.seats.map((seat) => ({
                seatId: seat.id,
                price: seat.type === "PREMIUM" ? PREMIUM_PRICE : STANDARD_PRICE,
              })),
            },
          },
        });
        created++;
      }
    }
  }
  console.log(`Showtimes: ${created} new`);
}

// ------------------------------------------------------------------- main

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run the development seed in production.");
  }
  await seedAdmin();
  await seedScreens();
  await seedMovies();
  await seedShowtimes();
  console.log("Seeding finished.");
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
