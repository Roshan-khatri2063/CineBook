import { z } from "zod";
import { MAX_SEATS_PER_BOOKING } from "../config/bookingRules.js";

const id = (label) =>
  z.number({ error: `${label} is required` }).int(`${label} is invalid`).positive(`${label} is invalid`);

// Simulated card form. The server only checks the format and the decline rule.
// Card details are NEVER stored or logged.
const paymentSchema = z.strictObject({
  cardholderName: z.string({ error: "Cardholder name is required" }).trim().min(2, "Cardholder name is required").max(100),
  cardNumber: z
    .string({ error: "Card number is required" })
    .transform((value) => value.replace(/[\s-]/g, ""))
    .pipe(z.string().regex(/^\d{12,19}$/, "Enter a valid card number")),
  expiry: z.string({ error: "Expiry date is required" }).regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Use the format MM/YY"),
  cvc: z.string({ error: "CVC is required" }).regex(/^\d{3,4}$/, "Enter the 3 or 4 digit CVC"),
});

// The client sends WHICH seats it wants and the total it was shown.
// It never sends prices: prices always come from the database.
export const createBookingSchema = z.strictObject({
  showtimeId: id("Showtime"),
  showSeatIds: z
    .array(id("Seat"), { error: "Select at least one seat" })
    .min(1, "Select at least one seat")
    .max(MAX_SEATS_PER_BOOKING, `You can book at most ${MAX_SEATS_PER_BOOKING} seats at once`)
    .refine((ids) => new Set(ids).size === ids.length, "The same seat was selected twice"),
  expectedTotal: z
    .number({ error: "Expected total is required" })
    .min(0)
    .refine((v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6, "Total can have at most 2 decimals"),
  payment: paymentSchema,
});
