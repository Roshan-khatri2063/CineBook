import crypto from "node:crypto";
import { env } from "../config/env.js";

// QR token = "CB1" + "." + ticketCode + "." + signature
//   e.g.  CB1.TK-7M4QX9K2PA.q3JfT0s8VnYp1cZ7aB4dEg
//
// The signature is an HMAC-SHA256 of the ticket code, made with a secret that only
// the server knows (TICKET_QR_SECRET) and cut to 128 bits. Without the secret nobody
// can make a valid token, even if they know a ticket code. The token contains no
// name, email, phone, seat, movie, price or booking reference: it is only a pointer
// that the server looks up and checks.

const VERSION = "CB1";
const TOKEN_PATTERN = /^CB1\.(TK-[A-HJ-NP-Z2-9]{10})\.([A-Za-z0-9_-]{22})$/;

const sign = (ticketCode) =>
  crypto
    .createHmac("sha256", env.TICKET_QR_SECRET)
    .update(`ticket:v1:${ticketCode}`)
    .digest()
    .subarray(0, 16) // 128 bits -> 22 characters
    .toString("base64url");

export const createQrToken = (ticketCode) =>
  `${VERSION}.${ticketCode}.${sign(ticketCode)}`;

// Returns the ticket code if the token is genuine, otherwise null.
// The signature is compared in constant time, so response timing reveals nothing.
export const readQrToken = (token) => {
  const match = TOKEN_PATTERN.exec(
    typeof token === "string" ? token.trim() : "",
  );
  if (!match) return null;

  const [, ticketCode, signature] = match;
  const expected = Buffer.from(sign(ticketCode));
  const given = Buffer.from(signature);
  if (
    expected.length !== given.length ||
    !crypto.timingSafeEqual(expected, given)
  )
    return null;

  return ticketCode;
};
