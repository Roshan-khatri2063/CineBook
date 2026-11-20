import { Link, useParams } from "react-router-dom";
import { FiArrowLeft, FiCopy, FiPrinter } from "react-icons/fi";
import { toast } from "sonner";
import TicketCard from "../components/tickets/TicketCard.jsx";
import Button from "../components/ui/Button.jsx";
import { ErrorState, TableSkeleton } from "../components/ui/StateViews.jsx";
import useFetch from "../hooks/useFetch.js";
import * as ticketService from "../services/ticketService.js";

// One ticket, ready to show on a phone or to print.
export default function TicketPage() {
  const { id } = useParams();
  const {
    data: ticket,
    loading,
    error,
    reload,
  } = useFetch(() => ticketService.getTicket(id), [id]);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(ticket.qrToken);
      toast.success("Verification code copied");
    } catch {
      toast.error("Could not copy. Select the code and copy it by hand.");
    }
  };

  if (loading && !ticket)
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-lg border border-stone-200 bg-white">
          <TableSkeleton rows={6} />
        </div>
      </div>
    );
  if (error && !ticket) {
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

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 print:max-w-none print:p-0">
      <div className="mb-4 flex items-center justify-between gap-3 print:hidden">
        <Link
          to="/tickets"
          className="inline-flex items-center gap-1 text-sm text-stone-600 hover:text-stone-900"
        >
          <FiArrowLeft /> My tickets
        </Link>
        <Button onClick={() => window.print()}>
          <FiPrinter /> Print ticket
        </Button>
      </div>

      <TicketCard ticket={ticket} />

      <details className="mt-5 rounded-lg border border-stone-200 bg-white p-4 text-sm print:hidden">
        <summary className="cursor-pointer font-medium">
          Having trouble scanning?
        </summary>
        <p className="mt-2 text-stone-600">
          Staff can type or paste this verification code instead of scanning.
          Only show it to cinema staff.
        </p>
        <div className="mt-2 flex items-center gap-2">
          <code
            className="flex-1 break-all rounded bg-stone-100 px-2 py-1.5 font-mono text-xs"
            data-testid="verification-code"
          >
            {ticket.qrToken}
          </code>
          <Button
            variant="secondary"
            size="sm"
            onClick={copyCode}
            aria-label="Copy verification code"
          >
            <FiCopy />
          </Button>
        </div>
      </details>

      <p className="mt-4 text-center text-sm text-stone-500 print:hidden">
        Show this ticket on your phone, or print it and bring it with you. Each
        seat has its own ticket.
      </p>
    </main>
  );
}
