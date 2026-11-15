import { useState } from "react";
import { FiLock } from "react-icons/fi";
import FormField from "../FormField.jsx";
import Button from "../ui/Button.jsx";
import {
  formatCardNumber,
  formatCurrency,
  formatExpiry,
} from "../../utils/format.js";

const validate = (form) => {
  const errors = {};
  if (form.cardholderName.trim().length < 2)
    errors.cardholderName = "Enter the name on the card";
  const digits = form.cardNumber.replace(/\s/g, "");
  if (!/^\d{12,19}$/.test(digits))
    errors.cardNumber = "Enter a valid card number";
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(form.expiry))
    errors.expiry = "Use the format MM/YY";
  if (!/^\d{3,4}$/.test(form.cvc)) errors.cvc = "Enter the 3 or 4 digit CVC";
  return errors;
};

// Simulated payment form. Nothing here is a real payment.
export default function PaymentForm({
  total,
  submitting,
  disabled,
  error,
  onSubmit,
}) {
  const [form, setForm] = useState({
    cardholderName: "",
    cardNumber: "",
    expiry: "",
    cvc: "",
  });
  const [errors, setErrors] = useState({});

  const handleChange = (event) => {
    const { name, value } = event.target;
    const next =
      name === "cardNumber"
        ? formatCardNumber(value)
        : name === "expiry"
          ? formatExpiry(value)
          : name === "cvc"
            ? value.replace(/\D/g, "").slice(0, 4)
            : value;
    setForm((prev) => ({ ...prev, [name]: next }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const problems = validate(form);
    setErrors(problems);
    if (Object.keys(problems).length > 0) return;
    onSubmit({
      cardholderName: form.cardholderName.trim(),
      cardNumber: form.cardNumber,
      expiry: form.expiry,
      cvc: form.cvc,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-lg border border-stone-200 bg-white p-5"
      aria-label="Payment"
    >
      <h2 className="font-semibold">Payment</h2>

      <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        <p className="font-semibold">Simulated payment: no money is taken.</p>
        <p className="mt-1">
          Never enter real card details. Use{" "}
          <code className="rounded bg-white px-1">4242 4242 4242 4242</code> to
          succeed, or{" "}
          <code className="rounded bg-white px-1">4000 0000 0000 0002</code> to
          see a declined card. Any name, a future date and any 3 digits will do.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <FormField
            label="Name on card"
            name="cardholderName"
            autoComplete="off"
            value={form.cardholderName}
            onChange={handleChange}
            error={errors.cardholderName}
          />
        </div>
        <div className="sm:col-span-2">
          <FormField
            label="Card number"
            name="cardNumber"
            inputMode="numeric"
            autoComplete="off"
            placeholder="4242 4242 4242 4242"
            value={form.cardNumber}
            onChange={handleChange}
            error={errors.cardNumber}
          />
        </div>
        <FormField
          label="Expiry (MM/YY)"
          name="expiry"
          inputMode="numeric"
          autoComplete="off"
          placeholder="12/30"
          value={form.expiry}
          onChange={handleChange}
          error={errors.expiry}
        />
        <FormField
          label="CVC"
          name="cvc"
          inputMode="numeric"
          autoComplete="off"
          placeholder="123"
          value={form.cvc}
          onChange={handleChange}
          error={errors.cvc}
        />
      </div>

      <Button
        type="submit"
        className="mt-5 w-full py-3 text-base"
        disabled={submitting || disabled}
      >
        <FiLock />{" "}
        {submitting ? "Processing payment…" : `Pay ${formatCurrency(total)}`}
      </Button>
    </form>
  );
}
