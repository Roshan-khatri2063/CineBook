// Double-booking check. Run it while the API is running:
//     npm run check:concurrency
//
// It creates 12 throw-away customers, makes them book the SAME seats at the
// SAME instant, and checks that exactly one booking wins every time. When it
// finishes it deletes everything it created (users, bookings, tickets) and
// frees the seats again. It never touches other people's data.
import "dotenv/config";
import prisma from "../src/config/prisma.js";

const API = `http://localhost:${process.env.PORT || 5000}/api`;
const CARD = {
  cardholderName: "Race Test",
  cardNumber: "4242424242424242",
  expiry: "12/30",
  cvc: "123",
};

let passed = 0;
let failed = 0;
const check = (name, ok, extra = "") => {
  ok ? passed++ : failed++;
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "  -> " + JSON.stringify(extra)}`,
  );
};

const call = async (method, path, body, token) => {
  const res = await fetch(API + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, json: await res.json().catch(() => null) };
};

async function main() {
  const health = await call("GET", "/health").catch(() => null);
  if (!health || health.status !== 200)
    throw new Error(
      `The API is not running at ${API}. Start it with "npm run dev" first.`,
    );

  // 1. Throw-away customers
  const stamp = Date.now();
  const racers = await Promise.all(
    Array.from({ length: 12 }, async (_, i) => {
      const email = `race${stamp}_${i}@example.com`;
      const r = await call("POST", "/auth/register", {
        name: `Racer ${i + 1}`,
        email,
        password: "Password123",
      });
      if (r.status !== 201)
        throw new Error(
          `Could not create test customer: ${JSON.stringify(r.json)}`,
        );
      return { id: r.json.data.user.id, token: r.json.data.token };
    }),
  );
  console.log(`Created ${racers.length} test customers.`);

  try {
    // 2. A showtime with plenty of free seats. Seats are taken from the BACK of the
    //    map, so the demo bookings at the front are left alone.
    const candidates = await prisma.showtime.findMany({
      where: {
        status: "SCHEDULED",
        startTime: { gt: new Date(Date.now() + 60 * 60 * 1000) },
      },
      orderBy: { startTime: "asc" },
      take: 20,
    });
    let showtimeId = null;
    let free = [];
    for (const candidate of candidates) {
      const map = (await call("GET", `/showtimes/${candidate.id}/seats`)).json
        ?.data;
      const available = (map?.seats ?? [])
        .filter((s) => s.status === "AVAILABLE")
        .reverse();
      if (available.length >= 40) {
        showtimeId = candidate.id;
        free = available;
        break;
      }
    }
    if (!showtimeId)
      throw new Error(
        "No upcoming showtime with at least 40 free seats. Run `npm run db:seed` first.",
      );
    console.log(`Using showtime #${showtimeId}.\n`);

    let next = 0;
    const takeSeats = (n) => free.slice(next, (next += n));
    const request = (racer, seats) => ({
      racer,
      seats,
      body: {
        showtimeId,
        showSeatIds: seats.map((s) => s.id),
        expectedTotal: seats.reduce((sum, s) => sum + Number(s.price), 0),
        payment: CARD,
      },
    });
    const fire = (reqs) =>
      Promise.all(
        reqs.map(async (r) => ({
          ...(await call("POST", "/bookings", r.body, r.racer.token)),
          req: r,
        })),
      );
    const winners = (results) => results.filter((r) => r.status === 201);

    // 3. Two customers, one seat, same instant (10 rounds)
    let oneWinner = 0;
    let refusedWithCode = 0;
    let lastRound = [];
    for (let round = 0; round < 10; round++) {
      const [seat] = takeSeats(1);
      const results = await fire([
        request(racers[0], [seat]),
        request(racers[1], [seat]),
      ]);
      const loser = results.find((r) => r.status !== 201);
      if (winners(results).length === 1 && loser?.status === 409) oneWinner++;
      if (loser?.json?.code === "SEATS_UNAVAILABLE") refusedWithCode++;
      lastRound = results.map((r) => ({
        status: r.status,
        code: r.json?.code ?? null,
        message: r.json?.message ?? null,
      }));
    }
    check(
      "2 customers, same seat, same instant, 10 rounds: exactly one wins, the other gets 409",
      oneWinner === 10,
      { oneWinner, lastRound },
    );
    check(
      "the refused customer is told why (error code SEATS_UNAVAILABLE)",
      refusedWithCode === 10,
      {
        refusedWithCode,
        lastRound,
        hint: "Responses have no 'code'. Make sure backend/src/utils/AppError.js and backend/src/middleware/errorHandler.js are the latest versions, then restart the API.",
      },
    );

    // 4. Twelve customers, one seat
    const [single] = takeSeats(1);
    let results = await fire(racers.map((r) => request(r, [single])));
    check(
      "12 customers, one seat: exactly 1 booking, 11 refused with 409",
      winners(results).length === 1 &&
        results.filter((r) => r.status === 409).length === 11,
      results.map((r) => ({ status: r.status, code: r.json?.code ?? null })),
    );

    // 5. Overlapping seats in different orders (deadlock check)
    let orderOk = true;
    for (let round = 0; round < 6; round++) {
      const [a, b, c] = takeSeats(3);
      results = await fire([
        request(racers[0], [a, b, c]),
        request(racers[1], [c, b, a]),
        request(racers[2], [b, c, a]),
        request(racers[3], [b, a, c]),
      ]);
      if (
        winners(results).length !== 1 ||
        !results.every((r) => [201, 409].includes(r.status))
      )
        orderOk = false;
    }
    check(
      "same 3 seats requested in different orders (6 rounds): one winner, no deadlock, no errors",
      orderOk,
    );

    // 6. Everything is consistent in the database
    const bookingSeats = await prisma.bookingSeat.findMany({
      where: {
        isActive: true,
        booking: { userId: { in: racers.map((r) => r.id) } },
      },
    });
    const ids = bookingSeats.map((b) => b.showSeatId);
    const booked = await prisma.showSeat.count({
      where: { id: { in: ids }, status: "BOOKED" },
    });
    check(
      "no seat is held by two bookings, and every held seat is marked BOOKED",
      new Set(ids).size === ids.length && booked === ids.length,
      { held: ids.length, booked },
    );
  } finally {
    // 7. Clean up everything this script created
    const userIds = racers.map((r) => r.id);
    const mine = await prisma.bookingSeat.findMany({
      where: { booking: { userId: { in: userIds } } },
      select: { id: true, showSeatId: true },
    });
    await prisma.$transaction([
      prisma.ticket.deleteMany({
        where: { bookingSeatId: { in: mine.map((m) => m.id) } },
      }),
      prisma.bookingSeat.deleteMany({
        where: { id: { in: mine.map((m) => m.id) } },
      }),
      prisma.booking.deleteMany({ where: { userId: { in: userIds } } }),
      prisma.showSeat.updateMany({
        where: { id: { in: mine.map((m) => m.showSeatId) } },
        data: { status: "AVAILABLE" },
      }),
      prisma.user.deleteMany({ where: { id: { in: userIds } } }),
    ]);
    console.log(
      "\nCleaned up: test customers, their bookings and tickets removed, seats freed.",
    );
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exitCode = failed ? 1 : 0;
}

main()
  .catch((error) => {
    console.error("\nCheck could not finish:", error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
