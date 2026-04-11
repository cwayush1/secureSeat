import { useState, useEffect, useCallback } from 'react';
import StadiumMap from './StadiumMap';
import SeatGridModal from './SeatGridModal';
import { backendAPI } from '../services/api';

// ─── Dynamic Pricing ───────────────────────────────────────────────

function computeDynamicPrice(basePrice, {
  daysLeft = 30,
  occupancyRatio = 0,
  standType = 'GENERAL',
  totalSeats = 1000,
  availableSeats = 1000,
  recentBookings24h = 0,
} = {}) {
  let timeFactor;
  if (daysLeft > 30)       timeFactor = 0.9;
  else if (daysLeft > 14)  timeFactor = 1.0;
  else if (daysLeft > 7)   timeFactor = 1.1;
  else if (daysLeft > 3)   timeFactor = 1.25;
  else if (daysLeft > 1)   timeFactor = 1.45;
  else                     timeFactor = 1.6;

  let scarcityFactor;
  if (occupancyRatio < 0.3)       scarcityFactor = 1.0;
  else if (occupancyRatio < 0.5)  scarcityFactor = 1.05;
  else if (occupancyRatio < 0.7)  scarcityFactor = 1.15;
  else if (occupancyRatio < 0.85) scarcityFactor = 1.3;
  else if (occupancyRatio < 0.95) scarcityFactor = 1.5;
  else                            scarcityFactor = 1.75;

  const tierMap = { VIP: 1.15, PREMIUM: 1.08, COVERED: 1.03, GENERAL: 1.0, OPEN: 0.95 };
  const tierFactor = tierMap[standType?.toUpperCase()] ?? 1.0;

  let crazeFactor = 1.0;
  if (availableSeats < 50)       crazeFactor = 1.2;
  else if (availableSeats < 150) crazeFactor = 1.1;
  else if (availableSeats < 300) crazeFactor = 1.05;

  let heat24hFactor = 1.0;
  if (recentBookings24h > 200)      heat24hFactor = 1.15;
  else if (recentBookings24h > 100) heat24hFactor = 1.08;
  else if (recentBookings24h > 50)  heat24hFactor = 1.04;

  const rawMultiplier = timeFactor * scarcityFactor * tierFactor * crazeFactor * heat24hFactor;
  const multiplier = Math.round(Math.min(2.5, Math.max(0.85, rawMultiplier)) * 100) / 100;

  return {
    price: Math.round(basePrice * multiplier),
    basePrice,
    multiplier
  };
}

// Kept colors for demand states, but shifted the normal/low to fit the blue theme
function getDemandLevel(multiplier) {
  if (multiplier >= 1.8)  return { label: 'SURGE',    emoji: '🔥', color: '#dc2626' }; // Red
  if (multiplier >= 1.4)  return { label: 'HIGH',     emoji: '📈', color: '#ea580c' }; // Orange
  if (multiplier >= 1.1)  return { label: 'MODERATE', emoji: '⚡', color: '#ca8a04' }; // Yellow
  if (multiplier >= 0.95) return { label: 'NORMAL',   emoji: '✅', color: '#16a34a' }; // Green
  return                         { label: 'LOW',      emoji: '💤', color: '#2563eb' }; // Blue
}

// ─────────────────────────────────────────────────────────────────────────────

export default function StadiumViewer({ stadiumData, matchLabel, matchId, matchDate, darkMode }) {
  const [selectedStand, setSelectedStand] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [dynamicPriceData, setDynamicPriceData] = useState(null);
  const [priceLoading, setPriceLoading] = useState(false);

  const inr = n => '₹' + Number(n).toLocaleString('en-IN');

  const computeDaysLeft = useCallback(() => {
    if (!matchDate) return 30;
    const now = new Date();
    const match = new Date(matchDate);
    return Math.max(0, Math.ceil((match - now) / (1000 * 60 * 60 * 24)));
  }, [matchDate]);

  useEffect(() => {
    if (!selectedStand || !matchId) { setDynamicPriceData(null); return; }

    const fetchAndComputePrice = async () => {
      setPriceLoading(true);
      try {
        const res = await backendAPI.get(`/matches/${matchId}/stands/${selectedStand.id}/blocks`);
        const blocks = res.data;

        let totalSeats = 0, availableSeats = 0;
        blocks.forEach(b => { totalSeats += b.total_seats || 0; availableSeats += b.available_seats || 0; });

        const bookedSeats = totalSeats - availableSeats;
        const occupancyRatio = totalSeats > 0 ? bookedSeats / totalSeats : 0;
        const daysLeft = computeDaysLeft();

        const result = computeDynamicPrice(selectedStand.base, {
          daysLeft, occupancyRatio, standType: selectedStand.type,
          totalSeats, availableSeats, recentBookings24h: 0,
        });

        setDynamicPriceData({
          ...result,
          availableSeats
        });
      } catch (err) {
        console.error('Failed to compute dynamic price', err);
        setDynamicPriceData({
          price: selectedStand.base, basePrice: selectedStand.base, multiplier: 1.0,
          availableSeats: selectedStand.cap
        });
      } finally {
        setPriceLoading(false);
      }
    };

    fetchAndComputePrice();
  }, [selectedStand, matchId, computeDaysLeft]);

  // ─── NEW WHITE/BLUE THEME ───
  const theme = {
    panelBg:      darkMode ? '#0f172a' : '#ffffff',
    panelBorder:  darkMode ? '1px solid #1e293b' : '1px solid #e2e8f0',
    panelShadow:  darkMode ? '0 10px 30px rgba(0,0,0,0.4)' : '0 10px 30px rgba(37, 99, 235, 0.08)',
    textPrimary:  darkMode ? '#f8fafc' : '#0f172a',
    textSecondary: darkMode ? '#94a3b8' : '#64748b',
    cardBg:       darkMode ? '#1e293b' : '#f8fafc',
    cardBorder:   darkMode ? '1px solid #334155' : '1px solid #e2e8f0',
    priceBg:      darkMode ? '#1e3a8a' : '#eff6ff',
    priceBorder:  darkMode ? '1px solid #1e40af' : '1px solid #bfdbfe',
    primaryBlue:  '#2563eb', // Clean modern blue
    divider:      darkMode
      ? 'linear-gradient(90deg, #3b82f6 0%, #0f172a 100%)'
      : 'linear-gradient(90deg, #2563eb 0%, #ffffff 100%)',
  };

  const demand = dynamicPriceData ? getDemandLevel(dynamicPriceData.multiplier) : null;

  return (
    <div className="stadium-viewer-layout" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', marginTop: '20px' }}>
      <style>{`
        @media (min-width: 950px) {
          .stadium-viewer-layout { grid-template-columns: 1fr 380px !important; }
        }
      `}</style>

      {/* MAP */}
      <div className="map-section" style={{ position: 'relative' }}>
        <StadiumMap
          stadiumData={stadiumData}
          selectedId={selectedStand?.id || null}
          hoveredId={hoveredId}
          onHover={setHoveredId}
          onSelect={setSelectedStand}
          darkMode={darkMode}
        />
      </div>

      {/* INFO PANEL */}
      <div className="info-panel" style={{
        background: theme.panelBg, padding: '28px', borderRadius: '16px',
        border: theme.panelBorder, boxShadow: theme.panelShadow, transition: 'all 0.3s ease',
      }}>
        {!selectedStand ? (
          <div style={{ textAlign: 'center', color: theme.textSecondary, paddingTop: '60px' }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>🏟</div>
            <p style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', letterSpacing: '1px' }}>
              SELECT A SECTOR TO VIEW DETAILS
            </p>
          </div>
        ) : (
          <div>
            <h2 style={{ fontFamily: 'Bebas Neue', fontSize: '38px', margin: 0, color: theme.textPrimary, letterSpacing: '1px' }}>
              {selectedStand.name}
            </h2>
            <p style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: theme.primaryBlue, textTransform: 'uppercase', fontWeight: '800', letterSpacing: '2px', marginTop: '4px' }}>
              {selectedStand.type}
            </p>

            <div style={{ height: '1px', background: theme.divider, margin: '24px 0' }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ background: theme.cardBg, padding: '16px', borderRadius: '12px', border: theme.cardBorder }}>
                <small style={{ fontSize: '9px', color: theme.textSecondary, fontFamily: 'JetBrains Mono' }}>REMAINING SEATS</small>
                <div style={{ fontFamily: 'Bebas Neue', fontSize: '28px', color: theme.textPrimary }}>
                  {dynamicPriceData ? dynamicPriceData.availableSeats.toLocaleString() : selectedStand.cap.toLocaleString()}
                </div>
              </div>

              <div style={{ background: theme.priceBg, padding: '16px', borderRadius: '12px', border: theme.priceBorder, position: 'relative', overflow: 'hidden' }}>
                {priceLoading ? (
                  <>
                    <small style={{ fontSize: '9px', color: theme.primaryBlue, fontFamily: 'JetBrains Mono' }}>COMPUTING...</small>
                    <div style={{ fontFamily: 'Bebas Neue', fontSize: '22px', color: '#94a3b8' }}>---</div>
                  </>
                ) : (
                  <>
                    <small style={{ fontSize: '9px', color: theme.primaryBlue, fontFamily: 'JetBrains Mono' }}>CURRENT PRICE</small>
                    <div style={{ fontFamily: 'Bebas Neue', fontSize: '28px', color: theme.primaryBlue }}>
                      {inr(dynamicPriceData?.price ?? selectedStand.base)}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Simplified Demand Badge (No breakdown) */}
            {dynamicPriceData && !priceLoading && (
              <div style={{
                marginTop: '16px', borderRadius: '12px', padding: '14px 16px',
                background: darkMode ? '#1e293b' : '#f8fafc',
                border: theme.cardBorder,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  background: demand?.color + '18', border: `1px solid ${demand?.color}40`,
                  padding: '4px 10px', borderRadius: '20px',
                }}>
                  <span style={{ fontSize: '12px' }}>{demand?.emoji}</span>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: '9px', fontWeight: '700', color: demand?.color, letterSpacing: '1px' }}>
                    {demand?.label} DEMAND
                  </span>
                </div>
                <div style={{ fontFamily: 'Bebas Neue', fontSize: '22px', color: theme.textPrimary }}>
                  {dynamicPriceData.multiplier}x
                </div>
              </div>
            )}

            <button style={{
              width: '100%', marginTop: '24px', padding: '18px',
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', // Crisp blue gradient
              color: '#fff', border: 'none', borderRadius: '12px',
              fontFamily: 'Bebas Neue', fontSize: '22px', letterSpacing: '3px',
              cursor: 'pointer', boxShadow: '0 8px 20px rgba(37, 99, 235, 0.25)', transition: 'transform 0.2s',
            }}
              onClick={() => setShowModal(true)}
              onMouseEnter={e => e.target.style.transform = 'scale(1.02)'}
              onMouseLeave={e => e.target.style.transform = 'scale(1)'}
            >
              BOOK SEATS NOW
            </button>
          </div>
        )}
      </div>

      {showModal && selectedStand && (
        <SeatGridModal matchId={matchId} standData={selectedStand} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}