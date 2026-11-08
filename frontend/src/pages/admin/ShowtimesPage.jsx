import { useMemo, useState } from "react";
import { FiEdit2, FiPlus, FiSlash, FiTrash2 } from "react-icons/fi";
import { toast } from "sonner";
import FormField from "../../components/FormField.jsx";
import Button from "../../components/ui/Button.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import Modal from "../../components/ui/Modal.jsx";
import PageHeader from "../../components/ui/PageHeader.jsx";
import Pagination from "../../components/ui/Pagination.jsx";
import SelectField from "../../components/ui/SelectField.jsx";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import { EmptyState, ErrorState, TableSkeleton } from "../../components/ui/StateViews.jsx";
import useFetch from "../../hooks/useFetch.js";
import * as adminService from "../../services/adminService.js";
import { formatCurrency, formatDateTime, formatTime, fromLocalInput, toLocalInput } from "../../utils/format.js";
import { getErrorMessage, getFieldErrors } from "../../utils/getErrorMessage.js";

const WHEN_OPTIONS = [
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
  { value: "all", label: "All dates" },
];
const STATUS_OPTIONS = [
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "CANCELLED", label: "Cancelled" },
];

const canEdit = (s) => s.status === "SCHEDULED" && new Date(s.startTime) > new Date();

function ShowtimeFormModal({ showtime, movies, screens, onClose, onSaved }) {
  const editing = Boolean(showtime);
  const bookedLock = editing && showtime.confirmedBookings > 0;
  const originalStart = editing ? toLocalInput(showtime.startTime) : "";

  const [form, setForm] = useState({
    movieId: "",
    screenId: "",
    startTime: originalStart,
    standardPrice: editing ? String(Number(showtime.standardPrice)) : "400",
    premiumPrice: editing ? String(Number(showtime.premiumPrice)) : "600",
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const movie = editing ? showtime.movie : movies.find((m) => String(m.id) === form.movieId);
  const endPreview = movie && form.startTime
    ? new Date(new Date(form.startTime).getTime() + movie.durationMinutes * 60000).toISOString()
    : null;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    const problems = {};
    if (!editing && !form.movieId) problems.movieId = "Choose a movie";
    if (!editing && !form.screenId) problems.screenId = "Choose a screen";
    if (!form.startTime) problems.startTime = "Choose a start date and time";
    for (const key of ["standardPrice", "premiumPrice"]) {
      const value = Number(form[key]);
      if (form[key] === "" || Number.isNaN(value) || value < 0) problems[key] = "Enter a price of 0 or more";
    }
    setErrors(problems);
    if (Object.keys(problems).length > 0) return;

    setSaving(true);
    try {
      if (editing) {
        const body = { standardPrice: Number(form.standardPrice), premiumPrice: Number(form.premiumPrice) };
        if (form.startTime !== originalStart) body.startTime = fromLocalInput(form.startTime);
        await adminService.updateShowtime(showtime.id, body);
      } else {
        await adminService.createShowtime({
          movieId: Number(form.movieId),
          screenId: Number(form.screenId),
          startTime: fromLocalInput(form.startTime),
          standardPrice: Number(form.standardPrice),
          premiumPrice: Number(form.premiumPrice),
        });
      }
      toast.success(editing ? "Showtime updated" : "Showtime scheduled");
      onSaved();
    } catch (error) {
      const fields = getFieldErrors(error);
      setErrors(fields);
      setFormError(Object.keys(fields).length > 0 ? "" : getErrorMessage(error));
      setSaving(false);
    }
  };

  return (
    <Modal
      title={editing ? "Edit showtime" : "Schedule showtime"}
      onClose={saving ? () => {} : onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" form="showtime-form" disabled={saving}>{saving ? "Saving…" : editing ? "Save changes" : "Schedule"}</Button>
        </>
      }
    >
      <form id="showtime-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && <div role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">{formError}</div>}

        {editing ? (
          <div className="rounded-md bg-stone-50 p-3 text-sm">
            <p><span className="text-stone-500">Movie:</span> <b>{showtime.movie.title}</b></p>
            <p><span className="text-stone-500">Screen:</span> <b>{showtime.screen.name}</b></p>
            <p className="mt-1 text-xs text-stone-500">The movie and screen cannot be changed. Cancel this showtime and schedule a new one instead.</p>
          </div>
        ) : (
          <>
            <SelectField label="Movie" name="movieId" value={form.movieId} onChange={handleChange} error={errors.movieId} placeholder="Choose a movie…"
              options={movies.filter((m) => m.status !== "ENDED").map((m) => ({ value: m.id, label: `${m.title} (${m.durationMinutes} min)` }))} />
            <SelectField label="Screen" name="screenId" value={form.screenId} onChange={handleChange} error={errors.screenId} placeholder="Choose a screen…"
              options={screens.filter((s) => s.isActive && s._count.seats > 0).map((s) => ({ value: s.id, label: `${s.name} (${s._count.seats} seats)` }))} />
          </>
        )}

        <FormField label="Starts at" name="startTime" type="datetime-local" value={form.startTime} onChange={handleChange} error={errors.startTime} disabled={bookedLock} />
        {bookedLock && <p className="-mt-2 text-xs text-amber-700">{showtime.confirmedBookings} confirmed booking(s) exist, so the time cannot be changed.</p>}
        {endPreview && <p className="-mt-2 text-xs text-stone-500">Ends at about {formatDateTime(endPreview)} ({movie.durationMinutes} min)</p>}

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Standard price (Rs)" name="standardPrice" type="number" min="0" step="0.01" value={form.standardPrice} onChange={handleChange} error={errors.standardPrice} />
          <FormField label="Premium price (Rs)" name="premiumPrice" type="number" min="0" step="0.01" value={form.premiumPrice} onChange={handleChange} error={errors.premiumPrice} />
        </div>
        {editing && <p className="text-xs text-stone-500">New prices apply to seats that are still free. Seats already booked keep their price.</p>}
      </form>
    </Modal>
  );
}

export default function ShowtimesPage() {
  const [filters, setFilters] = useState({ movieId: "", screenId: "", status: "", when: "upcoming" });
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(undefined);
  const [cancelling, setCancelling] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const movies = useFetch(() => adminService.listMovies({ limit: 100 }), []);
  const screens = useFetch(adminService.listScreens, []);

  const params = useMemo(() => {
    const now = new Date().toISOString();
    return {
      page,
      limit: 10,
      movieId: filters.movieId || undefined,
      screenId: filters.screenId || undefined,
      status: filters.status || undefined,
      from: filters.when === "upcoming" ? now : undefined,
      to: filters.when === "past" ? now : undefined,
    };
  }, [page, filters]);
  const { data, loading, error, reload } = useFetch(() => adminService.listShowtimes(params), [params]);
  const items = data?.items ?? [];

  const setFilter = (name) => (event) => {
    setFilters((prev) => ({ ...prev, [name]: event.target.value }));
    setPage(1);
  };

  const afterChange = () => {
    if (items.length === 1 && page > 1) setPage(page - 1);
    else reload();
  };

  const handleCancel = async () => {
    await adminService.cancelShowtime(cancelling.id);
    toast.success("Showtime cancelled");
    setCancelling(null);
    reload();
  };
  const handleDelete = async () => {
    await adminService.deleteShowtime(deleting.id);
    toast.success("Showtime deleted");
    setDeleting(null);
    afterChange();
  };

  const movieOptions = (movies.data?.items ?? []).map((m) => ({ value: m.id, label: m.title }));
  const screenOptions = (screens.data ?? []).map((s) => ({ value: s.id, label: s.name }));
  const filtered = Boolean(filters.movieId || filters.screenId || filters.status);

  return (
    <>
      <PageHeader
        title="Showtimes"
        description="Schedule movies on screens. Overlapping shows are blocked automatically."
        actions={<Button onClick={() => setEditing(null)} disabled={!movies.data || !screens.data}><FiPlus /> Schedule showtime</Button>}
      />

      <div className="rounded-lg border border-stone-200 bg-white">
        <div className="grid gap-3 border-b border-stone-200 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <SelectField hideLabel label="Filter by movie" name="movieFilter" value={filters.movieId} onChange={setFilter("movieId")} options={movieOptions} placeholder="All movies" />
          <SelectField hideLabel label="Filter by screen" name="screenFilter" value={filters.screenId} onChange={setFilter("screenId")} options={screenOptions} placeholder="All screens" />
          <SelectField hideLabel label="Filter by status" name="statusFilter" value={filters.status} onChange={setFilter("status")} options={STATUS_OPTIONS} placeholder="Any status" />
          <SelectField hideLabel label="Filter by date" name="whenFilter" value={filters.when} onChange={setFilter("when")} options={WHEN_OPTIONS} />
        </div>

        {loading && !data && <TableSkeleton />}
        {error && !data && <ErrorState message={error} onRetry={reload} />}
        {error && data && <div role="alert" className="border-b border-red-100 bg-red-50 px-5 py-2 text-sm text-red-800">{error} <button className="underline" onClick={reload}>Retry</button></div>}

        {data && items.length === 0 && (
          <EmptyState title={filtered || filters.when !== "all" ? "No showtimes match your filters" : "No showtimes yet"} hint="Schedule a movie on a screen to get started." />
        )}

        {items.length > 0 && (
          <div className={`overflow-x-auto ${loading ? "opacity-60" : ""}`}>
            <table className="w-full text-left text-sm">
              <thead className="border-b border-stone-200 bg-stone-50 text-stone-600">
                <tr>
                  <th className="px-5 py-3 font-medium">Movie</th>
                  <th className="px-5 py-3 font-medium">Screen</th>
                  <th className="px-5 py-3 font-medium">When</th>
                  <th className="hidden px-5 py-3 font-medium md:table-cell">Seats booked</th>
                  <th className="hidden px-5 py-3 font-medium lg:table-cell">Prices</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {items.map((s) => (
                  <tr key={s.id}>
                    <td className="px-5 py-3 font-medium">{s.movie.title}</td>
                    <td className="whitespace-nowrap px-5 py-3">{s.screen.name}</td>
                    <td className="whitespace-nowrap px-5 py-3">{formatDateTime(s.startTime)}<div className="text-xs text-stone-500">until {formatTime(s.endTime)}</div></td>
                    <td className="hidden px-5 py-3 md:table-cell">
                      <span>{s.bookedSeats} / {s.totalSeats}</span>
                      <div className="mt-1 h-1.5 w-24 rounded bg-stone-100"><div className="h-1.5 rounded bg-red-800" style={{ width: `${s.totalSeats ? (s.bookedSeats / s.totalSeats) * 100 : 0}%` }} /></div>
                    </td>
                    <td className="hidden whitespace-nowrap px-5 py-3 lg:table-cell">{formatCurrency(s.standardPrice)} <span className="text-stone-400">/</span> {formatCurrency(s.premiumPrice)}</td>
                    <td className="px-5 py-3"><StatusBadge status={s.status} /></td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" disabled={!canEdit(s)} title={canEdit(s) ? "Edit" : "Only upcoming scheduled showtimes can be edited"} onClick={() => setEditing(s)} aria-label={`Edit showtime of ${s.movie.title}`}><FiEdit2 /></Button>
                        <Button variant="ghost" size="sm" disabled={s.status !== "SCHEDULED" || s.confirmedBookings > 0} title={s.confirmedBookings > 0 ? "Has confirmed bookings" : "Cancel showtime"} onClick={() => setCancelling(s)} aria-label={`Cancel showtime of ${s.movie.title}`}><FiSlash /></Button>
                        <Button variant="ghost" size="sm" className="text-red-700" disabled={s.hasBookings} title={s.hasBookings ? "Has bookings" : "Delete"} onClick={() => setDeleting(s)} aria-label={`Delete showtime of ${s.movie.title}`}><FiTrash2 /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination pagination={data?.pagination} onPageChange={setPage} />
      </div>

      {editing !== undefined && (
        <ShowtimeFormModal showtime={editing} movies={movies.data?.items ?? []} screens={screens.data ?? []} onClose={() => setEditing(undefined)} onSaved={() => { setEditing(undefined); reload(); }} />
      )}
      {cancelling && (
        <ConfirmDialog title="Cancel showtime?" message={`${cancelling.movie.title} on ${formatDateTime(cancelling.startTime)} (${cancelling.screen.name}) will be cancelled and the time slot freed.`} confirmLabel="Cancel showtime" danger onConfirm={handleCancel} onCancel={() => setCancelling(null)} />
      )}
      {deleting && (
        <ConfirmDialog title="Delete showtime?" message={`${deleting.movie.title} on ${formatDateTime(deleting.startTime)} (${deleting.screen.name}) will be permanently deleted.`} confirmLabel="Delete showtime" danger onConfirm={handleDelete} onCancel={() => setDeleting(null)} />
      )}
    </>
  );
}
