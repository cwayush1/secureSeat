import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import UserPortal from "./pages/UserPortal";
import BookingPage from "./pages/BookingPage";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import MyTickets from "./pages/MyTickets";
import SecurityScan from "./pages/SecurityScan";
import AdminDashboard from "./pages/AdminDashboard";
import { backendAPI } from "./services/api";
import "./index.css";
import Footer from "./components/Footer";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = window.localStorage.getItem("site-theme");
    return stored
      ? stored === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("theme-dark", darkMode);
    root.classList.toggle("theme-light", !darkMode);
    window.localStorage.setItem("site-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await backendAPI.get("/auth/me");
        setUser(response.data.user);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await backendAPI.post("/auth/logout");
      setUser(null);
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen text-lg font-['Inter'] app-shell">
        <div className="w-6 h-6 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mr-3" />
        Loading SecureSeat...
      </div>
    );

  const isLoggedIn = !!user;

  // 👉 FIX: Force uppercase to prevent any database case-sensitivity bugs ('security' vs 'Security')
  const userRole = user?.role ? user.role.toUpperCase() : "USER";

  return (
    <Router>
      <div className="app-shell min-h-screen font-['Inter',sans-serif] flex flex-col">
        {/* Navbar handles its own UI based on userRole */}
        <Navbar
          user={user}
          handleLogout={handleLogout}
          darkMode={darkMode}
          onToggleTheme={() => setDarkMode((prev) => !prev)}
        />

        {/* Main Routing Content (flex-grow pushes footer to bottom) */}
        <div className="flex-grow">
          <Routes>
            {/* 👉 Smart Routing for Home Page */}
            <Route
              path="/"
              element={
                userRole === "ADMIN" ? (
                  <Navigate to="/admin" replace />
                ) : userRole === "SECURITY" ? (
                  <Navigate to="/security" replace />
                ) : (
                  <UserPortal />
                )
              }
            />

            <Route path="/login" element={<Login />} />

            {/* 👉 Prevent Staff from accessing booking flows */}
            <Route
              path="/book/:matchId"
              element={
                userRole === "ADMIN" ? (
                  <Navigate to="/admin" replace />
                ) : userRole === "SECURITY" ? (
                  <Navigate to="/security" replace />
                ) : (
                  <BookingPage />
                )
              }
            />

            <Route
              path="/checkout/:matchId/:seatId"
              element={isLoggedIn ? <Checkout /> : <Navigate to="/login" />}
            />
            <Route
              path="/my-tickets"
              element={isLoggedIn ? <MyTickets /> : <Navigate to="/login" />}
            />

            {/* 👉 Protect Security and Admin specific routes */}
            <Route
              path="/security"
              element={
                userRole === "SECURITY" || userRole === "ADMIN" ? (
                  <SecurityScan />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/admin"
              element={
                userRole === "ADMIN" ? (
                  <AdminDashboard />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />

            {/* Catch-all fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>

        <Footer />
      </div>
    </Router>
  );
}

export default App;
