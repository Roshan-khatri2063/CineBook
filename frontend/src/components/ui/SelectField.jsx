// A labelled <select>. `options` is [{ value, label }].
export default function SelectField({ label, name, value, onChange, options, error, placeholder, hideLabel = false, ...rest }) {
  return (
    <div>
      <label htmlFor={name} className={hideLabel ? "sr-only" : "mb-1 block text-sm font-medium text-stone-700"}>
        {label}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        aria-invalid={Boolean(error)}
        className={`w-full rounded-md border bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-red-800/30 ${error ? "border-red-600" : "border-stone-300 focus:border-red-800"}`}
        {...rest}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-700">{error}</p>}
    </div>
  );
}
