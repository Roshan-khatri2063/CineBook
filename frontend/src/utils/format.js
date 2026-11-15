// Display helpers used by the admin pages.
const pad = (n) => String(n).padStart(2, "0");

export const formatCurrency = (value) =>
  `Rs ${Number(value ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export const formatDateTime = (iso) =>
  new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

export const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString(undefined, { timeStyle: "short" });

// Release dates are plain calendar dates stored at UTC midnight.
export const formatReleaseDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, {
    dateStyle: "medium",
    timeZone: "UTC",
  });

export const formatDuration = (minutes) =>
  `${Math.floor(minutes / 60)}h ${minutes % 60}m`;

// "2026-12-05T00:00:00.000Z" -> "2026-12-05" (value for <input type="date">)
export const toDateInput = (iso) => iso.slice(0, 10);

// ISO string <-> value of <input type="datetime-local"> (browser local time)
export const toLocalInput = (iso) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
export const fromLocalInput = (value) => new Date(value).toISOString();

// "NOW_SHOWING" -> "Now showing"
export const titleCase = (value) =>
  value
    ? value.charAt(0) + value.slice(1).toLowerCase().replaceAll("_", " ")
    : "";

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" });

// "2026-11-12" style key, used to group showtimes by calendar day (local time)
export const dayKey = (iso) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const formatDayHeading = (iso) =>
  new Date(iso).toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

// Card form helpers: "4242424242424242" -> "4242 4242 4242 4242", "1230" -> "12/30"
export const formatCardNumber = (value) =>
  value
    .replace(/\D/g, "")
    .slice(0, 19)
    .replace(/(.{4})/g, "$1 ")
    .trim();

export const formatExpiry = (value) => {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  return digits.length > 2
    ? `${digits.slice(0, 2)}/${digits.slice(2)}`
    : digits;
};
