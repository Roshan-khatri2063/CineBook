import { FiAlertCircle, FiInbox } from "react-icons/fi";
import Button from "./Button.jsx";

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="animate-pulse space-y-3 p-5" role="status" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-8 rounded bg-stone-100" />
      ))}
    </div>
  );
}

export function EmptyState({ title, hint, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center text-stone-500">
      <FiInbox className="mb-3 text-3xl text-stone-400" />
      <p className="font-medium text-stone-700">{title}</p>
      {hint && <p className="mt-1 text-sm">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div role="alert" className="flex flex-col items-center px-6 py-14 text-center">
      <FiAlertCircle className="mb-3 text-3xl text-red-600" />
      <p className="font-medium text-stone-800">Something went wrong</p>
      <p className="mt-1 text-sm text-stone-600">{message}</p>
      {onRetry && <Button variant="secondary" className="mt-4" onClick={onRetry}>Try again</Button>}
    </div>
  );
}
