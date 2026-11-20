import prisma from "../../config/prisma.js";
import { AppError } from "../../utils/AppError.js";
import { readQrToken } from "../../utils/ticketToken.js";
import { formatTicket, ticketSelect, validityOf } from "../ticket.service.js";

const REFUSALS = {
  CANCELLED: ["This ticket has been cancelled", "TICKET_CANCELLED"],
  USED: ["This ticket has already been used", "TICKET_ALREADY_USED"],
  EXPIRED: ["The showtime for this ticket has already ended", "TICKET_EXPIRED"],
};

// Forged, damaged, edited or unknown tickets all look the same on purpose.
const invalidTicket = () =>
  new AppError("This ticket is not valid", 404, null, "INVALID_TICKET");

const findByToken = async (token) => {
  const ticketCode = readQrToken(token); // checks the signature
  if (!ticketCode) throw invalidTicket();
  const ticket = await prisma.ticket.findUnique({
    where: { ticketCode },
    select: ticketSelect,
  });
  if (!ticket) throw invalidTicket();
  return ticket;
};

// Refused tickets still come back with their details, so the person at the entrance
// can see WHY (for example "already used at 19:42").
const refusal = (ticket) => {
  const [message, code] = REFUSALS[validityOf(ticket)];
  return new AppError(message, 409, { ticket: formatTicket(ticket) }, code);
};

// Read-only: tells whether the ticket could be used. Changes nothing.
export const verifyTicket = async (token) => {
  const ticket = await findByToken(token);
  if (validityOf(ticket) !== "VALID") throw refusal(ticket);
  return { result: "VALID", ticket: formatTicket(ticket) };
};

// Checks the ticket AND marks it USED, in one atomic step. If two scanners read the
// same ticket at the same moment, the database lets exactly one of them win.
export const checkInTicket = async (token) => {
  const ticket = await findByToken(token);
  if (validityOf(ticket) !== "VALID") throw refusal(ticket);

  const { count } = await prisma.ticket.updateMany({
    where: { id: ticket.id, status: "VALID" },
    data: { status: "USED", usedAt: new Date() },
  });

  const fresh = await prisma.ticket.findUnique({
    where: { id: ticket.id },
    select: ticketSelect,
  });
  if (count === 0) throw refusal(fresh); // somebody else got there first
  return { result: "CHECKED_IN", ticket: formatTicket(fresh) };
};
