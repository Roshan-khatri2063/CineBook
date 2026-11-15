import { useMemo } from "react";
import { formatCurrency } from "../../utils/format.js";

const STATE_WORD = {
  AVAILABLE: "available",
  BOOKED: "booked",
  UNAVAILABLE: "unavailable",
};

const seatClass = (seat, selected) => {
  if (selected) return "border-red-800 bg-red-800 text-white shadow";
  if (seat.status === "BOOKED")
    return "cursor-not-allowed border-stone-300 bg-stone-300 text-stone-500";
  if (seat.status === "UNAVAILABLE")
    return "cursor-not-allowed border-red-200 bg-red-50 text-red-300 line-through";
  if (seat.type === "PREMIUM")
    return "border-amber-400 bg-amber-100 text-amber-900 hover:bg-amber-200";
  return "border-stone-400 bg-white text-stone-700 hover:bg-stone-100";
};

// Interactive seat map. Click a free seat to select it, click again to unselect.
// Booked and out-of-order seats cannot be clicked.
export default function SeatMap({
  seats,
  selectedIds,
  onToggle,
  locked = false,
}) {
  const rows = useMemo(() => {
    const grouped = new Map();
    for (const seat of seats) {
      if (!grouped.has(seat.rowLabel)) grouped.set(seat.rowLabel, []);
      grouped.get(seat.rowLabel).push(seat);
    }
    return [...grouped.entries()];
  }, [seats]);

  return (
    <div>
      <div className="mx-auto mb-8 max-w-sm">
        <div className="h-1.5 rounded-full bg-stone-400" />
        <p className="mt-1 text-center text-[11px] uppercase tracking-[0.3em] text-stone-500">
          Screen
        </p>
      </div>

      <div className="overflow-x-auto pb-2">
        <div
          className="mx-auto w-max space-y-2"
          role="group"
          aria-label="Seats"
        >
          {rows.map(([label, rowSeats]) => (
            <div key={label} className="flex items-center gap-1.5">
              <span
                className="w-5 text-center text-xs font-semibold text-stone-500"
                aria-hidden="true"
              >
                {label}
              </span>
              {rowSeats.map((seat) => {
                const selected = selectedIds.has(seat.id);
                const clickable = seat.status === "AVAILABLE" && !locked;
                const word = selected ? "selected" : STATE_WORD[seat.status];
                return (
                  <button
                    key={seat.id}
                    type="button"
                    disabled={!clickable}
                    aria-pressed={selected}
                    aria-label={`Seat ${seat.label}, ${seat.type.toLowerCase()}, ${formatCurrency(seat.price)}, ${word}`}
                    title={`${seat.label} · ${seat.type === "PREMIUM" ? "Premium" : "Standard"} · ${formatCurrency(seat.price)}`}
                    onClick={() => onToggle(seat)}
                    className={`h-9 w-9 rounded-t-lg border text-[11px] font-semibold transition focus:outline-none focus:ring-2 focus:ring-red-800/50 sm:h-8 sm:w-8 ${seatClass(seat, selected)}`}
                  >
                    {seat.seatNumber}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <ul
        className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-stone-600"
        aria-label="Seat legend"
      >
        <li className="flex items-center gap-1.5">
          <i className="h-4 w-4 rounded-t border border-stone-400 bg-white" />{" "}
          Standard
        </li>
        <li className="flex items-center gap-1.5">
          <i className="h-4 w-4 rounded-t border border-amber-400 bg-amber-100" />{" "}
          Premium
        </li>
        <li className="flex items-center gap-1.5">
          <i className="h-4 w-4 rounded-t border border-red-800 bg-red-800" />{" "}
          Selected
        </li>
        <li className="flex items-center gap-1.5">
          <i className="h-4 w-4 rounded-t border border-stone-300 bg-stone-300" />{" "}
          Booked
        </li>
        <li className="flex items-center gap-1.5">
          <i className="h-4 w-4 rounded-t border border-red-200 bg-red-50" />{" "}
          Unavailable
        </li>
      </ul>
    </div>
  );
}
