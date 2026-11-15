import api from "./api.js";

// Public movie catalogue (no login needed).
export const listMovies = (params) =>
  api.get("/movies", { params }).then((r) => r.data.data);
export const listGenres = () =>
  api.get("/movies/genres").then((r) => r.data.data.genres);
export const getMovie = (id) =>
  api.get(`/movies/${id}`).then((r) => r.data.data.movie);
export const getMovieShowtimes = (id) =>
  api.get(`/movies/${id}/showtimes`).then((r) => r.data.data.showtimes);
