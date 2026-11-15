import { formatCurrency, formatDateTime } from "../../utils/format.js";

// Movie, showtime, chosen seats and the total. Used on the seat and payment steps.
export default function BookingSummary({ showtime, seats, total, children }) {
  return (
    <aside
      className="rounded-lg border border-stone-200 bg-white p-5"
      aria-label="Booking summary"
    >
      <h2 className="font-semibold">Booking summary</h2>
      <p className="mt-3 font-medium">{showtime.movie.title}</p>
      <p className="text-sm text-stone-600">
        {formatDateTime(showtime.startTime)}
      </p>
      <p className="text-sm text-stone-600">{showtime.screen.name}</p>

      <div className="mt-4 border-t border-stone-100 pt-3">
        {seats.length === 0 ? (
          <p className="text-sm text-stone-500">
            No seats selected yet. Click a seat on the map to choose it.
          </p>
        ) : (
          <ul className="space-y-1.5 text-sm">
            {seats.map((seat) => (
              <li key={seat.id} className="flex justify-between">
                <span>
                  Seat <b>{seat.label}</b>{" "}
                  <span className="text-stone-500">
                    ({seat.type === "PREMIUM" ? "Premium" : "Standard"})
                  </span>
                </span>
                <span>{formatCurrency(seat.price)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-stone-200 pt-3">
        <span className="text-stone-600">
          {seats.length} ticket{seats.length === 1 ? "" : "s"}
        </span>
        <span className="text-xl font-bold" data-testid="summary-total">
          {formatCurrency(total)}
        </span>
      </div>
      {children && <div className="mt-4">{children}</div>}
    </aside>
  );
}
