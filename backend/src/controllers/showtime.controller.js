import { asyncHandler } from "../utils/asyncHandler.js";
import * as showtimeService from "../services/showtime.service.js";

export const seatMap = asyncHandler(async (req, res) => {
  const data = await showtimeService.getSeatMap(req.params.id);
  res.json({ success: true, data });
});
