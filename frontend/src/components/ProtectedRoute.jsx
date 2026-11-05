import { Navigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth.js";
import PageLoader from "./PageLoader.jsx";
import ForbiddenPage from "../pages/ForbiddenPage.jsx";

// Only logged-in users get in. Pass roles={["ADMIN"]} to also require a role.
// This hides pages in the UI; the real protection is always the backend.
export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles && !roles.includes(user.role)) return <ForbiddenPage />;
  return children;
}
