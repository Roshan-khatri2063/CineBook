import { FiCheck } from "react-icons/fi";

const STEPS = ["Select seats", "Summary & payment", "Confirmation"];

// current: 0, 1 or 2
export default function StepIndicator({ current }) {
  return (
    <ol className="flex items-center gap-2 text-sm" aria-label="Booking steps">
      {STEPS.map((label, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li
            key={label}
            className="flex items-center gap-2"
            aria-current={active ? "step" : undefined}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${done ? "bg-emerald-600 text-white" : active ? "bg-red-800 text-white" : "bg-stone-200 text-stone-500"}`}
            >
              {done ? <FiCheck /> : index + 1}
            </span>
            <span
              className={`hidden sm:inline ${active ? "font-semibold" : "text-stone-500"}`}
            >
              {label}
            </span>
            {index < STEPS.length - 1 && (
              <span className="h-px w-5 bg-stone-300 sm:w-8" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
