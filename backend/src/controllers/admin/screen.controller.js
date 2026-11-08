import { asyncHandler } from "../../utils/asyncHandler.js";
import * as screenService from "../../services/admin/screen.service.js";

export const list = asyncHandler(async (req, res) => {
  const screens = await screenService.listScreens();
  res.json({ success: true, data: { screens } });
});

export const getOne = asyncHandler(async (req, res) => {
  const screen = await screenService.getScreen(req.params.id);
  res.json({ success: true, data: { screen } });
});

export const create = asyncHandler(async (req, res) => {
  const screen = await screenService.createScreen(req.body);
  res
    .status(201)
    .json({ success: true, message: "Screen created", data: { screen } });
});

export const update = asyncHandler(async (req, res) => {
  const screen = await screenService.updateScreen(req.params.id, req.body);
  res.json({ success: true, message: "Screen updated", data: { screen } });
});

export const remove = asyncHandler(async (req, res) => {
  await screenService.deleteScreen(req.params.id);
  res.json({ success: true, message: "Screen deleted" });
});

export const getSeats = asyncHandler(async (req, res) => {
  const layout = await screenService.getSeatLayout(req.params.id);
  res.json({ success: true, data: layout });
});

export const generateSeats = asyncHandler(async (req, res) => {
  const layout = await screenService.generateSeatLayout(
    req.params.id,
    req.body,
  );
  res
    .status(201)
    .json({ success: true, message: "Seat layout created", data: layout });
});

export const updateSeat = asyncHandler(async (req, res) => {
  const seat = await screenService.updateSeat(req.params.id, req.body);
  res.json({ success: true, message: "Seat updated", data: { seat } });
});
