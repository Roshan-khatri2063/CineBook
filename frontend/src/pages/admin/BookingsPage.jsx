import { useMemo, useState } from "react";
import { FiEye, FiSearch } from "react-icons/fi";
import Button from "../../components/ui/Button.jsx";
import Modal from "../../components/ui/Modal.jsx";
import PageHeader from "../../components/ui/PageHeader.jsx";
import Pagination from "../../components/ui/Pagination.jsx";
import SelectField from "../../components/ui/SelectField.jsx";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import { EmptyState, ErrorState, TableSkeleton } from "../../components/ui/StateViews.jsx";
import useDebounce from "../../hooks/useDebounce.js";
import useFetch from "../../hooks/useFetch.js";
import * as adminService from "../../services/adminService.js";
import { formatCurrency, formatDateTime } from "../../utils/format.js";

function BookingDetailModal({ bookingId, onClose }) {
  const { data: booking, loading, error, reload } = useFetch(() => adminService.getBooking(bookingId), [bookingId]);

  return (
    <Modal title="Booking details" size="lg" onClose={onClose} footer={<Button variant="secondary" onClick={onClose}>Close</Button>}>
      {loading && !booking && <TableSkeleton rows={4} />}
      {error && !booking && <ErrorState message={error} onRetry={reload} />}
      {booking && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-mono text-sm font-semibold">{booking.bookingReference}</p>
            <div className="flex gap-2"><StatusBadge status={booking.status} /><StatusBadge status={booking.paymentStatus} /></div>
          </div>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-stone-500">Customer</dt><dd className="font-medium">{booking.user.name}</dd><dd className="text-stone-600">{booking.user.email}</dd></div>
            <div><dt className="text-stone-500">Movie</dt><dd className="font-medium">{booking.showtime.movie.title}</dd><dd className="text-stone-600">{booking.showtime.screen.name} · {formatDateTime(booking.showtime.startTime)}</dd></div>
            <div><dt className="text-stone-500">Booked on</dt><dd>{formatDateTime(booking.createdAt)}</dd></div>
            <div><dt className="text-stone-500">Total</dt><dd className="font-semibold">{formatCurrency(booking.totalAmount)}</dd></div>
            {booking.cancelledAt && <div><dt className="text-stone-500">Cancelled on</dt><dd>{formatDateTime(booking.cancelledAt)}</dd></div>}
          </dl>
          <div>
            <h3 className="mb-2 text-sm font-semibold">Tickets ({booking.seatCount})</h3>
            <div className="overflow-x-auto rounded-md border border-stone-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-stone-50 text-stone-600"><tr><th className="px-3 py-2 font-medium">Seat</th><th className="px-3 py-2 font-medium">Type</th><th className="px-3 py-2 font-medium">Price</th><th className="px-3 py-2 font-medium">Ticket code</th><th className="px-3 py-2 font-medium">Status</th></tr></thead>
                <tbody className="divide-y divide-stone-100">
                  {booking.seats.map((seat) => (
                    <tr key={seat.id}>
                      <td className="px-3 py-2 font-medium">{seat.label}</td>
                      <td className="px-3 py-2">{seat.type === "PREMIUM" ? "Premium" : "Standard"}</td>
                      <td className="px-3 py-2">{formatCurrency(seat.price)}</td>
                      <td className="px-3 py-2 font-mono text-xs">{seat.ticketCode ?? "—"}</td>
                      <td className="px-3 py-2">{seat.ticketStatus ? <StatusBadge status={seat.ticketStatus} /> : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function BookingsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState(null);

  const q = useDebounce(search);
  const params = useMemo(() => ({ page, limit: 10, q: q || undefined, status: status || undefined }), [page, q, status]);
  const { data, loading, error, reload } = useFetch(() => adminService.listBookings(params), [params]);
  const items = data?.items ?? [];
  const filtered = Boolean(q || status);

  return (
    <>
      <PageHeader title="Bookings" description="Every booking made by customers. This list is read-only." />

      <div className="rounded-lg border border-stone-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-stone-200 p-4 sm:flex-row">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input type="search" aria-label="Search bookings" placeholder="Reference, customer name or email…" value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full rounded-md border border-stone-300 py-2 pl-9 pr-3 outline-none focus:border-red-800 focus:ring-2 focus:ring-red-800/30" />
          </div>
          <div className="sm:w-48">
            <SelectField hideLabel label="Filter by status" name="bookingStatus" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} placeholder="All statuses"
              options={[{ value: "CONFIRMED", label: "Confirmed" }, { value: "CANCELLED", label: "Cancelled" }]} />
          </div>
        </div>

        {loading && !data && <TableSkeleton />}
        {error && !data && <ErrorState message={error} onRetry={reload} />}
        {error && data && <div role="alert" className="border-b border-red-100 bg-red-50 px-5 py-2 text-sm text-red-800">{error} <button className="underline" onClick={reload}>Retry</button></div>}
        {data && items.length === 0 && <EmptyState title={filtered ? "No bookings match your search" : "No bookings yet"} hint={filtered ? "Try a different search or status." : "Bookings will appear here once customers start booking."} />}

        {items.length > 0 && (
          <div className={`overflow-x-auto ${loading ? "opacity-60" : ""}`}>
            <table className="w-full text-left text-sm">
              <thead className="border-b border-stone-200 bg-stone-50 text-stone-600">
                <tr>
                  <th className="px-5 py-3 font-medium">Reference</th>
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="hidden px-5 py-3 font-medium md:table-cell">Movie</th>
                  <th className="hidden px-5 py-3 font-medium lg:table-cell">Seats</th>
                  <th className="px-5 py-3 font-medium">Total</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {items.map((b) => (
                  <tr key={b.id}>
                    <td className="whitespace-nowrap px-5 py-3 font-mono text-xs">{b.bookingReference}<div className="font-sans text-stone-500">{formatDateTime(b.createdAt)}</div></td>
                    <td className="px-5 py-3">{b.user.name}<div className="text-xs text-stone-500">{b.user.email}</div></td>
                    <td className="hidden px-5 py-3 md:table-cell">{b.showtime.movie.title}<div className="text-xs text-stone-500">{b.showtime.screen.name} · {formatDateTime(b.showtime.startTime)}</div></td>
                    <td className="hidden px-5 py-3 lg:table-cell">{b.seats.map((s) => s.label).join(", ")}</td>
                    <td className="whitespace-nowrap px-5 py-3">{formatCurrency(b.totalAmount)}</td>
                    <td className="px-5 py-3"><StatusBadge status={b.status} /></td>
                    <td className="px-5 py-3 text-right"><Button variant="ghost" size="sm" onClick={() => setViewing(b.id)} aria-label={`View booking ${b.bookingReference}`}><FiEye /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination pagination={data?.pagination} onPageChange={setPage} />
      </div>

      {viewing && <BookingDetailModal bookingId={viewing} onClose={() => setViewing(null)} />}
    </>
  );
}
