import app from "./app.js";
import { env } from "./config/env.js";
import prisma from "./config/prisma.js";

const server = app.listen(env.PORT, () => {
  console.log(`CineBook Lite API running on http://localhost:${env.PORT}`);
  console.log(`Health check: http://localhost:${env.PORT}/api/health`);
});

// Close the server and database connection cleanly on Ctrl+C.
const shutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
