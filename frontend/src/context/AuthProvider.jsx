import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AuthContext } from "./authContext.js";
import * as authService from "../services/authService.js";
import { setUnauthorizedHandler } from "../services/api.js";
import { clearToken, getToken, saveToken } from "../utils/tokenStorage.js";

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // While a stored token is being checked with the server, `loading` is true.
  const [loading, setLoading] = useState(() => Boolean(getToken()));

  const clearSession = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  // On page load: if a token is stored, ask the server who it belongs to.
  useEffect(() => {
    if (!getToken()) return undefined;
    let cancelled = false;

    authService
      .getMe()
      .then((currentUser) => {
        if (!cancelled) setUser(currentUser);
      })
      .catch((error) => {
        const status = error.response?.status;
        // Only drop the token when the server rejected it. If the backend is
        // simply down, keep the token so a refresh later can still work.
        if (!cancelled && (status === 401 || status === 403)) clearSession();
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  // Called by the Axios interceptor when a later request returns 401.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession();
      toast.error("Your session has expired. Please log in again.", {
        id: "session-expired",
      });
    });
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  const login = useCallback(async (credentials) => {
    const { user: loggedInUser, token } = await authService.login(credentials);
    saveToken(token);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const register = useCallback(async (payload) => {
    const { user: newUser, token } = await authService.register(payload);
    saveToken(token);
    setUser(newUser);
    return newUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      /* even if the server is unreachable, log out locally */
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
