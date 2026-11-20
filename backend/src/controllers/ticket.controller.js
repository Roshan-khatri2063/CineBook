import { asyncHandler } from "../utils/asyncHandler.js";
import * as ticketService from "../services/ticket.service.js";

export const list = asyncHandler(async (req, res) => {
  const data = await ticketService.listMyTickets(req.user.id, req.query);
  res.json({ success: true, data });
});

export const getOne = asyncHandler(async (req, res) => {
  const ticket = await ticketService.getMyTicket(req.user.id, req.params.id);
  res.json({ success: true, data: { ticket } });
});

export const forBooking = asyncHandler(async (req, res) => {
  const data = await ticketService.getMyBookingTickets(
    req.user.id,
    req.params.id,
  );
  res.json({ success: true, data });
});
