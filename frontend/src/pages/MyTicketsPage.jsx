import { useState } from "react";
import { Link } from "react-router-dom";
import { FiChevronRight } from "react-icons/fi";
import { MdOutlineEventSeat } from "react-icons/md";
import Pagination from "../components/ui/Pagination.jsx";
import StatusBadge from "../components/ui/StatusBadge.jsx";
import { EmptyState, ErrorState } from "../components/ui/StateViews.jsx";
import useFetch from "../hooks/useFetch.js";
import * as ticketService from "../services/ticketService.js";
import { formatDateTime } from "../utils/format.js";

export default function MyTicketsPage() {
  const [scope, setScope] = useState("upcoming");
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useFetch(
    () => ticketService.listMyTickets({ scope, page, limit: 10 }),
    [scope, page],
  );
  const tickets = data?.items ?? [];

  const changeScope = (value) => {
    setScope(value);
    setPage(1);
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight">My tickets</h1>
      <p className="mt-1 text-stone-600">
        One ticket for every seat you have booked.
      </p>

      <div
        role="tablist"
        aria-label="Ticket filter"
        className="mt-5 inline-flex rounded-lg bg-stone-200 p-1"
      >
        {[
          ["upcoming", "Upcoming"],
          ["past", "Past"],
        ].map(([value, label]) => (
          <button
            key={value}
            role="tab"
            aria-selected={scope === value}
            onClick={() => changeScope(value)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${scope === value ? "bg-white shadow-sm" : "text-stone-600 hover:text-stone-900"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {loading && !data && (
          <div className="space-y-3" role="status" aria-label="Loading tickets">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-lg border border-stone-200 bg-white"
              />
            ))}
          </div>
        )}
        {error && !data && (
          <div className="rounded-lg border border-stone-200 bg-white">
            <ErrorState message={error} onRetry={reload} />
          </div>
        )}

        {data && tickets.length === 0 && (
          <div className="rounded-lg border border-stone-200 bg-white">
            <EmptyState
              title={
                scope === "upcoming" ? "No upcoming tickets" : "No past tickets"
              }
              hint={
                scope === "upcoming"
                  ? "Book a movie and your tickets will appear here."
                  : "Tickets for shows that have ended appear here."
              }
              action={
                scope === "upcoming" && (
                  <Link to="/" className="text-red-800 underline">
                    Browse movies
                  </Link>
                )
              }
            />
          </div>
        )}

        <ul className={`space-y-3 ${loading ? "opacity-60" : ""}`}>
          {tickets.map((ticket) => (
            <li key={ticket.id}>
              <Link
                to={`/tickets/${ticket.id}`}
                aria-label={`Ticket for ${ticket.movie.title}, seat ${ticket.seat.label}`}
                className="flex items-center gap-4 rounded-lg border border-stone-200 bg-white p-4 transition hover:border-red-800 hover:shadow-sm"
              >
                <span className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-md bg-stone-900 text-white">
                  <MdOutlineEventSeat className="text-lg" />
                  <span className="text-[11px] font-bold leading-none">
                    {ticket.seat.label}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">
                    {ticket.movie.title}
                  </span>
                  <span className="block text-sm text-stone-600">
                    {formatDateTime(ticket.showtime.startTime)} ·{" "}
                    {ticket.screen.name}
                  </span>
                  <span className="block font-mono text-xs text-stone-500">
                    {ticket.bookingReference}
                  </span>
                </span>
                <StatusBadge status={ticket.validity} />
                <FiChevronRight className="shrink-0 text-stone-400" />
              </Link>
            </li>
          ))}
        </ul>

        {data && tickets.length > 0 && (
          <div className="mt-4 overflow-hidden rounded-lg border border-stone-200 bg-white">
            <Pagination pagination={data.pagination} onPageChange={setPage} />
          </div>
        )}
      </div>
    </main>
  );
}
