import prisma from "../config/prisma.js";

// Runs a trivial query to confirm PostgreSQL is reachable.
export const checkDatabase = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error("Database health check failed:", error.message);
    return false;
  }
};
