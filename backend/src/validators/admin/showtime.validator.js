import { z } from "zod";
import { optionalQuery, paginationShape } from "../common.js";

const dateTime = (label) =>
  z.iso
    .datetime({ offset: true, error: `${label} must be a valid date and time` })
    .transform((value) => new Date(value));

// Money: a JSON number with at most 2 decimals.
const price = (label) =>
  z
    .number({ error: `${label} must be a number` })
    .min(0, `${label} cannot be negative`)
    .max(100000, `${label} is too high`)
    .refine(
      (v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6,
      `${label} can have at most 2 decimals`,
    );

const id = (label) =>
  z
    .number({ error: `${label} is required` })
    .int(`${label} is invalid`)
    .positive(`${label} is invalid`);

export const createShowtimeSchema = z.strictObject({
  movieId: id("Movie"),
  screenId: id("Screen"),
  startTime: dateTime("Start time"),
  standardPrice: price("Standard price"),
  premiumPrice: price("Premium price"),
});

// The movie and the screen of a showtime cannot be changed: its seats are tied
// to the screen. To move a show to another screen, cancel it and create a new one.
export const updateShowtimeSchema = z
  .strictObject({
    startTime: dateTime("Start time"),
    standardPrice: price("Standard price"),
    premiumPrice: price("Premium price"),
  })
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    "Send at least one field to update",
  );

export const listShowtimesQuerySchema = z.object({
  ...paginationShape,
  movieId: optionalQuery(z.coerce.number().int().positive()),
  screenId: optionalQuery(z.coerce.number().int().positive()),
  status: optionalQuery(z.enum(["SCHEDULED", "CANCELLED"])),
  from: optionalQuery(dateTime("From")),
  to: optionalQuery(dateTime("To")),
});
