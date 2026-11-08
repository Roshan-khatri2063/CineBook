import { z } from "zod";

const name = z
  .string({ error: "Screen name is required" })
  .trim()
  .min(1, "Screen name is required")
  .max(50, "Screen name must be at most 50 characters");

export const createScreenSchema = z.strictObject({
  name,
  isActive: z.boolean({ error: "isActive must be true or false" }).default(true),
});

export const updateScreenSchema = z
  .strictObject({ name, isActive: z.boolean({ error: "isActive must be true or false" }) })
  .partial()
  .refine((data) => Object.keys(data).length > 0, "Send at least one field to update");

// Build a whole seat layout: rows A, B, C... each with the same number of seats.
// The LAST `premiumRows` rows (closest to the back) become PREMIUM seats.
export const generateLayoutSchema = z
  .strictObject({
    rows: z.number({ error: "Rows must be a number" }).int("Rows must be a whole number").min(1, "At least 1 row").max(26, "At most 26 rows"),
    seatsPerRow: z.number({ error: "Seats per row must be a number" }).int("Seats per row must be a whole number").min(1, "At least 1 seat per row").max(30, "At most 30 seats per row"),
    premiumRows: z.number({ error: "Premium rows must be a number" }).int("Premium rows must be a whole number").min(0, "Cannot be negative").default(0),
  })
  .refine((data) => data.premiumRows <= data.rows, {
    message: "Premium rows cannot be more than the number of rows",
    path: ["premiumRows"],
  });

export const updateSeatSchema = z
  .strictObject({
    type: z.enum(["STANDARD", "PREMIUM"], { error: "Type must be STANDARD or PREMIUM" }),
    isActive: z.boolean({ error: "isActive must be true or false" }),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, "Send at least one field to update");
