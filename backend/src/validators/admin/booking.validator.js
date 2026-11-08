import { z } from "zod";
import { optionalQuery, paginationShape } from "../common.js";

const dateTime = (label) =>
  z.iso
    .datetime({ offset: true, error: `${label} must be a valid date and time` })
    .transform((v) => new Date(v));

export const listBookingsQuerySchema = z.object({
  ...paginationShape,
  status: optionalQuery(z.enum(["CONFIRMED", "CANCELLED"])),
  showtimeId: optionalQuery(z.coerce.number().int().positive()),
  q: optionalQuery(z.string().trim().max(100)), // booking reference, customer name or email
  from: optionalQuery(dateTime("From")),
  to: optionalQuery(dateTime("To")),
});
