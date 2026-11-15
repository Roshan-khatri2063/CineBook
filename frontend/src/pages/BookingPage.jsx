import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FiAlertTriangle, FiArrowLeft } from "react-icons/fi";
import { toast } from "sonner";
import BookingSummary from "../components/booking/BookingSummary.jsx";
import PaymentForm from "../components/booking/PaymentForm.jsx";
import SeatMap from "../components/booking/SeatMap.jsx";
import StepIndicator from "../components/booking/StepIndicator.jsx";
import Button from "../components/ui/Button.jsx";
import { ErrorState, TableSkeleton } from "../components/ui/StateViews.jsx";
import useFetch from "../hooks/useFetch.js";
import * as bookingService from "../services/bookingService.js";
import { formatCurrency, formatDateTime } from "../utils/format.js";
import { getErrorMessage } from "../utils/getErrorMessage.js";

// Steps 1 and 2 of the booking: choose seats, then review and pay.
// Step 3 (confirmation) is its own page so it survives a refresh.
export default function BookingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useFetch(
    () => bookingService.getSeatMap(id),
    [id],
  );

  const [step, setStep] = useState("seats"); // "seats" | "pay"
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const [priceNotice, setPriceNotice] = useState("");

  // The selected seats are always read from the LATEST seat map, so a seat that
  // was just booked by someone else drops out of the selection by itself.
  const selectedSeats = useMemo(
    () =>
      (data?.seats ?? []).filter(
        (seat) => selectedIds.has(seat.id) && seat.status === "AVAILABLE",
      ),
    [data, selectedIds],
  );
  const totalCents = selectedSeats.reduce(
    (sum, seat) => sum + Math.round(Number(seat.price) * 100),
    0,
  );
  const total = totalCents / 100;

  // Keep the map fresh while choosing seats: other customers are booking too.
  useEffect(() => {
    if (step !== "seats") return undefined;
    const timer = setInterval(reload, 20000);
    return () => clearInterval(timer);
  }, [step, reload]);

  const toggleSeat = useCallback(
    (seat) => {
      if (selectedIds.has(seat.id)) {
        const next = new Set(selectedIds);
        next.delete(seat.id);
        setSelectedIds(next);
      } else if (selectedIds.size >= data.maxSeatsPerBooking) {
        toast.error(
          `You can select up to ${data.maxSeatsPerBooking} seats per booking`,
          { id: "max-seats" },
        );
      } else {
        setSelectedIds(new Set(selectedIds).add(seat.id));
      }
    },
    [selectedIds, data],
  );

  const goToPayment = () => {
    setPayError("");
    setPriceNotice("");
    setStep("pay");
  };

  const handlePay = async (payment) => {
    setPaying(true);
    setPayError("");
    try {
      const booking = await bookingService.createBooking({
        showtimeId: Number(id),
        showSeatIds: selectedSeats.map((seat) => seat.id),
        expectedTotal: total,
        payment,
      });
      toast.success("Booking confirmed!");
      navigate(`/bookings/${booking.id}/confirmation`, { replace: true });
    } catch (err) {
      const body = err.response?.data;
      if (body?.code === "SEATS_UNAVAILABLE") {
        // Someone else got there first. Drop those seats and go back to the map.
        const taken = new Set(body.details?.unavailableSeats ?? []);
        setSelectedIds(
          (prev) =>
            new Set(
              [...prev].filter(
                (seatId) =>
                  !taken.has(data.seats.find((s) => s.id === seatId)?.label),
              ),
            ),
        );
        toast.error(body.message, { id: "seats-taken" });
        setStep("seats");
        reload();
      } else if (body?.code === "PRICE_CHANGED") {
        setPriceNotice(
          `Ticket prices have changed. The new total is ${formatCurrency(body.details?.newTotal)}. Please check it and pay again.`,
        );
        reload();
      } else {
        setPayError(getErrorMessage(err));
      }
      setPaying(false);
    }
  };

  if (loading && !data)
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="rounded-lg border border-stone-200 bg-white">
          <TableSkeleton rows={6} />
        </div>
      </div>
    );
  if (error && !data) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
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

  const { showtime } = data;

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 pb-28 sm:px-6 lg:pb-10">
      <Link
        to={`/movies/${showtime.movie.id}`}
        className="mb-3 inline-flex items-center gap-1 text-sm text-stone-600 hover:text-stone-900"
      >
        <FiArrowLeft /> {showtime.movie.title}
      </Link>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {step === "seats" ? "Choose your seats" : "Review and pay"}
          </h1>
          <p className="text-stone-600">
            {showtime.movie.title} · {formatDateTime(showtime.startTime)} ·{" "}
            {showtime.screen.name}
          </p>
        </div>
        <StepIndicator current={step === "seats" ? 0 : 1} />
      </div>

      {!data.bookable && (
        <div
          role="alert"
          className="mb-4 flex items-center gap-2 rounded-md bg-amber-50 px-4 py-3 text-amber-900"
        >
          <FiAlertTriangle /> {data.closedReason}. Booking is closed.
        </div>
      )}

      {step === "seats" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <section
            className="rounded-lg border border-stone-200 bg-white p-5 lg:col-span-2"
            aria-label="Seat selection"
          >
            <SeatMap
              seats={data.seats}
              selectedIds={selectedIds}
              onToggle={toggleSeat}
              locked={!data.bookable}
            />
          </section>

          <div className="hidden lg:block">
            <div className="sticky top-6">
              <BookingSummary
                showtime={showtime}
                seats={selectedSeats}
                total={total}
              >
                <Button
                  className="w-full py-3"
                  disabled={selectedSeats.length === 0 || !data.bookable}
                  onClick={goToPayment}
                >
                  Continue to payment
                </Button>
              </BookingSummary>
              <p className="mt-2 text-center text-xs text-stone-500">
                Up to {data.maxSeatsPerBooking} seats per booking
              </p>
            </div>
          </div>

          {/* phones and tablets: summary bar fixed at the bottom */}
          <div className="fixed inset-x-0 bottom-0 z-20 border-t border-stone-200 bg-white p-3 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] lg:hidden">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
              <div>
                <p className="text-sm text-stone-600">
                  {selectedSeats.length === 0
                    ? "No seats selected"
                    : `${selectedSeats.length} seat${selectedSeats.length === 1 ? "" : "s"}: ${selectedSeats.map((s) => s.label).join(", ")}`}
                </p>
                <p className="text-lg font-bold" data-testid="mobile-total">
                  {formatCurrency(total)}
                </p>
              </div>
              <Button
                disabled={selectedSeats.length === 0 || !data.bookable}
                onClick={goToPayment}
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      )}

      {step === "pay" && (
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-2">
            <BookingSummary
              showtime={showtime}
              seats={selectedSeats}
              total={total}
            >
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => setStep("seats")}
                disabled={paying}
              >
                <FiArrowLeft /> Change seats
              </Button>
            </BookingSummary>
          </div>
          <div className="space-y-4 lg:col-span-3">
            {priceNotice && (
              <div
                role="alert"
                className="flex gap-2 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-900"
              >
                <FiAlertTriangle className="mt-0.5 shrink-0" /> {priceNotice}
              </div>
            )}
            <PaymentForm
              total={total}
              submitting={paying}
              disabled={loading || selectedSeats.length === 0}
              error={payError}
              onSubmit={handlePay}
            />
          </div>
        </div>
      )}
    </main>
  );
}
