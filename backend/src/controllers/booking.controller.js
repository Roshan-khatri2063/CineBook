import { asyncHandler } from "../utils/asyncHandler.js";
import * as bookingService from "../services/booking.service.js";

export const create = asyncHandler(async (req, res) => {
  const booking = await bookingService.createBooking(req.user.id, req.body);
  res.status(201).json({ success: true, message: "Booking confirmed", data: { booking } });
});

export const getOne = asyncHandler(async (req, res) => {
  const booking = await bookingService.getMyBooking(req.user.id, req.params.id);
  res.json({ success: true, data: { booking } });
});
