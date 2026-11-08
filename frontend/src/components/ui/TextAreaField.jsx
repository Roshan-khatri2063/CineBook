export default function TextAreaField({ label, name, value, onChange, error, rows = 4, ...rest }) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium text-stone-700">{label}</label>
      <textarea
        id={name}
        name={name}
        rows={rows}
        value={value}
        onChange={onChange}
        aria-invalid={Boolean(error)}
        className={`w-full rounded-md border bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-red-800/30 ${error ? "border-red-600" : "border-stone-300 focus:border-red-800"}`}
        {...rest}
      />
      {error && <p className="mt-1 text-sm text-red-700">{error}</p>}
    </div>
  );
}
