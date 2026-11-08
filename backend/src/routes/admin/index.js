import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth.js";
import movieRoutes from "./movie.routes.js";
import screenRoutes from "./screen.routes.js";
import seatRoutes from "./seat.routes.js";
import showtimeRoutes from "./showtime.routes.js";
import bookingRoutes from "./booking.routes.js";
import customerRoutes from "./customer.routes.js";
import statsRoutes from "./stats.routes.js";

// Every route under /api/admin requires a logged-in ADMIN.
// The guard is applied once here, so no admin route can forget it.
const router = Router();

router.use(authenticate, authorize("ADMIN"));

router.use("/movies", movieRoutes);
router.use("/screens", screenRoutes);
router.use("/seats", seatRoutes);
router.use("/showtimes", showtimeRoutes);
router.use("/bookings", bookingRoutes);
router.use("/customers", customerRoutes);
router.use("/stats", statsRoutes);

export default router;
