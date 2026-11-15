import { z } from "zod";
import { optionalQuery } from "./common.js";

// Public movie browsing. ENDED movies are never shown to customers.
export const listMoviesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  q: optionalQuery(z.string().trim().max(100)),
  genre: optionalQuery(z.string().trim().max(50)),
  status: optionalQuery(z.enum(["NOW_SHOWING", "COMING_SOON"])),
});
