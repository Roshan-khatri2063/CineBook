import { titleCase } from "../../utils/format.js";

const COLORS = {
  NOW_SHOWING: "bg-emerald-100 text-emerald-800",
  COMING_SOON: "bg-sky-100 text-sky-800",
  ENDED: "bg-stone-200 text-stone-700",
  SCHEDULED: "bg-sky-100 text-sky-800",
  CANCELLED: "bg-red-100 text-red-800",
  CONFIRMED: "bg-emerald-100 text-emerald-800",
  PAID: "bg-emerald-100 text-emerald-800",
  REFUNDED: "bg-amber-100 text-amber-800",
  VALID: "bg-emerald-100 text-emerald-800",
  ACTIVE: "bg-emerald-100 text-emerald-800",
  INACTIVE: "bg-stone-200 text-stone-700",
};

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${COLORS[status] ?? "bg-stone-100 text-stone-700"}`}>
      {titleCase(status)}
    </span>
  );
}
