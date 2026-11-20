import { Router } from "express";
import * as controller from "../controllers/booking.controller.js";
import * as ticketController from "../controllers/ticket.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { idParamSchema } from "../validators/common.js";
import { createBookingSchema } from "../validators/booking.validator.js";

// Customer bookings. Only logged-in CUSTOMER accounts can use these routes.
const router = Router();

router.use(authenticate, authorize("CUSTOMER"));

router.post("/", validate(createBookingSchema), controller.create);
router.get("/:id", validate(idParamSchema, "params"), controller.getOne);
router.get("/:id/tickets", validate(idParamSchema, "params"), ticketController.forBooking);

export default router;
