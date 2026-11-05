import { Outlet } from "react-router-dom";
import Navbar from "./Navbar.jsx";

// Wraps every page with the navigation bar.
export default function Layout() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}
