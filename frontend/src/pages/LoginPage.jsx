import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import FormField from "../components/FormField.jsx";
import useAuth from "../hooks/useAuth.js";
import { getErrorMessage, getFieldErrors } from "../utils/getErrorMessage.js";
import { validateLogin } from "../utils/validators.js";

export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    const errors = validateLogin(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      const user = await login({
        email: form.email.trim(),
        password: form.password,
      });
      toast.success(`Welcome back, ${user.name}`);
      // GuestRoute notices the new user and redirects.
    } catch (error) {
      setFieldErrors(getFieldErrors(error));
      setFormError(getErrorMessage(error));
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-2xl font-bold tracking-tight">Log in</h1>
      <p className="mt-1 text-stone-600">Welcome back to CineBook Lite.</p>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="mt-6 space-y-4 rounded-lg border border-stone-200 bg-white p-6"
      >
        {formError && (
          <div
            role="alert"
            className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800"
          >
            {formError}
          </div>
        )}

        <FormField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
          error={fieldErrors.email}
        />
        <FormField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={handleChange}
          error={fieldErrors.password}
        />

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-red-800 px-4 py-2 font-medium text-white hover:bg-red-900 disabled:opacity-60"
        >
          {submitting ? "Logging in…" : "Log in"}
        </button>
      </form>

      <p className="mt-4 text-sm text-stone-600">
        New here?{" "}
        <Link to="/register" className="text-red-800 underline">
          Create an account
        </Link>
      </p>
    </main>
  );
}
