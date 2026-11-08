import { z } from "zod";

// /something/:id  ->  id must be a positive whole number
export const idParamSchema = z.object({
  id: z.coerce.number().int("Invalid id").positive("Invalid id"),
});

// ?page=2&limit=10
export const paginationShape = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
};

// Query strings often contain empty values (?status=). Treat them as "not set".
export const optionalQuery = (schema) =>
  z.preprocess(
    (value) => (value === "" ? undefined : value),
    schema.optional(),
  );

export const booleanQuery = z
  .enum(["true", "false"])
  .transform((value) => value === "true");
