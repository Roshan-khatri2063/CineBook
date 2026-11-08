import { Router } from "express";
import * as controller from "../../controllers/admin/showtime.controller.js";
import { validate } from "../../middleware/validate.js";
import { idParamSchema } from "../../validators/common.js";
import {
  createShowtimeSchema,
  listShowtimesQuerySchema,
  updateShowtimeSchema,
} from "../../validators/admin/showtime.validator.js";

const router = Router();
const withId = validate(idParamSchema, "params");

router.get("/", validate(listShowtimesQuerySchema, "query"), controller.list);
router.post("/", validate(createShowtimeSchema), controller.create);
router.get("/:id", withId, controller.getOne);
router.patch("/:id", withId, validate(updateShowtimeSchema), controller.update);
router.post("/:id/cancel", withId, controller.cancel);
router.delete("/:id", withId, controller.remove);

export default router;
