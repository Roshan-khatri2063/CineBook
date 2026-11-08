import { Router } from "express";
import healthRoutes from "./health.routes.js";
import authRoutes from "./auth.routes.js";
import protectedRoutes from "./protected.routes.js";
import adminRoutes from "./admin/index.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/protected", protectedRoutes); // temporary, for testing roles
router.use("/admin", adminRoutes);
// Later modules register their routes here, e.g. router.use("/movies", movieRoutes);

export default router;
