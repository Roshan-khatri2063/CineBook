// Turns any Axios/JS error into a message that is safe to show to the user.
export const getErrorMessage = (error) => {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.code === "ERR_NETWORK") {
    return "Cannot reach the server. Check that the backend is running.";
  }
  if (error?.code === "ECONNABORTED")
    return "The server took too long to respond.";
  return error?.message || "Something went wrong.";
};

// Backend validation errors look like: details: [{ field: "email", message: "..." }].
// Returns { email: "...", password: "..." } so each message can sit under its input.
export const getFieldErrors = (error) => {
  const details = error?.response?.data?.details;
  if (!Array.isArray(details)) return {};
  const fields = {};
  for (const item of details) {
    if (item.field && !fields[item.field]) fields[item.field] = item.message;
  }
  return fields;
};
