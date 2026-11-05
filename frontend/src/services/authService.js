import api from "./api.js";

// Each function returns just the useful part of the response.

export const register = async (payload) => {
  const response = await api.post("/auth/register", payload);
  return response.data.data; // { user, token }
};

export const login = async (credentials) => {
  const response = await api.post("/auth/login", credentials);
  return response.data.data; // { user, token }
};

export const logout = async () => {
  await api.post("/auth/logout");
};

export const getMe = async () => {
  const response = await api.get("/auth/me");
  return response.data.data.user;
};
