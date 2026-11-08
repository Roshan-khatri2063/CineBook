import { Router } from "express";
import * as controller from "../../controllers/admin/booking.controller.js";
import { validate } from "../../middleware/validate.js";
import { idParamSchema } from "../../validators/common.js";
import { listBookingsQuerySchema } from "../../validators/admin/booking.validator.js";

const router = Router();

// Read-only for now. Cancelling bookings arrives with the booking module.
router.get("/", validate(listBookingsQuerySchema, "query"), controller.list);
router.get("/:id", validate(idParamSchema, "params"), controller.getOne);

export default router;
