import { PrismaClient } from "@prisma/client";
import { env } from "./env.js";

// One shared Prisma client for the whole backend.
const prisma = new PrismaClient({
  log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

export default prisma;
