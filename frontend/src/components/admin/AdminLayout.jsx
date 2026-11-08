import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { MdMovie } from "react-icons/md";
import { FiClock, FiFilm, FiHome, FiLogOut, FiMenu, FiMonitor, FiTag, FiUsers, FiX, FiExternalLink } from "react-icons/fi";
import { toast } from "sonner";
import useAuth from "../../hooks/useAuth.js";

const NAV_ITEMS = [
  { to: "/admin", label: "Dashboard", icon: FiHome, end: true },
  { to: "/admin/movies", label: "Movies", icon: FiFilm },
  { to: "/admin/screens", label: "Screens", icon: FiMonitor },
  { to: "/admin/showtimes", label: "Showtimes", icon: FiClock },
  { to: "/admin/bookings", label: "Bookings", icon: FiTag },
  { to: "/admin/customers", label: "Customers", icon: FiUsers },
];

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? "bg-red-800 text-white" : "text-stone-300 hover:bg-stone-800 hover:text-white"
  }`;

// Sidebar on large screens, slide-in drawer on phones and tablets.
export default function AdminLayout() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  const handleLogout = async () => {
    await logout();
    toast.success("You have been logged out");
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Top bar (phones and tablets) */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-stone-200 bg-white px-4 py-3 lg:hidden">
        <button onClick={() => setMenuOpen(true)} aria-label="Open menu" className="rounded p-1.5 hover:bg-stone-100">
          <FiMenu className="text-xl" />
        </button>
        <span className="flex items-center gap-2 font-bold"><MdMovie className="text-xl text-red-800" /> CineBook Admin</span>
        <span className="w-8" />
      </header>

      {menuOpen && <div className="fixed inset-0 z-40 bg-stone-900/50 lg:hidden" onClick={closeMenu} />}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-stone-900 text-white transition-transform lg:translate-x-0 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Admin navigation"
      >
        <div className="flex items-center justify-between px-5 py-5">
          <Link to="/admin" onClick={closeMenu} className="flex items-center gap-2 text-lg font-bold">
            <MdMovie className="text-2xl text-red-500" /> CineBook Admin
          </Link>
          <button onClick={closeMenu} aria-label="Close menu" className="rounded p-1 text-stone-400 hover:bg-stone-800 lg:hidden">
            <FiX />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} onClick={closeMenu} className={linkClass}>
              <Icon className="text-lg" /> {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-stone-800 p-4 text-sm">
          <p className="truncate font-medium">{user?.name}</p>
          <p className="truncate text-xs text-stone-400">{user?.email}</p>
          <div className="mt-3 flex flex-col gap-1">
            <Link to="/" className="flex items-center gap-2 rounded px-2 py-1.5 text-stone-300 hover:bg-stone-800">
              <FiExternalLink /> View site
            </Link>
            <button onClick={handleLogout} className="flex items-center gap-2 rounded px-2 py-1.5 text-left text-stone-300 hover:bg-stone-800">
              <FiLogOut /> Log out
            </button>
          </div>
        </div>
      </aside>

      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
