import { checkDatabase } from "../services/health.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getHealth = asyncHandler(async (req, res) => {
  const databaseUp = await checkDatabase();

  res.status(databaseUp ? 200 : 503).json({
    success: databaseUp,
    status: databaseUp ? "ok" : "degraded",
    service: "cinebook-lite-api",
    database: databaseUp ? "connected" : "disconnected",
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});
