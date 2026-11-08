import { asyncHandler } from "../../utils/asyncHandler.js";
import * as movieService from "../../services/admin/movie.service.js";

export const list = asyncHandler(async (req, res) => {
  const data = await movieService.listMovies(req.query);
  res.json({ success: true, data });
});

export const getOne = asyncHandler(async (req, res) => {
  const movie = await movieService.getMovie(req.params.id);
  res.json({ success: true, data: { movie } });
});

export const create = asyncHandler(async (req, res) => {
  const movie = await movieService.createMovie(req.body);
  res
    .status(201)
    .json({ success: true, message: "Movie created", data: { movie } });
});

export const update = asyncHandler(async (req, res) => {
  const movie = await movieService.updateMovie(req.params.id, req.body);
  res.json({ success: true, message: "Movie updated", data: { movie } });
});

export const remove = asyncHandler(async (req, res) => {
  await movieService.deleteMovie(req.params.id);
  res.json({ success: true, message: "Movie deleted" });
});
