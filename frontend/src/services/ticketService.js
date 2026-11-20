import api from "./api.js";

// A customer's own tickets.
export const listMyTickets = (params) => api.get("/tickets", { params }).then((r) => r.data.data);
export const getTicket = (id) => api.get(`/tickets/${id}`).then((r) => r.data.data.ticket); // includes the QR code
export const getBookingTickets = (bookingId) => api.get(`/bookings/${bookingId}/tickets`).then((r) => r.data.data);
