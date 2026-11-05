import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const signToken = (user) =>
  jwt.sign({}, env.JWT_SECRET, {
    subject: String(user.id),
    expiresIn: env.JWT_EXPIRES_IN,
    algorithm: "HS256",
  });

// Throws if the token is invalid, tampered with or expired.
export const verifyToken = (token) =>
  jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] });
