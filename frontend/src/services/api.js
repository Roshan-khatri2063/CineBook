import axios from "axios";
import { getToken } from "../utils/tokenStorage.js";

// One shared Axios instance. Every service file imports this.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  timeout: 10000,
});

// AuthProvider registers a function here that logs the user out locally.
let unauthorizedHandler = null;
export const setUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler;
};

// Attach the JWT to every request.
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If the server says the token is no longer valid (expired, user removed),
// log out locally. Requests to /auth/* handle their own errors.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthUrl = error.config?.url?.startsWith("/auth/");
    if (error.response?.status === 401 && getToken() && !isAuthUrl && unauthorizedHandler) {
      unauthorizedHandler();
    }
    return Promise.reject(error);
  },
);

export default api;
