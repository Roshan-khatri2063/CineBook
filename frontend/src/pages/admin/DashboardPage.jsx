import { Link } from "react-router-dom";
import { FiClock, FiDollarSign, FiFilm, FiMonitor, FiTag, FiUsers } from "react-icons/fi";
import { MdOutlineEventSeat } from "react-icons/md";
import PageHeader from "../../components/ui/PageHeader.jsx";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import { ErrorState, TableSkeleton } from "../../components/ui/StateViews.jsx";
import useFetch from "../../hooks/useFetch.js";
import * as adminService from "../../services/adminService.js";
import { formatCurrency, formatDateTime } from "../../utils/format.js";

function StatCard({ icon: Icon, label, value, hint, tone = "text-red-800 bg-red-50" }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-stone-600">{label}</p>
        <span className={`rounded-md p-2 ${tone}`}><Icon /></span>
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-stone-500">{hint}</p>}
    </div>
  );
}

function RevenueChart({ days }) {
  const max = Math.max(...days.map((d) => d.revenue), 1);
  return (
    <div className="flex h-44 items-end gap-2" role="img" aria-label="Revenue for the last 7 days">
      {days.map((day) => (
        <div key={day.date} className="flex h-full flex-1 flex-col justify-end text-center" title={`${day.date}: ${formatCurrency(day.revenue)} from ${day.bookings} booking(s)`}>
          <div
            className={`w-full rounded-t ${day.revenue > 0 ? "bg-red-800" : "bg-stone-200"}`}
            style={{ height: `${day.revenue > 0 ? Math.max((day.revenue / max) * 100, 4) : 2}%` }}
          />
          <span className="mt-1 text-[11px] text-stone-500">{day.date.slice(5)}</span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { data: stats, loading, error, reload } = useFetch(adminService.getStats, []);

  return (
    <>
      <PageHeader title="Dashboard" description="A quick look at how the cinema is doing." />

      {loading && !stats && <div className="rounded-lg border border-stone-200 bg-white"><TableSkeleton rows={6} /></div>}
      {error && !stats && <div className="rounded-lg border border-stone-200 bg-white"><ErrorState message={error} onRetry={reload} /></div>}

      {stats && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={FiDollarSign} label="Total revenue" value={formatCurrency(stats.revenue.total)} hint={`${formatCurrency(stats.revenue.today)} today`} />
            <StatCard icon={MdOutlineEventSeat} label="Tickets sold" value={stats.ticketsSold} hint="Active tickets of confirmed bookings" tone="text-emerald-700 bg-emerald-50" />
            <StatCard icon={FiTag} label="Confirmed bookings" value={stats.bookings.confirmed} hint={`${stats.bookings.cancelled} cancelled · ${stats.bookings.today} today`} tone="text-sky-700 bg-sky-50" />
            <StatCard icon={FiUsers} label="Customers" value={stats.customers.total} hint={`${stats.customers.active} active`} tone="text-violet-700 bg-violet-50" />
            <StatCard icon={FiClock} label="Upcoming showtimes" value={stats.upcomingShowtimes} tone="text-amber-700 bg-amber-50" />
            <StatCard icon={FiFilm} label="Movies" value={stats.movies.total} hint={`${stats.movies.nowShowing} now showing · ${stats.movies.comingSoon} coming soon`} />
            <StatCard icon={FiMonitor} label="Screens" value={stats.screens} tone="text-stone-700 bg-stone-100" />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <section className="rounded-lg border border-stone-200 bg-white p-5 lg:col-span-2">
              <h2 className="font-semibold">Revenue, last 7 days</h2>
              <p className="mb-4 text-sm text-stone-500">Confirmed bookings only. Hover a bar for details.</p>
              <RevenueChart days={stats.revenueLast7Days} />
            </section>

            <section className="rounded-lg border border-stone-200 bg-white p-5">
              <h2 className="font-semibold">Top movies</h2>
              <p className="mb-4 text-sm text-stone-500">By tickets sold</p>
              {stats.topMovies.length === 0 ? (
                <p className="text-sm text-stone-500">No sales yet.</p>
              ) : (
                <ol className="space-y-3">
                  {stats.topMovies.map((movie, index) => (
                    <li key={movie.id}>
                      <div className="flex justify-between text-sm">
                        <span className="truncate pr-2">{index + 1}. {movie.title}</span>
                        <span className="font-medium">{movie.tickets}</span>
                      </div>
                      <div className="mt-1 h-1.5 rounded bg-stone-100">
                        <div className="h-1.5 rounded bg-red-800" style={{ width: `${(movie.tickets / stats.topMovies[0].tickets) * 100}%` }} />
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>

          <section className="rounded-lg border border-stone-200 bg-white">
            <div className="flex items-center justify-between px-5 py-4">
              <h2 className="font-semibold">Recent bookings</h2>
              <Link to="/admin/bookings" className="text-sm text-red-800 underline">View all</Link>
            </div>
            {stats.recentBookings.length === 0 ? (
              <p className="px-5 pb-5 text-sm text-stone-500">No bookings yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-y border-stone-200 bg-stone-50 text-stone-600">
                    <tr><th className="px-5 py-2 font-medium">Reference</th><th className="px-5 py-2 font-medium">Customer</th><th className="px-5 py-2 font-medium">Movie</th><th className="px-5 py-2 font-medium">Total</th><th className="px-5 py-2 font-medium">Status</th></tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {stats.recentBookings.map((b) => (
                      <tr key={b.id}>
                        <td className="whitespace-nowrap px-5 py-2.5 font-mono text-xs">{b.bookingReference}</td>
                        <td className="px-5 py-2.5">{b.user.name}</td>
                        <td className="px-5 py-2.5">{b.showtime.movie.title}<div className="text-xs text-stone-500">{formatDateTime(b.showtime.startTime)}</div></td>
                        <td className="whitespace-nowrap px-5 py-2.5">{formatCurrency(b.totalAmount)}</td>
                        <td className="px-5 py-2.5"><StatusBadge status={b.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}
