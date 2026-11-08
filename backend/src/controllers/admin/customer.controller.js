import { asyncHandler } from "../../utils/asyncHandler.js";
import * as customerService from "../../services/admin/customer.service.js";

export const list = asyncHandler(async (req, res) => {
  const data = await customerService.listCustomers(req.query);
  res.json({ success: true, data });
});

export const updateStatus = asyncHandler(async (req, res) => {
  const customer = await customerService.setCustomerActive(
    req.params.id,
    req.body.isActive,
  );
  const message = customer.isActive
    ? "Customer activated"
    : "Customer deactivated";
  res.json({ success: true, message, data: { customer } });
});
