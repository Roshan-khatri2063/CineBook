import { useMemo, useState } from "react";
import { FiEdit2, FiFilm, FiPlus, FiSearch, FiTrash2 } from "react-icons/fi";
import { toast } from "sonner";
import FormField from "../../components/FormField.jsx";
import Button from "../../components/ui/Button.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import Modal from "../../components/ui/Modal.jsx";
import PageHeader from "../../components/ui/PageHeader.jsx";
import Pagination from "../../components/ui/Pagination.jsx";
import SelectField from "../../components/ui/SelectField.jsx";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import TextAreaField from "../../components/ui/TextAreaField.jsx";
import { EmptyState, ErrorState, TableSkeleton } from "../../components/ui/StateViews.jsx";
import useDebounce from "../../hooks/useDebounce.js";
import useFetch from "../../hooks/useFetch.js";
import * as adminService from "../../services/adminService.js";
import { formatDuration, formatReleaseDate, toDateInput } from "../../utils/format.js";
import { getErrorMessage, getFieldErrors } from "../../utils/getErrorMessage.js";

const STATUS_OPTIONS = [
  { value: "NOW_SHOWING", label: "Now showing" },
  { value: "COMING_SOON", label: "Coming soon" },
  { value: "ENDED", label: "Ended" },
];

const EMPTY_FORM = {
  title: "", description: "", genre: "", language: "", durationMinutes: "",
  releaseDate: "", ageRating: "", status: "COMING_SOON", posterUrl: "", trailerUrl: "",
};

const formFromMovie = (movie) => ({
  title: movie.title,
  description: movie.description,
  genre: movie.genre,
  language: movie.language,
  durationMinutes: String(movie.durationMinutes),
  releaseDate: toDateInput(movie.releaseDate),
  ageRating: movie.ageRating ?? "",
  status: movie.status,
  posterUrl: movie.posterUrl ?? "",
  trailerUrl: movie.trailerUrl ?? "",
});

const validate = (form) => {
  const errors = {};
  if (!form.title.trim()) errors.title = "Title is required";
  if (!form.description.trim()) errors.description = "Description is required";
  if (!form.genre.trim()) errors.genre = "Genre is required";
  if (!form.language.trim()) errors.language = "Language is required";
  const minutes = Number(form.durationMinutes);
  if (!form.durationMinutes || !Number.isInteger(minutes) || minutes < 1 || minutes > 600) {
    errors.durationMinutes = "Enter whole minutes between 1 and 600";
  }
  if (!form.releaseDate) errors.releaseDate = "Release date is required";
  return errors;
};

function MovieFormModal({ movie, onClose, onSaved }) {
  const editing = Boolean(movie);
  const [form, setForm] = useState(() => (movie ? formFromMovie(movie) : EMPTY_FORM));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    const problems = validate(form);
    setErrors(problems);
    if (Object.keys(problems).length > 0) return;

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      genre: form.genre.trim(),
      language: form.language.trim(),
      durationMinutes: Number(form.durationMinutes),
      releaseDate: form.releaseDate,
      ageRating: form.ageRating.trim() || null,
      status: form.status,
      posterUrl: form.posterUrl.trim() || null,
      trailerUrl: form.trailerUrl.trim() || null,
    };

    setSaving(true);
    try {
      if (editing) await adminService.updateMovie(movie.id, payload);
      else await adminService.createMovie(payload);
      toast.success(editing ? "Movie updated" : "Movie created");
      onSaved();
    } catch (error) {
      const fields = getFieldErrors(error);
      setErrors(fields);
      // A message under a field is enough; the banner is only for errors without a field.
      setFormError(Object.keys(fields).length > 0 ? "" : getErrorMessage(error));
      setSaving(false);
    }
  };

  return (
    <Modal
      title={editing ? "Edit movie" : "Add movie"}
      onClose={saving ? () => {} : onClose}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" form="movie-form" disabled={saving}>{saving ? "Saving…" : editing ? "Save changes" : "Create movie"}</Button>
        </>
      }
    >
      <form id="movie-form" onSubmit={handleSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
        {formError && <div role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 sm:col-span-2">{formError}</div>}
        <div className="sm:col-span-2"><FormField label="Title" name="title" value={form.title} onChange={handleChange} error={errors.title} /></div>
        <div className="sm:col-span-2"><TextAreaField label="Description" name="description" value={form.description} onChange={handleChange} error={errors.description} /></div>
        <FormField label="Genre" name="genre" value={form.genre} onChange={handleChange} error={errors.genre} />
        <FormField label="Language" name="language" value={form.language} onChange={handleChange} error={errors.language} />
        <FormField label="Duration (minutes)" name="durationMinutes" type="number" min="1" max="600" value={form.durationMinutes} onChange={handleChange} error={errors.durationMinutes} />
        <FormField label="Release date" name="releaseDate" type="date" value={form.releaseDate} onChange={handleChange} error={errors.releaseDate} />
        <FormField label="Age rating (optional)" name="ageRating" placeholder="PG-13" value={form.ageRating} onChange={handleChange} error={errors.ageRating} />
        <SelectField label="Status" name="status" value={form.status} onChange={handleChange} options={STATUS_OPTIONS} error={errors.status} />
        <div className="sm:col-span-2"><FormField label="Poster URL (optional)" name="posterUrl" type="url" placeholder="https://…" value={form.posterUrl} onChange={handleChange} error={errors.posterUrl} /></div>
        <div className="sm:col-span-2"><FormField label="Trailer URL (optional)" name="trailerUrl" type="url" placeholder="https://…" value={form.trailerUrl} onChange={handleChange} error={errors.trailerUrl} /></div>
      </form>
    </Modal>
  );
}

export default function MoviesPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(undefined); // undefined = closed, null = new movie, object = edit
  const [deleting, setDeleting] = useState(null);

  const q = useDebounce(search);
  const params = useMemo(() => ({ page, limit: 10, q: q || undefined, status: status || undefined }), [page, q, status]);
  const { data, loading, error, reload } = useFetch(() => adminService.listMovies(params), [params]);

  const items = data?.items ?? [];
  const filtered = Boolean(q || status);

  const handleDelete = async () => {
    await adminService.deleteMovie(deleting.id);
    toast.success(`"${deleting.title}" deleted`);
    setDeleting(null);
    if (items.length === 1 && page > 1) setPage(page - 1);
    else reload();
  };

  return (
    <>
      <PageHeader
        title="Movies"
        description="Manage the films shown at the cinema."
        actions={<Button onClick={() => setEditing(null)}><FiPlus /> Add movie</Button>}
      />

      <div className="rounded-lg border border-stone-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-stone-200 p-4 sm:flex-row">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="search"
              aria-label="Search movies"
              placeholder="Search by title…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full rounded-md border border-stone-300 py-2 pl-9 pr-3 outline-none focus:border-red-800 focus:ring-2 focus:ring-red-800/30"
            />
          </div>
          <div className="sm:w-48">
            <SelectField hideLabel label="Filter by status" name="statusFilter" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} options={STATUS_OPTIONS} placeholder="All statuses" />
          </div>
        </div>

        {loading && !data && <TableSkeleton />}
        {error && !data && <ErrorState message={error} onRetry={reload} />}
        {error && data && <div role="alert" className="border-b border-red-100 bg-red-50 px-5 py-2 text-sm text-red-800">{error} <button className="underline" onClick={reload}>Retry</button></div>}

        {data && items.length === 0 && (
          <EmptyState
            title={filtered ? "No movies match your filters" : "No movies yet"}
            hint={filtered ? "Try a different search or status." : "Add your first movie to get started."}
            action={!filtered && <Button onClick={() => setEditing(null)}><FiPlus /> Add movie</Button>}
          />
        )}

        {items.length > 0 && (
          <div className={`overflow-x-auto ${loading ? "opacity-60" : ""}`}>
            <table className="w-full text-left text-sm">
              <thead className="border-b border-stone-200 bg-stone-50 text-stone-600">
                <tr>
                  <th className="px-5 py-3 font-medium">Movie</th>
                  <th className="hidden px-5 py-3 font-medium md:table-cell">Duration</th>
                  <th className="hidden px-5 py-3 font-medium md:table-cell">Release</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="hidden px-5 py-3 font-medium sm:table-cell">Showtimes</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {items.map((movie) => (
                  <tr key={movie.id}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {movie.posterUrl ? (
                          <img src={movie.posterUrl} alt="" className="h-12 w-9 rounded object-cover" />
                        ) : (
                          <span className="flex h-12 w-9 items-center justify-center rounded bg-stone-100 text-stone-400"><FiFilm /></span>
                        )}
                        <div>
                          <p className="font-medium">{movie.title}</p>
                          <p className="text-xs text-stone-500">{movie.genre} · {movie.language}{movie.ageRating ? ` · ${movie.ageRating}` : ""}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden whitespace-nowrap px-5 py-3 md:table-cell">{formatDuration(movie.durationMinutes)}</td>
                    <td className="hidden whitespace-nowrap px-5 py-3 md:table-cell">{formatReleaseDate(movie.releaseDate)}</td>
                    <td className="px-5 py-3"><StatusBadge status={movie.status} /></td>
                    <td className="hidden px-5 py-3 sm:table-cell">{movie._count.showtimes}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setEditing(movie)} aria-label={`Edit ${movie.title}`}><FiEdit2 /></Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleting(movie)} aria-label={`Delete ${movie.title}`} className="text-red-700"><FiTrash2 /></Button>
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
        <MovieFormModal movie={editing} onClose={() => setEditing(undefined)} onSaved={() => { setEditing(undefined); reload(); }} />
      )}
      {deleting && (
        <ConfirmDialog
          danger
          title="Delete movie?"
          message={`"${deleting.title}" and its ${deleting._count.showtimes} unbooked showtime(s) will be permanently deleted. This cannot be undone.`}
          confirmLabel="Delete movie"
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </>
  );
}
