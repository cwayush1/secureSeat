import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getStadium } from "../stadiums";
import "../index.css";

import { backendAPI } from "../services/api";

if (!document.getElementById("premium-font")) {
  const l = document.createElement("link");
  l.id = "premium-font";
  l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap";
  document.head.appendChild(l);
}

const CalendarIcon = () => (
  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const LocationIcon = () => (
  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.242-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const TicketIcon = () => (
  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
  </svg>
);

export default function UserPortal() {
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=2805&auto=format&fit=crop";

  useEffect(() => {
    const loadMatches = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await backendAPI.get('/matches');
        const apiData = response.data;
        setMatches(apiData);
        if (apiData && apiData.length > 0) {
          setSelectedMatch(apiData[0]);
        }
      } catch (err) {
        console.error("Failed to fetch matches:", err);
        setError("Unable to load matches at this time. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    loadMatches();
  }, []);

  const handleBookNow = () => {
    if (selectedMatch) {
      navigate(`/book/${selectedMatch.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-['Inter',sans-serif] text-slate-900 pb-20">

      <style>{`
        .slider-container::-webkit-scrollbar { display: none; }
        .slider-container { -ms-overflow-style: none; scrollbar-width: none; }

        /* Kill ALL browser focus outlines site-wide for this portal */
        .portal-root *:focus,
        .portal-root *:focus-visible {
          outline: none !important;
          box-shadow: none !important;
        }

        /* Hero card image zoom */
        .hero-img {
          transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .hero-card:hover .hero-img {
          transform: scale(1.03);
        }

        /* Match card hover */
        .match-card {
          transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
        }
        .match-card:hover:not(.match-card--selected) {
          transform: translateY(-4px);
          box-shadow: 0 12px 28px -6px rgba(15, 23, 42, 0.10);
          border-color: #cbd5e1;
        }
        .match-card--selected {
          border: 2px solid #2563eb;
          box-shadow: 0 8px 24px -4px rgba(37, 99, 235, 0.15);
        }
        .match-card--selected:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px -4px rgba(37, 99, 235, 0.20);
        }

        /* Thumbnail zoom inside card */
        .match-thumb {
          transition: transform 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .match-card:hover .match-thumb {
          transform: scale(1.06);
        }

        /* Book Now button */
        .book-btn {
          transition: background-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
        }
        .book-btn:hover {
          background-color: #1d4ed8;
          transform: translateY(-2px);
          box-shadow: 0 10px 24px -4px rgba(37, 99, 235, 0.40);
        }
        .book-btn:active {
          transform: translateY(0px);
          box-shadow: 0 4px 10px -2px rgba(37, 99, 235, 0.30);
        }
      `}</style>

      {/* ── Header ── */}
      <header className="pt-16 pb-12 px-6 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
          Live Ticketing
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
          Select Your <span className="text-blue-600">Match</span>
        </h1>
        <p className="text-slate-500 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
          Discover upcoming fixtures and secure your perfect seat in the stadium.
        </p>
      </header>

      <main className="portal-root max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* Status States */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4" />
            <p className="text-slate-500 text-sm font-medium">Loading matches...</p>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-6 py-4 rounded-xl text-sm font-medium text-center max-w-lg mx-auto">
            {error}
          </div>
        )}
        {!isLoading && !error && matches.length === 0 && (
          <div className="text-center py-12 text-slate-500 text-sm">No upcoming matches found.</div>
        )}

        {/* ── 1. HERO CARD ── */}
        {selectedMatch && (
          <section className="mb-16">
            <div className="hero-card bg-white rounded-[2rem] border border-slate-200 overflow-hidden flex flex-col md:flex-row cursor-default"
              style={{ boxShadow: "0 1px 3px rgba(15,23,42,0.06), 0 4px 12px rgba(15,23,42,0.04)" }}
            >
              {/* Image */}
              <div className="md:w-[55%] h-64 md:h-auto relative bg-slate-100 overflow-hidden">
                <img
                  src={selectedMatch.image_url || DEFAULT_IMAGE}
                  alt={`${selectedMatch.team_a} vs ${selectedMatch.team_b}`}
                  className="hero-img w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
              </div>

              {/* Content */}
              <div className="md:w-[45%] p-8 md:p-12 flex flex-col justify-center">
                <div className="mb-4">
                  <span className="inline-block bg-slate-100 text-slate-600 text-[11px] font-bold tracking-wider px-2.5 py-1 rounded-md uppercase">
                    Featured Event
                  </span>
                </div>

                <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
                  {selectedMatch.team_a}{" "}
                  <span className="text-slate-400 font-medium text-2xl mx-1">vs</span>{" "}
                  {selectedMatch.team_b}
                </h2>

                <p className="text-slate-500 text-sm md:text-base leading-relaxed mb-8 line-clamp-3">
                  {selectedMatch.description || "Experience the thrill of live cricket. Book your seats now for an unforgettable match-day experience."}
                </p>

                <div className="space-y-3 border-t border-slate-100 pt-6 mb-8">
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-700">
                    <CalendarIcon />
                    {new Date(selectedMatch.date).toLocaleDateString("en-IN", {
                      weekday: "short", day: "2-digit", month: "short",
                      year: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                  </div>
                  {getStadium(selectedMatch.stadium_id) && (
                    <div className="flex items-center gap-3 text-sm font-medium text-slate-700">
                      <LocationIcon />
                      {getStadium(selectedMatch.stadium_id).name},{" "}
                      {getStadium(selectedMatch.stadium_id).city}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleBookNow}
                  className="book-btn mt-auto flex items-center justify-center w-full md:w-auto bg-blue-600 text-white font-semibold py-4 px-8 rounded-xl"
                  style={{ boxShadow: "0 6px 18px -4px rgba(37,99,235,0.35)" }}
                >
                  <TicketIcon />
                  Book Tickets Now
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ── 2. UPCOMING MATCHES (SLIDER) ── */}
        {matches.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">Upcoming Fixtures</h3>
            </div>

            <div className="slider-container flex overflow-x-auto gap-5 pb-6 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x">
              {matches.map((match) => {
                const isSelected = selectedMatch?.id === match.id;
                const stadium = getStadium(match.stadium_id);

                return (
                  <div
                    key={match.id}
                    onClick={() => setSelectedMatch(match)}
                    className={`match-card group flex-none w-[280px] snap-start rounded-2xl cursor-pointer overflow-hidden flex flex-col bg-white
                      ${isSelected ? "match-card--selected" : "border border-slate-200"}`}
                  >
                    <div className="h-40 w-full overflow-hidden relative bg-slate-100">
                      <img
                        src={match.image_url || DEFAULT_IMAGE}
                        className="match-thumb w-full h-full object-cover"
                        alt="Thumbnail"
                      />
                      {isSelected && (
                        <div className="absolute top-3 right-3 bg-white text-blue-600 text-[10px] font-bold px-2 py-1 rounded-md shadow-sm uppercase tracking-wide">
                          Selected
                        </div>
                      )}
                    </div>

                    <div className="p-5 flex-grow flex flex-col">
                      <h4 className="text-lg font-bold text-slate-900 mb-1 leading-tight">
                        {match.team_a}{" "}
                        <span className="text-slate-400 font-normal text-sm">vs</span>{" "}
                        {match.team_b}
                      </h4>

                      <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                        {match.description || "Join the excitement and cheer for your favorite team."}
                      </p>

                      <div className="mt-auto space-y-2 pt-4 border-t border-slate-50">
                        <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                          <CalendarIcon />
                          {new Date(match.date).toLocaleDateString("en-IN", {
                            day: "2-digit", month: "short",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </div>
                        {stadium && (
                          <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                            <LocationIcon />
                            <span className="truncate">{stadium.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}