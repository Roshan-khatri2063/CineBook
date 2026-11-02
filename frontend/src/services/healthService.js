import api from "./api.js";

export const getHealth = async () => {
  const response = await api.get("/health", {
    validateStatus: (status) => status === 200 || status === 503,
  });
  return response.data;
};
