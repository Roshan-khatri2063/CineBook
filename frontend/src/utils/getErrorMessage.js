export const getErrorMessage = (error) => {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.code === "ERR_NETWORK") {
    return "Cannot reach the server. Check that the backend is running.";
  }
  if (error?.code === "ECONNABORTED") return "The server took too long to respond.";
  return error?.message || "Something went wrong.";
};
