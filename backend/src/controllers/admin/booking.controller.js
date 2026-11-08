import { asyncHandler } from "../../utils/asyncHandler.js";
import * as bookingService from "../../services/admin/booking.service.js";

export const list = asyncHandler(async (req, res) => {
  const data = await bookingService.listBookings(req.query);
  res.json({ success: true, data });
});

export const getOne = asyncHandler(async (req, res) => {
  const booking = await bookingService.getBooking(req.params.id);
  res.json({ success: true, data: { booking } });
});
