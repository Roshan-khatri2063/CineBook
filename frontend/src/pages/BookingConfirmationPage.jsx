import { Link, useParams } from "react-router-dom";
import { FiCheckCircle } from "react-icons/fi";
import PosterImage from "../components/movies/PosterImage.jsx";
import StepIndicator from "../components/booking/StepIndicator.jsx";
import StatusBadge from "../components/ui/StatusBadge.jsx";
import { ErrorState, TableSkeleton } from "../components/ui/StateViews.jsx";
import useFetch from "../hooks/useFetch.js";
import * as bookingService from "../services/bookingService.js";
import { formatCurrency, formatDateTime } from "../utils/format.js";

export default function BookingConfirmationPage() {
  const { id } = useParams();
  const {
    data: booking,
    loading,
    error,
    reload,
  } = useFetch(() => bookingService.getBooking(id), [id]);

  if (loading && !booking)
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-lg border border-stone-200 bg-white">
          <TableSkeleton rows={6} />
        </div>
      </div>
    );
  if (error && !booking) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-lg border border-stone-200 bg-white">
          <ErrorState message={error} onRetry={reload} />
        </div>
        <p className="mt-4 text-center">
          <Link to="/" className="text-red-800 underline">
            Back to all movies
          </Link>
        </p>
      </div>
    );
  }

  const { showtime, payment } = booking;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex justify-center">
        <StepIndicator current={3} />
      </div>

      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-center">
        <FiCheckCircle className="mx-auto text-5xl text-emerald-600" />
        <h1 className="mt-3 text-2xl font-bold tracking-tight">
          Booking confirmed!
        </h1>
        <p className="mt-1 text-stone-700">
          Your seats are reserved and your tickets are ready.
        </p>
        <p className="mt-4 text-xs uppercase tracking-wide text-stone-500">
          Booking reference
        </p>
        <p
          className="font-mono text-2xl font-bold tracking-wider"
          data-testid="booking-reference"
        >
          {booking.bookingReference}
        </p>
      </div>

      <section
        className="mt-6 flex gap-4 rounded-lg border border-stone-200 bg-white p-5"
        aria-label="Movie"
      >
        <PosterImage
          movie={showtime.movie}
          className="aspect-[2/3] w-20 shrink-0 rounded-md"
        />
        <div>
          <h2 className="text-lg font-semibold">{showtime.movie.title}</h2>
          <p className="text-stone-600">{formatDateTime(showtime.startTime)}</p>
          <p className="text-stone-600">{showtime.screen.name}</p>
        </div>
      </section>

      <section
        className="mt-4 rounded-lg border border-stone-200 bg-white p-5"
        aria-label="Tickets"
      >
        <h2 className="font-semibold">Tickets ({booking.seatCount})</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-200 text-stone-500">
              <tr>
                <th className="py-2 font-medium">Seat</th>
                <th className="py-2 font-medium">Type</th>
                <th className="py-2 font-medium">Ticket code</th>
                <th className="py-2 text-right font-medium">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {booking.seats.map((seat) => (
                <tr key={seat.id}>
                  <td className="py-2 font-semibold">{seat.label}</td>
                  <td className="py-2">
                    {seat.type === "PREMIUM" ? "Premium" : "Standard"}
                  </td>
                  <td className="py-2 font-mono text-xs">{seat.ticketCode}</td>
                  <td className="py-2 text-right">
                    {formatCurrency(seat.price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex justify-between border-t border-stone-200 pt-3 text-lg font-bold">
          <span>Total paid</span>
          <span>{formatCurrency(booking.totalAmount)}</span>
        </div>
      </section>

      <section
        className="mt-4 rounded-lg border border-stone-200 bg-white p-5"
        aria-label="Payment"
      >
        <h2 className="font-semibold">Payment</h2>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-stone-500">Status</dt>
            <dd>
              <StatusBadge status={payment.status} />{" "}
              <span className="text-xs text-stone-500">
                (simulated payment)
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-stone-500">Payment reference</dt>
            <dd className="font-mono text-xs">{payment.reference}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Paid on</dt>
            <dd>{formatDateTime(payment.paidAt)}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Booking status</dt>
            <dd>
              <StatusBadge status={booking.status} />
            </dd>
          </div>
        </dl>
      </section>

      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          to={`/bookings/${booking.id}/tickets`}
          className="inline-block rounded-md bg-red-800 px-5 py-2.5 font-medium text-white hover:bg-red-900"
        >
          View my tickets
        </Link>
        <Link
          to="/"
          className="inline-block rounded-md border border-stone-300 bg-white px-5 py-2.5 font-medium hover:bg-stone-100"
        >
          Browse more movies
        </Link>
      </div>
    </main>
  );
}
