import { z } from "zod";

// strictObject rejects unknown fields. That means a request such as
// { ..., "role": "ADMIN" } is refused with a 400 instead of being ignored.

const name = z
  .string({ error: "Name is required" })
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name must be at most 100 characters");

const email = z
  .string({ error: "Email is required" })
  .trim()
  .toLowerCase()
  .max(255, "Email is too long")
  .email("Enter a valid email address");

const phone = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z
    .string()
    .trim()
    .regex(/^\+?[0-9\s-]{7,15}$/, "Enter a valid phone number")
    .optional(),
);

// bcrypt only uses the first 72 BYTES of a password, so longer ones are refused.
const newPassword = z
  .string({ error: "Password is required" })
  .min(8, "Password must be at least 8 characters")
  .refine((v) => Buffer.byteLength(v, "utf8") <= 72, "Password is too long (max 72 bytes)")
  .refine((v) => /[A-Za-z]/.test(v) && /[0-9]/.test(v), "Password must contain a letter and a number");

export const registerSchema = z.strictObject({
  name,
  email,
  phone,
  password: newPassword,
});

export const loginSchema = z.strictObject({
  email,
  password: z
    .string({ error: "Password is required" })
    .min(1, "Password is required")
    .max(128, "Password is too long"),
});
