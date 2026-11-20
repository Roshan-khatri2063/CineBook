import { Router } from "express";
import * as controller from "../controllers/ticket.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { idParamSchema } from "../validators/common.js";
import { listTicketsQuerySchema } from "../validators/ticket.validator.js";

// A customer's own tickets. Only logged-in CUSTOMER accounts can use these routes.
const router = Router();

router.use(authenticate, authorize("CUSTOMER"));

router.get("/", validate(listTicketsQuerySchema, "query"), controller.list);
router.get("/:id", validate(idParamSchema, "params"), controller.getOne);

export default router;
