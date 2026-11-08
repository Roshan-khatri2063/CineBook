import { Router } from "express";
import * as controller from "../../controllers/admin/screen.controller.js";
import { validate } from "../../middleware/validate.js";
import { idParamSchema } from "../../validators/common.js";
import { updateSeatSchema } from "../../validators/admin/screen.validator.js";

const router = Router();

// Change one seat (type or availability)
router.patch("/:id", validate(idParamSchema, "params"), validate(updateSeatSchema), controller.updateSeat);

export default router;
