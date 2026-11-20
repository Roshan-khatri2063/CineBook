import StatusBadge from "../ui/StatusBadge.jsx";
import {
  formatDateTime,
  formatLongDate,
  formatTime,
} from "../../utils/format.js";

const NOTICES = {
  USED: (ticket) =>
    `This ticket was used${ticket.usedAt ? ` on ${formatDateTime(ticket.usedAt)}` : ""} and cannot be used again.`,
  CANCELLED: () => "This ticket has been cancelled and is no longer valid.",
  EXPIRED: () => "The showtime for this ticket has already ended.",
};

function Detail({ label, children }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-stone-500">
        {label}
      </dt>
      <dd className="mt-0.5 font-semibold">{children}</dd>
    </div>
  );
}

// The ticket itself. Looks the same on screen and on paper: the page around it
// hides its navigation when printing (see the print: classes on the pages).
export default function TicketCard({ ticket }) {
  const valid = ticket.validity === "VALID";
  const notice = NOTICES[ticket.validity]?.(ticket);

  return (
    <article
      aria-label={`Ticket for ${ticket.movie.title}, seat ${ticket.seat.label}`}
      className="break-inside-avoid overflow-hidden rounded-xl border border-stone-300 bg-white shadow-sm print:shadow-none"
    >
      <header className="flex items-center justify-between bg-stone-900 px-5 py-3 text-white print:[-webkit-print-color-adjust:exact] print:[print-color-adjust:exact]">
        <span className="font-bold tracking-wide">{ticket.cinemaName}</span>
        <StatusBadge status={ticket.validity} />
      </header>

      {notice && (
        <p
          role="alert"
          className="border-b border-amber-200 bg-amber-50 px-5 py-2 text-sm text-amber-900"
        >
          {notice}
        </p>
      )}

      <div className="flex flex-col sm:flex-row">
        <div className="flex-1 p-5">
          <h2 className="text-2xl font-bold leading-tight tracking-tight">
            {ticket.movie.title}
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            {ticket.movie.language}
            {ticket.movie.ageRating ? ` · Rated ${ticket.movie.ageRating}` : ""}
          </p>

          <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <Detail label="Date">
              {formatLongDate(ticket.showtime.startTime)}
            </Detail>
            <Detail label="Time">
              {formatTime(ticket.showtime.startTime)}
            </Detail>
            <Detail label="Screen">{ticket.screen.name}</Detail>
            <Detail label="Seat">
              {ticket.seat.label}{" "}
              <span className="font-normal text-stone-500">
                ({ticket.seat.type === "PREMIUM" ? "Premium" : "Standard"})
              </span>
            </Detail>
            <Detail label="Booking reference">
              <span className="font-mono text-xs">
                {ticket.bookingReference}
              </span>
            </Detail>
            <Detail label="Ticket code">
              <span className="font-mono text-xs">{ticket.ticketCode}</span>
            </Detail>
          </dl>
        </div>

        <div className="flex flex-col items-center justify-center border-t border-dashed border-stone-300 p-5 sm:w-56 sm:border-l sm:border-t-0">
          {ticket.qrCode ? (
            <img
              src={ticket.qrCode}
              alt={`QR code for ticket ${ticket.ticketCode}`}
              className={`h-40 w-40 ${valid ? "" : "opacity-25"}`}
            />
          ) : null}
          <p className="mt-2 text-center text-xs text-stone-500">
            {valid ? "Show this code at the entrance" : "Not valid for entry"}
          </p>
        </div>
      </div>
    </article>
  );
}
