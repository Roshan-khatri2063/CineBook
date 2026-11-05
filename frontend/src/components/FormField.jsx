import { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";

// A labelled input with an error message underneath.
// type="password" automatically gets a show/hide button.
export default function FormField({
  label,
  name,
  type = "text",
  value,
  onChange,
  error,
  ...rest
}) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";

  return (
    <div>
      <label
        htmlFor={name}
        className="mb-1 block text-sm font-medium text-stone-700"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={name}
          name={name}
          type={isPassword && visible ? "text" : type}
          value={value}
          onChange={onChange}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${name}-error` : undefined}
          className={`w-full rounded-md border bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-red-800/30 ${
            error ? "border-red-600" : "border-stone-300 focus:border-red-800"
          } ${isPassword ? "pr-10" : ""}`}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 px-3 text-stone-500 hover:text-stone-800"
          >
            {visible ? <FiEyeOff /> : <FiEye />}
          </button>
        )}
      </div>
      {error && (
        <p id={`${name}-error`} className="mt-1 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
