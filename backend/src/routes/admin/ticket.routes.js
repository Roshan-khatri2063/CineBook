import { Router } from "express";
import * as controller from "../../controllers/admin/ticket.controller.js";
import { validate } from "../../middleware/validate.js";
import { scanTicketSchema } from "../../validators/admin/ticket.validator.js";

// Entrance verification. Already behind the admin-only guard in routes/admin/index.js.
const router = Router();

router.post("/verify", validate(scanTicketSchema), controller.verify); // read-only check
router.post("/check-in", validate(scanTicketSchema), controller.checkIn); // marks the ticket USED

export default router;
