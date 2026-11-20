import { z } from "zod";

// The text read from a ticket's QR code (or pasted by the person at the entrance).
export const scanTicketSchema = z.strictObject({
  token: z
    .string({ error: "Ticket code is required" })
    .trim()
    .min(1, "Ticket code is required")
    .max(200, "Ticket code is too long"),
});
