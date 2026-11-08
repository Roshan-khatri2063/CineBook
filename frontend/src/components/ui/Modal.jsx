import { useEffect } from "react";
import { FiX } from "react-icons/fi";

const WIDTHS = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl" };

// A dialog: slides up from the bottom on phones, centred on larger screens.
// Closes with the X button, the Escape key, or a click on the dark background.
export default function Modal({ open = true, title, onClose, children, footer, size = "md" }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-stone-900/50" onClick={onClose} />
      <div className={`relative flex max-h-[92vh] w-full ${WIDTHS[size]} flex-col rounded-t-xl bg-white shadow-xl sm:rounded-xl`}>
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded p-1 text-stone-500 hover:bg-stone-100">
            <FiX />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-stone-200 px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}
