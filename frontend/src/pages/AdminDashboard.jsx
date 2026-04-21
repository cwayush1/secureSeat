import React, { useState } from "react";
import { backendAPI } from "../services/api";
import { getStadium, getAllStadiumEntries } from "../stadiums";

export default function AdminDashboard() {
  const availableStadiums = getAllStadiumEntries();

  const [matchData, setMatchData] = useState({
    team_a: "",
    team_b: "",
    stadium_id: "",
    date: "",
  });

  const [successMsg, setSuccessMsg] = useState(false);

  const handleAddMatch = async (e) => {
    e.preventDefault();
    try {
      const stadiumLayout = getStadium(matchData.stadium_id);
      let pricing_tiers = [];

      if (stadiumLayout?.stands) {
        pricing_tiers = stadiumLayout.stands.map((stand) => ({
          stand_id: stand.id,
          base_price: stand.base,
        }));
      }

      await backendAPI.post("/matches", {
        team_a: matchData.team_a,
        team_b: matchData.team_b,
        stadium_id: matchData.stadium_id,
        date: matchData.date,
        pricing_tiers,
      });

      setMatchData({ team_a: "", team_b: "", stadium_id: "", date: "" });
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 4000);
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Error adding match");
    }
  };

  const selectedStadium = matchData.stadium_id ? getStadium(matchData.stadium_id) : null;

  return (
    <div className="min-h-[85vh] bg-[#F8FAFC] font-['Inter',sans-serif] text-slate-900 pb-20 pt-8">

      {/* ── Header ── */}
      <header className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase mb-4 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
          Admin Control Panel
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-3">
          Admin <span className="text-blue-600">Dashboard</span>
        </h1>
        <p className="text-slate-500 text-sm md:text-base max-w-xl mx-auto font-medium">
          Create matches, configure stadium pricing, and manage event setup from one place.
        </p>
      </header>

      {/* ── Main Layout ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ── LEFT: Create Match Form ── */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-['JetBrains_Mono']">
                  01 // Create Match
                </h2>
              </div>

              <div className="p-8">
                <form onSubmit={handleAddMatch} className="flex flex-col gap-4">
                  {/* Teams Row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-['JetBrains_Mono']">
                        Team A
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. India"
                        value={matchData.team_a}
                        onChange={(e) => setMatchData({ ...matchData, team_a: e.target.value })}
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-['JetBrains_Mono']">
                        Team B
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Australia"
                        value={matchData.team_b}
                        onChange={(e) => setMatchData({ ...matchData, team_b: e.target.value })}
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  {/* Stadium */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-['JetBrains_Mono']">
                      Stadium
                    </label>
                    <select
                      value={matchData.stadium_id}
                      onChange={(e) => setMatchData({ ...matchData, stadium_id: e.target.value })}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer"
                    >
                      <option value="">Select Stadium</option>
                      {availableStadiums.map((s) => (
                        <option key={s.key} value={s.key}>
                          {s.name} — {s.city}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-['JetBrains_Mono']">
                      Match Date &amp; Time
                    </label>
                    <input
                      type="datetime-local"
                      value={matchData.date}
                      onChange={(e) => setMatchData({ ...matchData, date: e.target.value })}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Flash success message */}
                  {successMsg && (
                    <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-2xl animate-[fadeUp_0.3s_ease-out]">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-green-700 uppercase tracking-wider font-['JetBrains_Mono']">Match Created</p>
                        <p className="text-sm font-semibold text-green-800">Successfully added to the schedule.</p>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-blue-600 text-white font-semibold py-4 px-6 rounded-xl transition-colors duration-300 shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Create Match
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Stadium Pricing Preview ── */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-[2rem] shadow-md border border-slate-200 overflow-hidden h-full min-h-[520px] flex flex-col">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-['JetBrains_Mono']">
                  02 // Pricing Preview
                </h2>
                {selectedStadium && (
                  <span className="flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-md">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                    AUTO-CONFIGURED
                  </span>
                )}
              </div>

              <div className="p-6 md:p-8 flex-grow flex flex-col justify-center">

                {/* Empty state */}
                {!selectedStadium && (
                  <div className="flex flex-col items-center justify-center h-full text-center py-20">
                    <svg className="w-12 h-12 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">No Stadium Selected</h3>
                    <p className="text-slate-500 max-w-sm text-sm">
                      Select a stadium in Step 1 to preview stand pricing that will be auto-configured for the match.
                    </p>
                  </div>
                )}

                {/* Pricing grid */}
                {selectedStadium && (
                  <div className="animate-[fadeIn_0.4s_ease-out]">
                    <div className="flex items-center gap-3 mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl">
                      <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-green-700 uppercase tracking-wider font-['JetBrains_Mono']">Pricing auto-configured</p>
                        <p className="text-sm font-semibold text-green-800 mt-0.5">
                          {selectedStadium.name} — {selectedStadium.stands.length} stands detected
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedStadium.stands.map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 hover:border-blue-300 hover:bg-blue-50/40 transition-colors"
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider font-['JetBrains_Mono'] mb-0.5">{s.type}</p>
                            <p className="text-sm font-bold text-slate-800">{s.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-400 font-['JetBrains_Mono'] mb-0.5">BASE PRICE</p>
                            <p className="text-lg font-black text-blue-600">₹{s.base.toLocaleString("en-IN")}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </main>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}