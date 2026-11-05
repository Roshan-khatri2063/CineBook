import { useContext } from "react";
import { AuthContext } from "../context/authContext.js";

// Gives any component: { user, loading, login, register, logout }
export default function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
