// Quick checks in the browser so users get instant feedback.
// The backend validates everything again: these are only a convenience.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9\s-]{7,15}$/;

const passwordProblem = (password) => {
  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return "Password must contain a letter and a number";
  }
  return null;
};

export const validateLogin = ({ email, password }) => {
  const errors = {};
  if (!email.trim()) errors.email = "Email is required";
  else if (!EMAIL_PATTERN.test(email.trim()))
    errors.email = "Enter a valid email address";
  if (!password) errors.password = "Password is required";
  return errors;
};

export const validateRegister = ({
  name,
  email,
  phone,
  password,
  confirmPassword,
}) => {
  const errors = {};
  if (name.trim().length < 2)
    errors.name = "Name must be at least 2 characters";
  if (!email.trim()) errors.email = "Email is required";
  else if (!EMAIL_PATTERN.test(email.trim()))
    errors.email = "Enter a valid email address";
  if (phone.trim() && !PHONE_PATTERN.test(phone.trim()))
    errors.phone = "Enter a valid phone number";
  const pwProblem = passwordProblem(password);
  if (pwProblem) errors.password = pwProblem;
  if (!errors.password && confirmPassword !== password) {
    errors.confirmPassword = "Passwords do not match";
  }
  return errors;
};
