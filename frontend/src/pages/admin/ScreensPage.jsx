import { useState } from "react";
import { Link } from "react-router-dom";
import { FiEdit2, FiGrid, FiMonitor, FiPlus, FiTrash2 } from "react-icons/fi";
import { toast } from "sonner";
import FormField from "../../components/FormField.jsx";
import Button from "../../components/ui/Button.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import Modal from "../../components/ui/Modal.jsx";
import PageHeader from "../../components/ui/PageHeader.jsx";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import { EmptyState, ErrorState, TableSkeleton } from "../../components/ui/StateViews.jsx";
import useFetch from "../../hooks/useFetch.js";
import * as adminService from "../../services/adminService.js";
import { getErrorMessage, getFieldErrors } from "../../utils/getErrorMessage.js";

function ScreenFormModal({ screen, onClose, onSaved }) {
  const editing = Boolean(screen);
  const [name, setName] = useState(screen?.name ?? "");
  const [isActive, setIsActive] = useState(screen?.isActive ?? true);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    if (!name.trim()) return setErrors({ name: "Screen name is required" });

    setSaving(true);
    try {
      const body = { name: name.trim(), isActive };
      const result = editing ? await adminService.updateScreen(screen.id, body) : await adminService.createScreen(body);
      toast.success(editing ? "Screen updated" : "Screen created. Now set up its seats.");
      onSaved(result.screen, editing);
    } catch (error) {
      const fields = getFieldErrors(error);
      setErrors(fields);
      setFormError(Object.keys(fields).length > 0 ? "" : getErrorMessage(error));
      setSaving(false);
    }
    return undefined;
  };

  return (
    <Modal
      title={editing ? "Edit screen" : "Add screen"}
      onClose={saving ? () => {} : onClose}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" form="screen-form" disabled={saving}>{saving ? "Saving…" : editing ? "Save changes" : "Create screen"}</Button>
        </>
      }
    >
      <form id="screen-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && <div role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">{formError}</div>}
        <FormField label="Screen name" name="name" value={name} onChange={(e) => { setName(e.target.value); setErrors({}); }} error={errors.name} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 accent-red-800" />
          Active (new showtimes can be scheduled)
        </label>
      </form>
    </Modal>
  );
}

export default function ScreensPage() {
  const { data: screens, loading, error, reload } = useFetch(adminService.listScreens, []);
  const [editing, setEditing] = useState(undefined);
  const [deleting, setDeleting] = useState(null);

  const handleDelete = async () => {
    await adminService.deleteScreen(deleting.id);
    toast.success(`"${deleting.name}" deleted`);
    setDeleting(null);
    reload();
  };

  return (
    <>
      <PageHeader
        title="Screens"
        description="Halls and their seating."
        actions={<Button onClick={() => setEditing(null)}><FiPlus /> Add screen</Button>}
      />

      {loading && !screens && <div className="rounded-lg border border-stone-200 bg-white"><TableSkeleton /></div>}
      {error && !screens && <div className="rounded-lg border border-stone-200 bg-white"><ErrorState message={error} onRetry={reload} /></div>}
      {screens?.length === 0 && (
        <div className="rounded-lg border border-stone-200 bg-white">
          <EmptyState title="No screens yet" hint="Add a screen, then build its seat layout." action={<Button onClick={() => setEditing(null)}><FiPlus /> Add screen</Button>} />
        </div>
      )}

      {screens?.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {screens.map((screen) => (
            <div key={screen.id} className="flex flex-col rounded-lg border border-stone-200 bg-white p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="rounded-md bg-red-50 p-2 text-red-800"><FiMonitor /></span>
                  <h2 className="text-lg font-semibold">{screen.name}</h2>
                </div>
                <StatusBadge status={screen.isActive ? "ACTIVE" : "INACTIVE"} />
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded bg-stone-50 p-2"><dt className="text-stone-500">Seats</dt><dd className="text-lg font-semibold">{screen._count.seats}</dd></div>
                <div className="rounded bg-stone-50 p-2"><dt className="text-stone-500">Showtimes</dt><dd className="text-lg font-semibold">{screen._count.showtimes}</dd></div>
              </dl>
              {screen._count.seats === 0 && <p className="mt-3 text-sm text-amber-700">No seats yet. Showtimes cannot be scheduled.</p>}
              <div className="mt-auto flex flex-wrap gap-2 pt-4">
                <Link to={`/admin/screens/${screen.id}/seats`} className="inline-flex items-center gap-2 rounded-md bg-red-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-900"><FiGrid /> Seat layout</Link>
                <Button variant="secondary" size="sm" onClick={() => setEditing(screen)} aria-label={`Edit ${screen.name}`}><FiEdit2 /> Edit</Button>
                <Button variant="ghost" size="sm" className="text-red-700" onClick={() => setDeleting(screen)} aria-label={`Delete ${screen.name}`}><FiTrash2 /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing !== undefined && (
        <ScreenFormModal screen={editing} onClose={() => setEditing(undefined)} onSaved={() => { setEditing(undefined); reload(); }} />
      )}
      {deleting && (
        <ConfirmDialog
          danger
          title="Delete screen?"
          message={`"${deleting.name}", its ${deleting._count.seats} seat(s) and its ${deleting._count.showtimes} unbooked showtime(s) will be permanently deleted.`}
          confirmLabel="Delete screen"
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </>
  );
}
