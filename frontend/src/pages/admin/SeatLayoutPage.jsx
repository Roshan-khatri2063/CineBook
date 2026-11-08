import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FiArrowLeft, FiInfo } from "react-icons/fi";
import { toast } from "sonner";
import FormField from "../../components/FormField.jsx";
import Button from "../../components/ui/Button.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import Modal from "../../components/ui/Modal.jsx";
import PageHeader from "../../components/ui/PageHeader.jsx";
import SelectField from "../../components/ui/SelectField.jsx";
import { ErrorState, TableSkeleton } from "../../components/ui/StateViews.jsx";
import useFetch from "../../hooks/useFetch.js";
import * as adminService from "../../services/adminService.js";
import { getErrorMessage, getFieldErrors } from "../../utils/getErrorMessage.js";

const seatClass = (seat) => {
  if (!seat.isActive) return "border-red-300 bg-red-50 text-red-400 line-through";
  if (seat.type === "PREMIUM") return "border-amber-400 bg-amber-100 text-amber-900";
  return "border-stone-300 bg-stone-100 text-stone-700";
};

function SeatEditModal({ seat, onClose, onSaved }) {
  const [type, setType] = useState(seat.type);
  const [isActive, setIsActive] = useState(seat.isActive);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await adminService.updateSeat(seat.id, { type, isActive });
      toast.success(`Seat ${seat.rowLabel}${seat.seatNumber} updated`);
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err));
      setSaving(false);
    }
  };

  return (
    <Modal
      title={`Seat ${seat.rowLabel}${seat.seatNumber}`}
      size="sm"
      onClose={saving ? () => {} : onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <div role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>}
        <SelectField label="Seat type" name="seatType" value={type} onChange={(e) => setType(e.target.value)} options={[{ value: "STANDARD", label: "Standard" }, { value: "PREMIUM", label: "Premium" }]} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 accent-red-800" />
          Available for booking (untick if the seat is broken)
        </label>
        <p className="text-xs text-stone-500">Showtimes that already exist keep the price they were created with.</p>
      </div>
    </Modal>
  );
}

export default function SeatLayoutPage() {
  const { id } = useParams();
  const { data, loading, error, reload } = useFetch(() => adminService.getSeatLayout(id), [id]);

  const [form, setForm] = useState({ rows: "8", seatsPerRow: "10", premiumRows: "2" });
  const [formErrors, setFormErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [selected, setSelected] = useState(null);

  const rows = useMemo(() => {
    const grouped = new Map();
    for (const seat of data?.seats ?? []) {
      if (!grouped.has(seat.rowLabel)) grouped.set(seat.rowLabel, []);
      grouped.get(seat.rowLabel).push(seat);
    }
    return [...grouped.entries()];
  }, [data]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const generate = async () => {
    setGenerating(true);
    setFormError("");
    try {
      const result = await adminService.generateSeatLayout(id, {
        rows: Number(form.rows),
        seatsPerRow: Number(form.seatsPerRow),
        premiumRows: Number(form.premiumRows),
      });
      toast.success(`Layout created: ${result.seats.length} seats`);
      setConfirmReplace(false);
      reload();
    } catch (err) {
      const fields = getFieldErrors(err);
      setFormErrors(fields);
      setFormError(Object.keys(fields).length > 0 ? "" : getErrorMessage(err));
      setConfirmReplace(false);
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerate = (event) => {
    event.preventDefault();
    const problems = {};
    const r = Number(form.rows), s = Number(form.seatsPerRow), p = Number(form.premiumRows);
    if (!Number.isInteger(r) || r < 1 || r > 26) problems.rows = "1 to 26 rows";
    if (!Number.isInteger(s) || s < 1 || s > 30) problems.seatsPerRow = "1 to 30 seats";
    if (!Number.isInteger(p) || p < 0 || p > r) problems.premiumRows = "0 up to the number of rows";
    setFormErrors(problems);
    if (Object.keys(problems).length > 0) return;
    if (data.seats.length > 0) setConfirmReplace(true);
    else generate();
  };

  const counts = useMemo(() => {
    const seats = data?.seats ?? [];
    return {
      total: seats.length,
      premium: seats.filter((s) => s.type === "PREMIUM").length,
      unavailable: seats.filter((s) => !s.isActive).length,
    };
  }, [data]);

  if (loading && !data) return <div className="rounded-lg border border-stone-200 bg-white"><TableSkeleton /></div>;
  if (error && !data) return <div className="rounded-lg border border-stone-200 bg-white"><ErrorState message={error} onRetry={reload} /></div>;

  return (
    <>
      <Link to="/admin/screens" className="mb-3 inline-flex items-center gap-1 text-sm text-stone-600 hover:text-stone-900"><FiArrowLeft /> Back to screens</Link>
      <PageHeader title={`${data.screen.name}: seat layout`} description={`${counts.total} seats · ${counts.premium} premium · ${counts.unavailable} unavailable`} />

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-lg border border-stone-200 bg-white p-5 lg:col-span-2">
          {rows.length === 0 ? (
            <p className="py-10 text-center text-stone-500">This screen has no seats yet. Generate a layout to get started.</p>
          ) : (
            <>
              <div className="mx-auto mb-6 max-w-md rounded-b-full border-t-4 border-stone-400 py-1 text-center text-xs uppercase tracking-widest text-stone-500">Screen</div>
              <div className="overflow-x-auto pb-2">
                <div className="mx-auto w-max space-y-1.5">
                  {rows.map(([label, seats]) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <span className="w-5 text-center text-xs font-medium text-stone-500">{label}</span>
                      {seats.map((seat) => (
                        <button
                          key={seat.id}
                          onClick={() => setSelected(seat)}
                          aria-label={`Seat ${seat.rowLabel}${seat.seatNumber}, ${seat.type.toLowerCase()}${seat.isActive ? "" : ", unavailable"}`}
                          className={`h-8 w-8 rounded-t-md border text-[11px] font-medium transition hover:ring-2 hover:ring-red-800/40 ${seatClass(seat)}`}
                        >
                          {seat.seatNumber}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-5 flex flex-wrap justify-center gap-4 text-xs text-stone-600">
                <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded-sm border border-stone-300 bg-stone-100" /> Standard</span>
                <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded-sm border border-amber-400 bg-amber-100" /> Premium</span>
                <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded-sm border border-red-300 bg-red-50" /> Unavailable</span>
              </div>
              <p className="mt-3 text-center text-xs text-stone-500">Click a seat to change its type or availability.</p>
            </>
          )}
        </section>

        <section className="rounded-lg border border-stone-200 bg-white p-5">
          <h2 className="font-semibold">Build layout</h2>
          {!data.canRebuildLayout ? (
            <div className="mt-3 flex gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-900">
              <FiInfo className="mt-0.5 shrink-0" />
              <p>This screen has {data.showtimeCount} showtime(s), so the layout is locked. You can still edit individual seats. To rebuild it, delete the screen's showtimes first.</p>
            </div>
          ) : (
            <form onSubmit={handleGenerate} noValidate className="mt-3 space-y-3">
              {formError && <div role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">{formError}</div>}
              <FormField label="Rows (A, B, C…)" name="rows" type="number" min="1" max="26" value={form.rows} onChange={handleChange} error={formErrors.rows} />
              <FormField label="Seats per row" name="seatsPerRow" type="number" min="1" max="30" value={form.seatsPerRow} onChange={handleChange} error={formErrors.seatsPerRow} />
              <FormField label="Premium rows (at the back)" name="premiumRows" type="number" min="0" value={form.premiumRows} onChange={handleChange} error={formErrors.premiumRows} />
              <Button type="submit" className="w-full" disabled={generating}>{generating ? "Generating…" : data.seats.length ? "Replace layout" : "Generate layout"}</Button>
              {data.seats.length > 0 && <p className="text-xs text-stone-500">Replacing deletes the current {data.seats.length} seats.</p>}
            </form>
          )}
        </section>
      </div>

      {selected && <SeatEditModal key={selected.id} seat={selected} onClose={() => setSelected(null)} onSaved={() => { setSelected(null); reload(); }} />}
      {confirmReplace && (
        <ConfirmDialog
          danger
          title="Replace seat layout?"
          message={`The current ${data.seats.length} seats will be deleted and a new layout of ${Number(form.rows) * Number(form.seatsPerRow)} seats created.`}
          confirmLabel="Replace layout"
          onConfirm={generate}
          onCancel={() => setConfirmReplace(false)}
        />
      )}
    </>
  );
}
