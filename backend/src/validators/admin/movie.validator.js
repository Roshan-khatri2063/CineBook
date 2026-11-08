import { z } from "zod";
import { optionalQuery, paginationShape } from "../common.js";

const MOVIE_STATUSES = ["NOW_SHOWING", "COMING_SOON", "ENDED"];
const movieStatus = z.enum(MOVIE_STATUSES, {
  error: `Status must be one of: ${MOVIE_STATUSES.join(", ")}`,
});

const text = (label, max) =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be at most ${max} characters`);

// Only http(s) links are accepted, so "javascript:..." can never be stored.
const httpUrl = z
  .string()
  .trim()
  .max(500, "URL is too long")
  .refine((value) => {
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }, "Enter a valid http:// or https:// URL");

const optionalUrl = z.preprocess(
  (v) => (v === "" ? null : v),
  httpUrl.nullable().optional(),
);

const releaseDate = z
  .string({ error: "Release date is required" })
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the format YYYY-MM-DD")
  .refine(
    (value) => !Number.isNaN(new Date(value).getTime()),
    "Enter a valid date",
  )
  .transform((value) => new Date(value));

const baseFields = {
  title: text("Title", 200),
  description: text("Description", 5000),
  genre: text("Genre", 50),
  language: text("Language", 50),
  durationMinutes: z
    .number({ error: "Duration must be a number of minutes" })
    .int("Duration must be a whole number")
    .min(1, "Duration must be at least 1 minute")
    .max(600, "Duration must be at most 600 minutes"),
  releaseDate,
  ageRating: z.preprocess(
    (v) => (v === "" ? null : v),
    z.string().trim().max(10).nullable().optional(),
  ),
  posterUrl: optionalUrl,
  trailerUrl: optionalUrl,
};

export const createMovieSchema = z.strictObject({
  ...baseFields,
  status: movieStatus.default("COMING_SOON"),
});

// Every field optional, but at least one must be sent.
export const updateMovieSchema = z
  .strictObject({ ...baseFields, status: movieStatus })
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    "Send at least one field to update",
  );

export const listMoviesQuerySchema = z.object({
  ...paginationShape,
  q: optionalQuery(z.string().trim().max(100)),
  status: optionalQuery(movieStatus),
  genre: optionalQuery(z.string().trim().max(50)),
});
