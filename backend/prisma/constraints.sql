
-- CineBook Lite - extra database constraints (ASCII only on purpose)
-- Appended to the "init" migration. Prisma cannot express these in
-- schema.prisma, but PostgreSQL enforces them on every write.


-- Needed for the "no overlapping showtimes" rule below.
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ---- CHECK constraints: values must make sense -----------------------
ALTER TABLE "movies"
  ADD CONSTRAINT "movies_duration_positive" CHECK ("durationMinutes" > 0);

ALTER TABLE "seats"
  ADD CONSTRAINT "seats_number_positive" CHECK ("seatNumber" > 0);

ALTER TABLE "showtimes"
  ADD CONSTRAINT "showtimes_end_after_start" CHECK ("endTime" > "startTime"),
  ADD CONSTRAINT "showtimes_prices_not_negative" CHECK ("standardPrice" >= 0 AND "premiumPrice" >= 0);

ALTER TABLE "show_seats"
  ADD CONSTRAINT "show_seats_price_not_negative" CHECK ("price" >= 0);

ALTER TABLE "bookings"
  ADD CONSTRAINT "bookings_total_not_negative" CHECK ("totalAmount" >= 0),
  ADD CONSTRAINT "bookings_cancelled_has_date" CHECK ("status" <> 'CANCELLED' OR "cancelledAt" IS NOT NULL);

ALTER TABLE "booking_seats"
  ADD CONSTRAINT "booking_seats_price_not_negative" CHECK ("price" >= 0);

-- ---- A screen cannot show two movies at the same time ----------------
-- Cancelled showtimes are ignored. Back-to-back showtimes are allowed
-- because the time range includes the start but not the end.
ALTER TABLE "showtimes"
  ADD CONSTRAINT "showtimes_no_overlap_per_screen"
  EXCLUDE USING gist (
    "screenId" WITH =,
    tsrange("startTime", "endTime", '[)') WITH &&
  ) WHERE ("status" = 'SCHEDULED');

-- ---- A show seat can have only ONE active booking --------------------
-- This is the last line of defence against double booking.
-- Cancelled bookings set isActive = false, so the seat can be booked again.
ALTER TABLE "booking_seats"
  ADD CONSTRAINT "booking_seats_one_active_per_show_seat"
  EXCLUDE USING btree ("showSeatId" WITH =) WHERE ("isActive");
