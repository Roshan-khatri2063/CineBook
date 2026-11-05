import { Link, NavLink } from "react-router-dom";
import { MdMovie } from "react-icons/md";
import { FiLogOut } from "react-icons/fi";
import { toast } from "sonner";
import useAuth from "../hooks/useAuth.js";

const linkClass = ({ isActive }) =>
  `rounded-md px-3 py-1.5 text-sm ${
    isActive ? "bg-stone-200 font-medium" : "text-stone-700 hover:bg-stone-100"
  }`;

export default function Navbar() {
  const { user, loading, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    toast.success("You have been logged out");
  };

  return (
    <header className="border-b border-stone-200 bg-white">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <Link
          to="/"
          className="flex items-center gap-2 text-lg font-bold tracking-tight"
        >
          <MdMovie className="text-2xl text-red-800" />
          CineBook Lite
        </Link>

        <div className="flex items-center gap-1">
          {loading && <span className="px-3 text-sm text-stone-400">…</span>}

          {!loading && !user && (
            <>
              <NavLink to="/login" className={linkClass}>
                Log in
              </NavLink>
              <Link
                to="/register"
                className="rounded-md bg-red-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-900"
              >
                Sign up
              </Link>
            </>
          )}

          {!loading && user && (
            <>
              {user.role === "ADMIN" && (
                <NavLink to="/admin" className={linkClass}>
                  Admin
                </NavLink>
              )}
              <NavLink to="/account" className={linkClass}>
                {user.name}
              </NavLink>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-100"
              >
                <FiLogOut /> Log out
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
