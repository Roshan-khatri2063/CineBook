import { Navigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth.js";
import PageLoader from "./PageLoader.jsx";
import { getHomePath } from "../utils/roles.js";

export default function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader />;
  if (user) {
    const target = location.state?.from?.pathname || getHomePath(user);
    return <Navigate to={target} replace />;
  }
  return children;
}
