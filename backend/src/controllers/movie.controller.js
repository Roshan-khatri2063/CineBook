import { asyncHandler } from "../utils/asyncHandler.js";
import * as movieService from "../services/movie.service.js";

export const list = asyncHandler(async (req, res) => {
  const data = await movieService.listMovies(req.query);
  res.json({ success: true, data });
});

export const genres = asyncHandler(async (req, res) => {
  const genres = await movieService.listGenres();
  res.json({ success: true, data: { genres } });
});

export const getOne = asyncHandler(async (req, res) => {
  const movie = await movieService.getMovie(req.params.id);
  res.json({ success: true, data: { movie } });
});

export const showtimes = asyncHandler(async (req, res) => {
  const showtimes = await movieService.listMovieShowtimes(req.params.id);
  res.json({ success: true, data: { showtimes } });
});
