import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";

// --- Premium Custom SVG Icons ---
const TicketLogo = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="text-blue-500"
  >
    <path
      d="M2 9V15C2 16.6569 3.34315 18 5 18H19C20.6569 18 22 16.6569 22 15V9C22 7.34315 20.6569 6 19 6H5C3.34315 6 2 7.34315 2 9Z"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7 6V18"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray="2 4"
    />
    <path
      d="M22 12C20.8954 12 20 11.1046 20 10V9"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M22 15V14C20.8954 14 20 13.1046 20 12"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2 12C3.10457 12 4 11.1046 4 10V9"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2 15V14C3.10457 14 4 13.1046 4 12"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const UserIcon = () => (
  <svg
    className="w-5 h-5 mr-3 text-slate-400 group-hover:text-blue-400 transition-colors"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);

const LogoutIcon = () => (
  <svg
    className="w-5 h-5 mr-3 text-red-400 group-hover:text-red-300 transition-colors"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
    />
  </svg>
);

export default function Navbar({
  user,
  handleLogout,
  darkMode,
  onToggleTheme,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef(null);
  const location = useLocation();

  const isLoggedIn = !!user;
  const userRole = user?.role ? user.role.toUpperCase() : "USER";

  // Handle glassmorphism scroll effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle click outside for dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isActive = (path) => location.pathname === path;

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 font-['Inter',sans-serif] ${
        scrolled ? "nav-header nav-header-scrolled" : "nav-header"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 md:h-24">
          {" "}
          {/* Taller navbar on desktop */}
          {/* Brand Logo */}
          <Link
            to="/"
            className="flex items-center gap-3 no-underline group mr-4"
          >
            <span className="text-blue-500 text-3xl">🎫</span>
            <span className="text-2xl md:text-3xl font-black text-white tracking-tight group-hover:text-blue-400 transition-colors">
              Secure<span className="text-blue-500">Seat</span>
            </span>
          </Link>
          {/* ── ROLE-BASED NAVIGATION LINKS ── */}
          <nav className="hidden md:flex items-center gap-2 lg:gap-4">
            {/* Admin View */}
            {userRole === "ADMIN" && (
              <Link
                to="/admin"
                className={`text-sm font-bold tracking-widest uppercase px-5 py-2.5 rounded-xl border transition-all duration-200 ${
                  isActive("/admin")
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-inner"
                    : "bg-slate-800/50 text-amber-500/80 border-slate-700/50 hover:bg-amber-500/10 hover:text-amber-400 hover:border-amber-500/30"
                }`}
              >
                Admin Dashboard
              </Link>
            )}

            {/* Security View */}
            {userRole === "SECURITY" && (
              <Link
                to="/security"
                className={`text-sm font-bold tracking-widest uppercase px-5 py-2.5 rounded-xl border transition-all duration-200 ${
                  isActive("/security")
                    ? "bg-red-500/20 text-red-300 border-red-500/50 shadow-inner"
                    : "bg-slate-800/50 text-red-500/80 border-slate-700/50 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
                }`}
              >
                Scanner Portal
              </Link>
            )}

            {/* Standard User / Guest View */}
            {userRole !== "ADMIN" && userRole !== "SECURITY" && (
              <>
                <Link
                  to="/"
                  className={`text-base font-medium px-5 py-2.5 rounded-xl transition-all duration-200 ${
                    isActive("/")
                      ? "text-white bg-slate-800 shadow-inner"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  Matches
                </Link>

                {isLoggedIn && (
                  <Link
                    to="/my-tickets"
                    className={`text-base font-medium px-5 py-2.5 rounded-xl transition-all duration-200 ${
                      isActive("/my-tickets")
                        ? "text-white bg-slate-800 shadow-inner"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    My Tickets
                  </Link>
                )}
              </>
            )}
          </nav>
          {/* ── ACTION AREA (RIGHT SIDE) ── */}
          <div className="flex items-center gap-4 ml-4">
            <button
              type="button"
              onClick={onToggleTheme}
              className="theme-toggle-button"
              aria-label="Toggle dark mode"
              title="Toggle dark mode"
            >
              {darkMode ? "☀️" : "🌙"}
            </button>

            {isLoggedIn ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-slate-800 border-2 border-slate-700 text-slate-200 text-lg font-bold flex justify-center items-center hover:bg-slate-700 hover:border-slate-500 hover:text-white transition-all focus:outline-none focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500 cursor-pointer shadow-sm"
                >
                  {user.email.charAt(0).toUpperCase()}
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                  <div className="absolute right-0 mt-4 w-72 bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden transform origin-top-right transition-all animate-[fadeIn_0.2s_ease-out]">
                    <div className="px-5 py-5 border-b border-slate-700 bg-slate-800/80">
                      <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-widest">
                        Signed in as
                      </p>
                      <p
                        className="text-base font-bold text-white truncate"
                        title={user.email}
                      >
                        {user.email}
                      </p>
                    </div>

                    <div className="p-3">
                      {/* Only show "Manage Tickets" in dropdown if they are a standard user */}
                      {userRole !== "ADMIN" && userRole !== "SECURITY" && (
                        <>
                          <Link
                            to="/my-tickets"
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center w-full text-left px-4 py-3.5 rounded-xl text-base font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors group"
                          >
                            <UserIcon />
                            Manage Tickets
                          </Link>
                          <div className="h-px bg-slate-700/50 my-2 mx-2"></div>
                        </>
                      )}

                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          handleLogout();
                        }}
                        className="flex items-center w-full text-left px-4 py-3.5 rounded-xl text-base font-medium text-slate-300 hover:bg-red-500/10 hover:text-red-400 transition-colors cursor-pointer group"
                      >
                        <LogoutIcon />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-blue-600 hover:bg-blue-500 text-white px-7 py-3 rounded-xl text-base font-bold transition-all duration-300 shadow-lg shadow-blue-900/40 hover:shadow-blue-900/60 transform hover:-translate-y-0.5"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
