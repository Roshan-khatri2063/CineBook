import { z } from "zod";

// GET /api/tickets?scope=upcoming|past|all
export const listTicketsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  scope: z.preprocess((v) => (v === "" ? undefined : v), z.enum(["upcoming", "past", "all"]).default("upcoming")),
});
