import { Routes, Route } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import GuestRoute from "../components/GuestRoute.jsx";
import ProtectedRoute from "../components/ProtectedRoute.jsx";
import AdminLayout from "../components/admin/AdminLayout.jsx";
import HomePage from "../pages/HomePage.jsx";
import MovieDetailPage from "../pages/MovieDetailPage.jsx";
import BookingPage from "../pages/BookingPage.jsx";
import BookingConfirmationPage from "../pages/BookingConfirmationPage.jsx";
import LoginPage from "../pages/LoginPage.jsx";
import RegisterPage from "../pages/RegisterPage.jsx";
import AccountPage from "../pages/AccountPage.jsx";
import NotFoundPage from "../pages/NotFoundPage.jsx";
import DashboardPage from "../pages/admin/DashboardPage.jsx";
import MoviesPage from "../pages/admin/MoviesPage.jsx";
import ScreensPage from "../pages/admin/ScreensPage.jsx";
import SeatLayoutPage from "../pages/admin/SeatLayoutPage.jsx";
import ShowtimesPage from "../pages/admin/ShowtimesPage.jsx";
import BookingsPage from "../pages/admin/BookingsPage.jsx";
import CustomersPage from "../pages/admin/CustomersPage.jsx";

// Later modules add their routes here (booking history, tickets...).
export default function AppRoutes() {
  return (
    <Routes>
      {/* Public site: has the normal navbar */}
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/movies/:id" element={<MovieDetailPage />} />
        <Route
          path="/showtimes/:id/book"
          element={
            <ProtectedRoute roles={["CUSTOMER"]}>
              <BookingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings/:id/confirmation"
          element={
            <ProtectedRoute roles={["CUSTOMER"]}>
              <BookingConfirmationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/login"
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <RegisterPage />
            </GuestRoute>
          }
        />
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <AccountPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Admin area: own layout with sidebar, ADMIN role only */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={["ADMIN"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="movies" element={<MoviesPage />} />
        <Route path="screens" element={<ScreensPage />} />
        <Route path="screens/:id/seats" element={<SeatLayoutPage />} />
        <Route path="showtimes" element={<ShowtimesPage />} />
        <Route path="bookings" element={<BookingsPage />} />
        <Route path="customers" element={<CustomersPage />} />
      </Route>

      <Route element={<Layout />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
