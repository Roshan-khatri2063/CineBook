import { Router } from "express";
import * as controller from "../../controllers/admin/screen.controller.js";
import { validate } from "../../middleware/validate.js";
import { idParamSchema } from "../../validators/common.js";
import {
  createScreenSchema,
  generateLayoutSchema,
  updateScreenSchema,
} from "../../validators/admin/screen.validator.js";

const router = Router();
const withId = validate(idParamSchema, "params");

router.get("/", controller.list);
router.post("/", validate(createScreenSchema), controller.create);
router.get("/:id", withId, controller.getOne);
router.patch("/:id", withId, validate(updateScreenSchema), controller.update);
router.delete("/:id", withId, controller.remove);

// Seat layout of one screen
router.get("/:id/seats", withId, controller.getSeats);
router.post("/:id/seats/generate", withId, validate(generateLayoutSchema), controller.generateSeats);

export default router;
