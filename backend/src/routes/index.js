import { Router } from "express";
import healthRoutes from "./health.routes.js";
import authRoutes from "./auth.routes.js";
import protectedRoutes from "./protected.routes.js";
import adminRoutes from "./admin/index.js";
import movieRoutes from "./movie.routes.js";
import showtimeRoutes from "./showtime.routes.js";
import bookingRoutes from "./booking.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/protected", protectedRoutes); // temporary, for testing roles
router.use("/admin", adminRoutes);
router.use("/movies", movieRoutes);
router.use("/showtimes", showtimeRoutes);
router.use("/bookings", bookingRoutes);
// Later modules register their routes here.

export default router;
