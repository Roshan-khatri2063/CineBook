// Where each role lands after logging in.
export const getHomePath = (user) => (user?.role === "ADMIN" ? "/admin" : "/");
