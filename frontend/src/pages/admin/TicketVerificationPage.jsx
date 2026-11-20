import { useRef, useState } from "react";
import { FiAlertTriangle, FiCheckCircle, FiXCircle } from "react-icons/fi";
import Button from "../../components/ui/Button.jsx";
import PageHeader from "../../components/ui/PageHeader.jsx";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import * as adminService from "../../services/adminService.js";
import { formatDateTime } from "../../utils/format.js";
import { getErrorMessage } from "../../utils/getErrorMessage.js";

const TONES = {
  success: {
    box: "border-emerald-300 bg-emerald-50",
    icon: FiCheckCircle,
    iconClass: "text-emerald-600",
  },
  refused: {
    box: "border-amber-300 bg-amber-50",
    icon: FiAlertTriangle,
    iconClass: "text-amber-600",
  },
  invalid: {
    box: "border-red-300 bg-red-50",
    icon: FiXCircle,
    iconClass: "text-red-600",
  },
};

const TITLES = {
  INVALID_TICKET: "Invalid ticket",
  TICKET_ALREADY_USED: "Already used",
  TICKET_CANCELLED: "Ticket cancelled",
  TICKET_EXPIRED: "Ticket expired",
};

// Entrance check. A USB barcode/QR scanner types the code and presses Enter, so the
// same box also works with a scanner. "Check ticket" only looks; "Check in" marks it used.
export default function TicketVerificationPage() {
  const inputRef = useRef(null);
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState(null);

  const run = async (mode) => {
    if (!token.trim()) {
      setOutcome({
        tone: "invalid",
        title: "Enter a ticket code",
        message: "Scan the QR code, or paste the code, first.",
      });
      return;
    }
    setBusy(true);
    try {
      const data =
        mode === "check-in"
          ? await adminService.checkInTicket(token)
          : await adminService.verifyTicket(token);
      setOutcome({
        tone: "success",
        title: mode === "check-in" ? "Checked in" : "Valid ticket",
        message:
          mode === "check-in"
            ? "The ticket is now marked as used."
            : "This ticket can be used. It has not been checked in yet.",
        ticket: data.ticket,
      });
      if (mode === "check-in") {
        setToken("");
        inputRef.current?.focus(); // ready for the next scan
      }
    } catch (error) {
      const body = error.response?.data;
      setOutcome({
        tone:
          body?.code === "INVALID_TICKET" || !body?.code
            ? "invalid"
            : "refused",
        title: TITLES[body?.code] ?? "Could not check the ticket",
        message: getErrorMessage(error),
        ticket: body?.details?.ticket,
      });
    } finally {
      setBusy(false);
    }
  };

  const tone = outcome && TONES[outcome.tone];
  const ticket = outcome?.ticket;

  return (
    <>
      <PageHeader
        title="Ticket check"
        description="Verify tickets at the entrance by scanning their QR code."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run("verify");
          }}
          className="rounded-lg border border-stone-200 bg-white p-5"
          aria-label="Ticket check"
        >
          <label
            htmlFor="ticket-token"
            className="mb-1 block text-sm font-medium text-stone-700"
          >
            Ticket code
          </label>
          <textarea
            id="ticket-token"
            ref={inputRef}
            rows={3}
            autoFocus
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Scan the QR code, or paste the code here…"
            className="w-full rounded-md border border-stone-300 px-3 py-2 font-mono text-sm outline-none focus:border-red-800 focus:ring-2 focus:ring-red-800/30"
          />
          <p className="mt-1 text-xs text-stone-500">
            The code looks like <span className="font-mono">CB1.TK-…</span>.
            Customers can copy it from their ticket page.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="submit" variant="secondary" disabled={busy}>
              Check ticket
            </Button>
            <Button
              type="button"
              onClick={() => run("check-in")}
              disabled={busy}
            >
              Check in
            </Button>
          </div>
          <p className="mt-3 text-xs text-stone-500">
            <b>Check ticket</b> only looks. <b>Check in</b> marks the ticket as
            used, so it cannot be used again.
          </p>
        </form>

        <section aria-live="polite" aria-label="Result">
          {!outcome && (
            <div className="flex h-full min-h-40 items-center justify-center rounded-lg border border-dashed border-stone-300 p-6 text-center text-stone-500">
              The result of the check appears here.
            </div>
          )}
          {outcome && (
            <div
              role={outcome.tone === "success" ? "status" : "alert"}
              className={`rounded-lg border p-5 ${tone.box}`}
            >
              <div className="flex items-center gap-3">
                <tone.icon className={`text-3xl ${tone.iconClass}`} />
                <div>
                  <h2 className="text-lg font-bold">{outcome.title}</h2>
                  <p className="text-sm text-stone-700">{outcome.message}</p>
                </div>
              </div>

              {ticket && (
                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-black/10 pt-4 text-sm">
                  <div className="col-span-2">
                    <dt className="text-xs uppercase text-stone-500">Movie</dt>
                    <dd className="font-semibold">{ticket.movie.title}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase text-stone-500">
                      Showtime
                    </dt>
                    <dd className="font-semibold">
                      {formatDateTime(ticket.showtime.startTime)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase text-stone-500">Screen</dt>
                    <dd className="font-semibold">{ticket.screen.name}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase text-stone-500">Seat</dt>
                    <dd className="font-semibold">{ticket.seat.label}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase text-stone-500">Status</dt>
                    <dd>
                      <StatusBadge status={ticket.validity} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase text-stone-500">
                      Booking
                    </dt>
                    <dd className="font-mono text-xs">
                      {ticket.bookingReference}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase text-stone-500">Ticket</dt>
                    <dd className="font-mono text-xs">{ticket.ticketCode}</dd>
                  </div>
                  {ticket.usedAt && (
                    <div className="col-span-2">
                      <dt className="text-xs uppercase text-stone-500">
                        Checked in at
                      </dt>
                      <dd className="font-semibold">
                        {formatDateTime(ticket.usedAt)}
                      </dd>
                    </div>
                  )}
                </dl>
              )}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
