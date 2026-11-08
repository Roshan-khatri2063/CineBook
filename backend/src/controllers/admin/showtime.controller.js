import { asyncHandler } from "../../utils/asyncHandler.js";
import * as showtimeService from "../../services/admin/showtime.service.js";

export const list = asyncHandler(async (req, res) => {
  const data = await showtimeService.listShowtimes(req.query);
  res.json({ success: true, data });
});

export const getOne = asyncHandler(async (req, res) => {
  const showtime = await showtimeService.getShowtime(req.params.id);
  res.json({ success: true, data: { showtime } });
});

export const create = asyncHandler(async (req, res) => {
  const showtime = await showtimeService.createShowtime(req.body);
  res
    .status(201)
    .json({ success: true, message: "Showtime scheduled", data: { showtime } });
});

export const update = asyncHandler(async (req, res) => {
  const showtime = await showtimeService.updateShowtime(
    req.params.id,
    req.body,
  );
  res.json({ success: true, message: "Showtime updated", data: { showtime } });
});

export const cancel = asyncHandler(async (req, res) => {
  const showtime = await showtimeService.cancelShowtime(req.params.id);
  res.json({
    success: true,
    message: "Showtime cancelled",
    data: { showtime },
  });
});

export const remove = asyncHandler(async (req, res) => {
  await showtimeService.deleteShowtime(req.params.id);
  res.json({ success: true, message: "Showtime deleted" });
});
