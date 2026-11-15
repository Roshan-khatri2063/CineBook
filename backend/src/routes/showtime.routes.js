import { Router } from "express";
import * as controller from "../controllers/showtime.controller.js";
import { validate } from "../middleware/validate.js";
import { idParamSchema } from "../validators/common.js";

// Public: the seat map can be viewed without logging in.
const router = Router();

router.get("/:id/seats", validate(idParamSchema, "params"), controller.seatMap);

export default router;
