import { asyncHandler } from "../../utils/asyncHandler.js";
import * as ticketService from "../../services/admin/ticket.service.js";

export const verify = asyncHandler(async (req, res) => {
  const data = await ticketService.verifyTicket(req.body.token);
  res.json({ success: true, message: "Ticket is valid", data });
});

export const checkIn = asyncHandler(async (req, res) => {
  const data = await ticketService.checkInTicket(req.body.token);
  res.json({ success: true, message: "Ticket checked in", data });
});
