import { Router } from "express";
import healthRoutes from "./health.routes.js";

const router = Router();

router.use("/health", healthRoutes);
// Later modules register their routes here, e.g. router.use("/auth", authRoutes);

export default router;
