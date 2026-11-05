// The JWT is kept in localStorage. Every access is wrapped in try/catch because
// storage can be unavailable (private mode, blocked by browser settings).
const KEY = "cinebook_token";

export const getToken = () => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
};

export const saveToken = (token) => {
  try {
    localStorage.setItem(KEY, token);
  } catch {
    /* ignore: the user simply stays logged in for this tab only */
  }
};

export const clearToken = () => {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
};
