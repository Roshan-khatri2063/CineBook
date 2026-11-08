import "dotenv/config";
import crypto from "node:crypto";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CUSTOMERS = [
  {
    name: "Aarav Sharma",
    email: "aarav.demo@cinebook.local",
    phone: "+977 9801111111",
  },
  {
    name: "Sita Gurung",
    email: "sita.demo@cinebook.local",
    phone: "+977 9802222222",
  },
  { name: "Rohan Thapa", email: "rohan.demo@cinebook.local", phone: null },
  {
    name: "Maya Rai",
    email: "maya.demo@cinebook.local",
    phone: "+977 9804444444",
  },
];

// customer index, which upcoming showtime, seats, days ago, status
const BOOKINGS = [
  { c: 0, st: 0, seats: 2, daysAgo: 0, status: "CONFIRMED" },
  { c: 1, st: 1, seats: 3, daysAgo: 0, status: "CONFIRMED" },
  { c: 2, st: 2, seats: 1, daysAgo: 1, status: "CONFIRMED" },
  { c: 0, st: 3, seats: 4, daysAgo: 1, status: "CONFIRMED" },
  { c: 3, st: 0, seats: 2, daysAgo: 2, status: "CONFIRMED" },
  { c: 1, st: 4, seats: 2, daysAgo: 3, status: "CANCELLED" },
  { c: 2, st: 5, seats: 3, daysAgo: 4, status: "CONFIRMED" },
  { c: 3, st: 6, seats: 2, daysAgo: 5, status: "CONFIRMED" },
  { c: 0, st: 1, seats: 1, daysAgo: 5, status: "CANCELLED" },
  { c: 1, st: 7, seats: 5, daysAgo: 6, status: "CONFIRMED" },
];

const code = (bytes) => crypto.randomBytes(bytes).toString("hex").toUpperCase();
const stamp = (d) => d.toISOString().slice(0, 10).replaceAll("-", "");

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to create demo data in production.");
  }

  const already = await prisma.user.count({
    where: { email: { in: CUSTOMERS.map((c) => c.email) } },
  });
  if (already > 0) {
    console.log("Demo data already exists. Nothing to do.");
    return;
  }

  const showtimes = await prisma.showtime.findMany({
    where: { status: "SCHEDULED", startTime: { gt: new Date() } },
    orderBy: [{ startTime: "asc" }, { id: "asc" }],
    take: 12,
  });
  if (showtimes.length < 8)
    throw new Error(
      "Run `npm run db:seed` first: not enough upcoming showtimes.",
    );

  const passwordHash = await bcrypt.hash(
    crypto.randomBytes(24).toString("hex"),
    10,
  );
  const users = [];
  for (const customer of CUSTOMERS) {
    users.push(
      await prisma.user.create({
        data: { ...customer, passwordHash, role: "CUSTOMER" },
      }),
    );
  }

  let created = 0;
  for (const plan of BOOKINGS) {
    const showtime = showtimes[plan.st];
    const confirmed = plan.status === "CONFIRMED";
    const createdAt = new Date(
      Date.now() - plan.daysAgo * 86400000 - (1 + created) * 3600000,
    );

    await prisma.$transaction(async (tx) => {
      const seats = await tx.showSeat.findMany({
        where: { showtimeId: showtime.id, status: "AVAILABLE" },
        orderBy: { id: "asc" },
        take: plan.seats,
      });
      if (seats.length < plan.seats)
        throw new Error("Not enough free seats for the demo booking.");

      const total = seats.reduce((sum, s) => sum + Number(s.price), 0);
      await tx.booking.create({
        data: {
          bookingReference: `CB-${stamp(createdAt)}-${code(3)}`,
          userId: users[plan.c].id,
          showtimeId: showtime.id,
          status: plan.status,
          totalAmount: total.toFixed(2),
          paymentStatus: confirmed ? "PAID" : "REFUNDED",
          paymentReference: `SIM-${code(5)}`,
          paidAt: createdAt,
          cancelledAt: confirmed
            ? null
            : new Date(createdAt.getTime() + 3600000),
          createdAt,
          bookingSeats: {
            create: seats.map((s) => ({
              showSeatId: s.id,
              price: s.price,
              isActive: confirmed,
              ticket: {
                create: {
                  ticketCode: `TK-${code(5)}`,
                  status: confirmed ? "VALID" : "CANCELLED",
                },
              },
            })),
          },
        },
      });

      // Only confirmed bookings hold their seats.
      if (confirmed) {
        await tx.showSeat.updateMany({
          where: { id: { in: seats.map((s) => s.id) } },
          data: { status: "BOOKED" },
        });
      }
    });
    created++;
  }

  console.log(
    `Demo data created: ${users.length} customers, ${created} bookings.`,
  );
}

main()
  .catch((error) => {
    console.error("Demo seeding failed:", error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
