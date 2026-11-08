import { Router } from "express";
import * as controller from "../../controllers/admin/customer.controller.js";
import { validate } from "../../middleware/validate.js";
import { idParamSchema } from "../../validators/common.js";
import {
  listCustomersQuerySchema,
  updateCustomerStatusSchema,
} from "../../validators/admin/customer.validator.js";

const router = Router();

router.get("/", validate(listCustomersQuerySchema, "query"), controller.list);
router.patch(
  "/:id/status",
  validate(idParamSchema, "params"),
  validate(updateCustomerStatusSchema),
  controller.updateStatus,
);

export default router;
