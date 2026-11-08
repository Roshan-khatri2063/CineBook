import { useState } from "react";
import Modal from "./Modal.jsx";
import Button from "./Button.jsx";
import { getErrorMessage } from "../../utils/getErrorMessage.js";

// "Are you sure?" dialog. If the server refuses (for example "this movie has
// confirmed bookings") the reason is shown inside the dialog.
export default function ConfirmDialog({ title, message, confirmLabel = "Confirm", danger = false, onConfirm, onCancel }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    setBusy(true);
    setError("");
    try {
      await onConfirm();
    } catch (err) {
      setError(getErrorMessage(err));
      setBusy(false);
    }
  };

  return (
    <Modal
      title={title}
      onClose={busy ? () => {} : onCancel}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={busy}>Cancel</Button>
          <Button variant={danger ? "danger" : "primary"} onClick={handleConfirm} disabled={busy}>
            {busy ? "Please wait…" : confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-stone-700">{message}</p>
      {error && (
        <div role="alert" className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>
      )}
    </Modal>
  );
}
