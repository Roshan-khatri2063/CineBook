import { Link, useParams } from "react-router-dom";
import { FiArrowLeft, FiPrinter } from "react-icons/fi";
import TicketCard from "../components/tickets/TicketCard.jsx";
import Button from "../components/ui/Button.jsx";
import { ErrorState, TableSkeleton } from "../components/ui/StateViews.jsx";
import useFetch from "../hooks/useFetch.js";
import * as ticketService from "../services/ticketService.js";

// Every ticket of one booking, one per seat. Printing puts one ticket on each page.
export default function BookingTicketsPage() {
  const { id } = useParams();
  const { data, loading, error, reload } = useFetch(
    () => ticketService.getBookingTickets(id),
    [id],
  );

  if (loading && !data)
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-lg border border-stone-200 bg-white">
          <TableSkeleton rows={6} />
        </div>
      </div>
    );
  if (error && !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-lg border border-stone-200 bg-white">
          <ErrorState message={error} onRetry={reload} />
        </div>
        <p className="mt-4 text-center">
          <Link to="/tickets" className="text-red-800 underline">
            Back to my tickets
          </Link>
        </p>
      </div>
    );
  }

  const { booking, tickets } = data;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 print:max-w-none print:p-0">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between print:hidden">
        <div>
          <Link
            to="/tickets"
            className="mb-2 inline-flex items-center gap-1 text-sm text-stone-600 hover:text-stone-900"
          >
            <FiArrowLeft /> My tickets
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Your tickets</h1>
          <p className="text-stone-600">
            Booking{" "}
            <span className="font-mono text-sm">
              {booking.bookingReference}
            </span>{" "}
            · {tickets.length} ticket{tickets.length === 1 ? "" : "s"}
          </p>
        </div>
        <Button onClick={() => window.print()}>
          <FiPrinter /> Print all tickets
        </Button>
      </div>

      <div className="space-y-6 print:space-y-0">
        {tickets.map((ticket) => (
          <div key={ticket.id} className="print:break-after-page">
            <TicketCard ticket={ticket} />
            <p className="mt-2 text-right text-sm print:hidden">
              <Link
                to={`/tickets/${ticket.id}`}
                className="text-red-800 underline"
              >
                Open this ticket on its own
              </Link>
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
