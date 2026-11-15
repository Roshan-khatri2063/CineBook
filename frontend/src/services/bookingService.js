import api from "./api.js";

export const getSeatMap = (showtimeId) =>
  api.get(`/showtimes/${showtimeId}/seats`).then((r) => r.data.data);

// Sends WHICH seats are wanted and the total the customer saw. Prices are never
// sent: the server works them out from the database.
export const createBooking = (body) =>
  api.post("/bookings", body).then((r) => r.data.data.booking);

export const getBooking = (id) =>
  api.get(`/bookings/${id}`).then((r) => r.data.data.booking);
