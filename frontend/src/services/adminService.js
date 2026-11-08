import api from "./api.js";

// Every admin API call lives here. Pages never build URLs themselves.
const data = (response) => response.data.data;

// Dashboard
export const getStats = () =>
  api.get("/admin/stats").then((r) => data(r).stats);

// Movies
export const listMovies = (params) =>
  api.get("/admin/movies", { params }).then(data);
export const createMovie = (body) => api.post("/admin/movies", body).then(data);
export const updateMovie = (id, body) =>
  api.patch(`/admin/movies/${id}`, body).then(data);
export const deleteMovie = (id) => api.delete(`/admin/movies/${id}`);

// Screens and seats
export const listScreens = () =>
  api.get("/admin/screens").then((r) => data(r).screens);
export const createScreen = (body) =>
  api.post("/admin/screens", body).then(data);
export const updateScreen = (id, body) =>
  api.patch(`/admin/screens/${id}`, body).then(data);
export const deleteScreen = (id) => api.delete(`/admin/screens/${id}`);
export const getSeatLayout = (id) =>
  api.get(`/admin/screens/${id}/seats`).then(data);
export const generateSeatLayout = (id, body) =>
  api.post(`/admin/screens/${id}/seats/generate`, body).then(data);
export const updateSeat = (id, body) =>
  api.patch(`/admin/seats/${id}`, body).then(data);

// Showtimes
export const listShowtimes = (params) =>
  api.get("/admin/showtimes", { params }).then(data);
export const createShowtime = (body) =>
  api.post("/admin/showtimes", body).then(data);
export const updateShowtime = (id, body) =>
  api.patch(`/admin/showtimes/${id}`, body).then(data);
export const cancelShowtime = (id) =>
  api.post(`/admin/showtimes/${id}/cancel`).then(data);
export const deleteShowtime = (id) => api.delete(`/admin/showtimes/${id}`);

// Bookings (read only)
export const listBookings = (params) =>
  api.get("/admin/bookings", { params }).then(data);
export const getBooking = (id) =>
  api.get(`/admin/bookings/${id}`).then((r) => data(r).booking);

// Customers
export const listCustomers = (params) =>
  api.get("/admin/customers", { params }).then(data);
export const setCustomerActive = (id, isActive) =>
  api.patch(`/admin/customers/${id}/status`, { isActive }).then(data);
