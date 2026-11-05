export default function PageLoader({ label = "Loading…" }) {
  return (
    <div className="flex items-center justify-center py-24 text-stone-500" role="status">
      {label}
    </div>
  );
}
