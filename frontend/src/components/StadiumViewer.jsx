// import React, { useState, useEffect, useCallback, useRef } from 'react';
// import StadiumMap from './StadiumMap';
// import SeatGridModal from './SeatGridModal';
// import Stadium3DViewer from './Stadium3DViewer';
// import { backendAPI } from '../services/api';

// // ─── Dynamic Pricing ──────────────────────────────────────────────────────────
// function computeDynamicPrice(basePrice, {
//   daysLeft = 30, occupancyRatio = 0, standType = 'GENERAL',
//   totalSeats = 1000, availableSeats = 1000, recentBookings24h = 0,
// } = {}) {
//   let timeFactor =
//     daysLeft > 30 ? 0.9 : daysLeft > 14 ? 1.0 : daysLeft > 7 ? 1.1 :
//     daysLeft > 3  ? 1.25 : daysLeft > 1  ? 1.45 : 1.6;

//   let scarcityFactor =
//     occupancyRatio < 0.3  ? 1.0  : occupancyRatio < 0.5  ? 1.05 :
//     occupancyRatio < 0.7  ? 1.15 : occupancyRatio < 0.85 ? 1.3  :
//     occupancyRatio < 0.95 ? 1.5  : 1.75;

//   const tierMap = { VIP: 1.15, PREMIUM: 1.08, COVERED: 1.03, GENERAL: 1.0, OPEN: 0.95 };
//   const tierFactor = tierMap[standType?.toUpperCase()] ?? 1.0;

//   const crazeFactor =
//     availableSeats < 50  ? 1.2 : availableSeats < 150 ? 1.1 :
//     availableSeats < 300 ? 1.05 : 1.0;

//   const heat24hFactor =
//     recentBookings24h > 200 ? 1.15 : recentBookings24h > 100 ? 1.08 :
//     recentBookings24h > 50  ? 1.04 : 1.0;

//   const raw = timeFactor * scarcityFactor * tierFactor * crazeFactor * heat24hFactor;
//   const multiplier = Math.round(Math.min(2.5, Math.max(0.85, raw)) * 100) / 100;
//   return { price: Math.round(basePrice * multiplier), basePrice, multiplier };
// }

// function getDemandLevel(multiplier) {
//   if (multiplier >= 1.8)  return { label: 'SURGE',    emoji: '🔥', color: '#dc2626' };
//   if (multiplier >= 1.4)  return { label: 'HIGH',     emoji: '📈', color: '#ea580c' };
//   if (multiplier >= 1.1)  return { label: 'MODERATE', emoji: '⚡', color: '#ca8a04' };
//   if (multiplier >= 0.95) return { label: 'NORMAL',   emoji: '✅', color: '#16a34a' };
//   return                         { label: 'LOW',      emoji: '💤', color: '#2563eb' };
// }

// const inr = n => '₹' + Number(n).toLocaleString('en-IN');

// // ─────────────────────────────────────────────────────────────────────────────

// export default function StadiumViewer({
//   stadiumData,
//   matchLabel,
//   matchId,
//   matchDate,
//   darkMode,
//   stadiumImage,
// }) {
//   const [enrichedStands,   setEnrichedStands]   = useState(stadiumData?.stands ?? []);
//   const [standsLoading,    setStandsLoading]    = useState(false);
//   const [selectedStand,    setSelectedStand]    = useState(null);
//   const [hoveredId,        setHoveredId]        = useState(null);
//   const [showModal,        setShowModal]        = useState(false);
//   const [dynamicPriceData, setDynamicPriceData] = useState(null);
//   const [priceLoading,     setPriceLoading]     = useState(false);
//   const [imgLoaded,        setImgLoaded]        = useState(false);
//   const [viewMode,         setViewMode]         = useState('2D'); // '2D' or '3D'

//   const imgRef = useRef(null);

//   // ── Fetch stands + merge stand_image ──────────────────────────────────────
//   useEffect(() => {
//     if (!matchId) return;
//     setStandsLoading(true);

//     backendAPI
//       .get(`/matches/${matchId}/stands`)
//       .then(res => {
//         const dbMap = {};
//         res.data.forEach(s => { dbMap[s.stand_id ?? s.id] = s; });

//         const merged = (stadiumData?.stands ?? []).map(staticStand => {
//           const db = dbMap[staticStand.id] ?? {};
//           return {
//             ...staticStand,
//             stand_image: db.stand_image ?? staticStand.stand_image ?? null,
//             cap:         db.capacity   ?? staticStand.cap,
//             base:        db.base_price ?? staticStand.base,
//           };
//         });
//         setEnrichedStands(merged);
//       })
//       .catch(err => {
//         console.warn('Could not fetch stands from DB:', err.message);
//         setEnrichedStands(stadiumData?.stands ?? []);
//       })
//       .finally(() => setStandsLoading(false));
//   }, [matchId, stadiumData]);

//   // Keep selectedStand fresh after enrichedStands updates
//   useEffect(() => {
//     if (!selectedStand) return;
//     const updated = enrichedStands.find(s => s.id === selectedStand.id);
//     if (updated) setSelectedStand(updated);
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [enrichedStands]);

//   // ── Active image ───────────────────────────────────────────────────────────
//   const activeImage = selectedStand?.stand_image || stadiumImage || null;

//   useEffect(() => { 
//     setImgLoaded(false); 
//     if (imgRef.current && imgRef.current.complete) {
//       setImgLoaded(true);
//     }
//   }, [activeImage]);

//   // ── Dynamic pricing ────────────────────────────────────────────────────────
//   const computeDaysLeft = useCallback(() => {
//     if (!matchDate) return 30;
//     return Math.max(0, Math.ceil((new Date(matchDate) - new Date()) / 86400000));
//   }, [matchDate]);

//   useEffect(() => {
//     if (!selectedStand || !matchId) { setDynamicPriceData(null); return; }
//     setPriceLoading(true);
//     backendAPI
//       .get(`/matches/${matchId}/stands/${selectedStand.id}/blocks`)
//       .then(res => {
//         let totalSeats = 0, availableSeats = 0;
//         res.data.forEach(b => {
//           totalSeats     += b.total_seats     || 0;
//           availableSeats += b.available_seats || 0;
//         });
//         const occupancyRatio = totalSeats > 0 ? (totalSeats - availableSeats) / totalSeats : 0;
//         const result = computeDynamicPrice(selectedStand.base, {
//           daysLeft: computeDaysLeft(), occupancyRatio,
//           standType: selectedStand.type, totalSeats, availableSeats,
//         });
//         setDynamicPriceData({ ...result, availableSeats });
//       })
//       .catch(() => {
//         setDynamicPriceData({
//           price: selectedStand.base, basePrice: selectedStand.base,
//           multiplier: 1.0, availableSeats: selectedStand.cap,
//         });
//       })
//       .finally(() => setPriceLoading(false));
//   }, [selectedStand, matchId, computeDaysLeft]);

//   // ── Theme ──────────────────────────────────────────────────────────────────
//   const t = {
//     panelBg:       darkMode ? '#0f172a' : '#ffffff',
//     panelBorder:   darkMode ? '1px solid #1e293b' : '1px solid #e2e8f0',
//     panelShadow:   darkMode ? '0 10px 30px rgba(0,0,0,0.4)' : '0 10px 30px rgba(37,99,235,0.08)',
//     textPrimary:   darkMode ? '#f8fafc' : '#0f172a',
//     textSecondary: darkMode ? '#94a3b8' : '#64748b',
//     cardBg:        darkMode ? '#1e293b' : '#f8fafc',
//     cardBorder:    darkMode ? '1px solid #334155' : '1px solid #e2e8f0',
//     priceBg:       darkMode ? '#1e3a8a' : '#eff6ff',
//     priceBorder:   darkMode ? '1px solid #1e40af' : '1px solid #bfdbfe',
//     primaryBlue:   '#2563eb',
//     divider:       darkMode
//       ? 'linear-gradient(90deg,#3b82f6 0%,#0f172a 100%)'
//       : 'linear-gradient(90deg,#2563eb 0%,#ffffff 100%)',
//   };

//   const demand              = dynamicPriceData ? getDemandLevel(dynamicPriceData.multiplier) : null;
//   const enrichedStadiumData = enrichedStands.length
//     ? { ...stadiumData, stands: enrichedStands }
//     : stadiumData;

//   const getCameraCoords = (stand) => {
//     if (!stand) return { x: 0, y: 150, z: 200 }; // Default bird's-eye viewer

//     const sa = (stand.start - 90) * Math.PI / 180;
//     const ea = (stand.end - 90) * Math.PI / 180;
//     let angleRad = (sa + ea) / 2;

//     const dist = 120;
//     return {
//       x: Math.cos(angleRad) * dist,
//       y: 40,
//       z: Math.sin(angleRad) * dist
//     };
//   };

//   return (
//     <>
//       <style>{`
//         @keyframes fadeInUp {
//           from { opacity:0; transform:translateY(12px); }
//           to   { opacity:1; transform:translateY(0); }
//         }
//         @keyframes shimmer {
//           0%   { background-position:-400px 0; }
//           100% { background-position: 400px 0; }
//         }
//         .stand-img-fade { animation: fadeInUp 0.4s ease forwards; }
//         .img-skeleton {
//           background: linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%);
//           background-size: 400px 100%;
//           animation: shimmer 1.4s infinite;
//         }

//         /* ── Responsive right-panel width ── */
//         /* mobile: single column */
//         .sv-grid { display: grid; grid-template-columns: 1fr; gap: 24px; margin-top: 20px; }

//         /* medium screens: canvas + 460px panel */
//         @media (min-width: 950px) {
//           .sv-grid { grid-template-columns: 1fr 460px; }
//         }

//         /* large laptop / desktop: canvas + 540px panel */
//         @media (min-width: 1300px) {
//           .sv-grid { grid-template-columns: 1fr 540px; }
//         }

//         /* wide monitors: canvas + 620px panel */
//         @media (min-width: 1500px) {
//           .sv-grid { grid-template-columns: 1fr 620px; }
//         }
//       `}</style>

//       <div className="sv-grid">

//         {/* ── LEFT: Canvas map (fills remaining space naturally) ── */}
//         <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '15px' }}>

//           {/* Toggle Controls */}
//           <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', background: t.panelBg, padding: '8px', borderRadius: '12px', border: t.panelBorder, width: 'max-content', margin: '0 auto', boxShadow: t.panelShadow }}>
//             <button 
//                onClick={() => setViewMode('2D')}
//                style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: viewMode === '2D' ? t.primaryBlue : 'transparent', color: viewMode === '2D' ? '#fff' : t.textSecondary, fontFamily: 'Bebas Neue', pointerEvents: 'auto', cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '1px' }}
//             >2D MAP</button>
//             <button 
//                onClick={() => setViewMode('3D')}
//                style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: viewMode === '3D' ? t.primaryBlue : 'transparent', color: viewMode === '3D' ? '#fff' : t.textSecondary, fontFamily: 'Bebas Neue', pointerEvents: 'auto', cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '1px' }}
//             >3D VIEW</button>
//           </div>

//           {viewMode === '2D' ? (
//             <StadiumMap
//               stadiumData={enrichedStadiumData}
//               selectedId={selectedStand?.id ?? null}
//               hoveredId={hoveredId}
//               onHover={setHoveredId}
//               onSelect={stand => {
//                 const enriched = enrichedStands.find(s => s.id === stand.id) ?? stand;
//                 setSelectedStand(enriched);
//               }}
//               darkMode={darkMode}
//             />
//           ) : (
//             <div style={{ width: '100%', aspectRatio: '1/1', position: 'relative' }}>
//               <React.Suspense fallback={<div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textSecondary, fontFamily: 'JetBrains Mono' }}>Loading 3D Engine...</div>}>
//                 <Stadium3DViewer activeBlockCoords={getCameraCoords(selectedStand)} />
//               </React.Suspense>
//             </div>
//           )}
//         </div>

//         {/* ── RIGHT: Image card + info panel ── */}
//         <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>

//           {/* IMAGE CARD */}
//           <div style={{
//             borderRadius:'20px', overflow:'hidden',
//             border: t.panelBorder, boxShadow: t.panelShadow,
//             background: darkMode ? '#0f172a' : '#f8fafc',
//             position:'relative', aspectRatio:'16/9', minHeight:'200px',
//           }}>
//             {!imgLoaded && (
//               <div className="img-skeleton" style={{ position:'absolute', inset:0, zIndex:1 }} />
//             )}

//             {activeImage ? (
//               <img
//                 ref={imgRef}
//                 key={activeImage}
//                 src={activeImage}
//                 alt={selectedStand?.name ?? stadiumData?.name}
//                 onLoad={() => setImgLoaded(true)}
//                 onError={() => setImgLoaded(true)}
//                 className="stand-img-fade"
//                 style={{
//                   width:'100%', height:'100%', objectFit:'cover', display:'block',
//                   opacity: imgLoaded ? 1 : 0, transition:'opacity 0.35s ease',
//                 }}
//               />
//             ) : (
//               <div style={{
//                 position:'absolute', inset:0, display:'flex',
//                 flexDirection:'column', alignItems:'center', justifyContent:'center',
//                 color: t.textSecondary, gap:'8px',
//               }}>
//                 <span style={{ fontSize:'40px' }}>🏟️</span>
//                 <span style={{ fontFamily:'JetBrains Mono', fontSize:'10px',
//                                letterSpacing:'1px', textTransform:'uppercase' }}>
//                   {standsLoading ? 'Loading…' : 'No image available'}
//                 </span>
//               </div>
//             )}

//             {/* Bottom label */}
//             <div style={{
//               position:'absolute', bottom:0, left:0, right:0,
//               background:'linear-gradient(to top,rgba(0,0,0,0.65) 0%,transparent 100%)',
//               padding:'20px 16px 12px', zIndex:2,
//             }}>
//               <p style={{
//                 margin:0, fontFamily:'JetBrains Mono', fontSize:'10px',
//                 fontWeight:'700', letterSpacing:'2px', textTransform:'uppercase',
//                 color:'rgba(255,255,255,0.9)',
//               }}>
//                 {selectedStand
//                   ? `📍 ${selectedStand.name}`
//                   : `🏟️ ${stadiumData?.name ?? 'Stadium View'}`}
//               </p>
//             </div>

//             {/* "Choose a stand" badge */}
//             {!selectedStand && (
//               <div style={{
//                 position:'absolute', top:'12px', left:'12px', zIndex:3,
//                 background:'rgba(37,99,235,0.92)', backdropFilter:'blur(8px)',
//                 borderRadius:'8px', padding:'6px 12px',
//                 display:'flex', alignItems:'center', gap:'6px',
//               }}>
//                 <span style={{ fontSize:'11px' }}>👆</span>
//                 <span style={{
//                   fontFamily:'JetBrains Mono', fontSize:'9px', fontWeight:'700',
//                   letterSpacing:'1.5px', color:'#fff', textTransform:'uppercase',
//                 }}>Choose a Stand</span>
//               </div>
//             )}
//           </div>

//           {/* INFO PANEL */}
//           <div style={{
//             background: t.panelBg, padding:'24px', borderRadius:'16px',
//             border: t.panelBorder, boxShadow: t.panelShadow,
//             transition:'all 0.3s ease', flex:1,
//           }}>
//             {!selectedStand ? (
//               <div style={{ textAlign:'center', color: t.textSecondary, padding:'24px 0' }}>
//                 <p style={{ fontFamily:'JetBrains Mono', fontSize:'11px', letterSpacing:'1px', margin:0 }}>
//                   SELECT A SECTOR TO VIEW DETAILS
//                 </p>
//               </div>
//             ) : (
//               <div style={{ animation:'fadeInUp 0.35s ease forwards' }}>
//                 <h2 style={{ fontFamily:'Bebas Neue', fontSize:'34px', margin:0,
//                              color: t.textPrimary, letterSpacing:'1px' }}>
//                   {selectedStand.name}
//                 </h2>
//                 <p style={{ fontFamily:'JetBrains Mono', fontSize:'10px', color: t.primaryBlue,
//                             textTransform:'uppercase', fontWeight:'800',
//                             letterSpacing:'2px', marginTop:'4px' }}>
//                   {selectedStand.type}
//                 </p>

//                 <div style={{ height:'1px', background: t.divider, margin:'20px 0' }} />

//                 {/* Stats */}
//                 <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
//                   <div style={{ background: t.cardBg, padding:'16px', borderRadius:'12px', border: t.cardBorder }}>
//                     <small style={{ fontSize:'9px', color: t.textSecondary, fontFamily:'JetBrains Mono' }}>
//                       REMAINING SEATS
//                     </small>
//                     <div style={{ fontFamily:'Bebas Neue', fontSize:'28px', color: t.textPrimary }}>
//                       {dynamicPriceData
//                         ? dynamicPriceData.availableSeats.toLocaleString()
//                         : selectedStand.cap.toLocaleString()}
//                     </div>
//                   </div>

//                   <div style={{ background: t.priceBg, padding:'16px', borderRadius:'12px', border: t.priceBorder }}>
//                     {priceLoading ? (
//                       <>
//                         <small style={{ fontSize:'9px', color: t.primaryBlue, fontFamily:'JetBrains Mono' }}>COMPUTING...</small>
//                         <div style={{ fontFamily:'Bebas Neue', fontSize:'22px', color:'#94a3b8' }}>---</div>
//                       </>
//                     ) : (
//                       <>
//                         <small style={{ fontSize:'9px', color: t.primaryBlue, fontFamily:'JetBrains Mono' }}>CURRENT PRICE</small>
//                         <div style={{ fontFamily:'Bebas Neue', fontSize:'28px', color: t.primaryBlue }}>
//                           {inr(dynamicPriceData?.price ?? selectedStand.base)}
//                         </div>
//                       </>
//                     )}
//                   </div>
//                 </div>

//                 {/* Demand badge */}
//                 {dynamicPriceData && !priceLoading && (
//                   <div style={{
//                     marginTop:'14px', borderRadius:'12px', padding:'12px 16px',
//                     background: darkMode ? '#1e293b' : '#f8fafc', border: t.cardBorder,
//                     display:'flex', justifyContent:'space-between', alignItems:'center',
//                   }}>
//                     <div style={{
//                       display:'inline-flex', alignItems:'center', gap:'6px',
//                       background: demand?.color + '18', border:`1px solid ${demand?.color}40`,
//                       padding:'4px 10px', borderRadius:'20px',
//                     }}>
//                       <span style={{ fontSize:'12px' }}>{demand?.emoji}</span>
//                       <span style={{ fontFamily:'JetBrains Mono', fontSize:'9px',
//                                     fontWeight:'700', color: demand?.color, letterSpacing:'1px' }}>
//                         {demand?.label} DEMAND
//                       </span>
//                     </div>
//                     <div style={{ fontFamily:'Bebas Neue', fontSize:'22px', color: t.textPrimary }}>
//                       {dynamicPriceData.multiplier}x
//                     </div>
//                   </div>
//                 )}

//                 {/* Book button */}
//                 <button
//                   style={{
//                     width:'100%', marginTop:'20px', padding:'18px',
//                     background:'linear-gradient(135deg,#3b82f6,#1d4ed8)',
//                     color:'#fff', border:'none', borderRadius:'12px',
//                     fontFamily:'Bebas Neue', fontSize:'22px', letterSpacing:'3px',
//                     cursor:'pointer', boxShadow:'0 8px 20px rgba(37,99,235,0.25)',
//                     transition:'transform 0.2s',
//                   }}
//                   onClick={() => setShowModal(true)}
//                   onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
//                   onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
//                 >
//                   BOOK SEATS NOW
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       {showModal && selectedStand && (
//         <SeatGridModal matchId={matchId} standData={selectedStand} onClose={() => setShowModal(false)} />
//       )}
//     </>
//   );
// }
import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import StadiumMap from './StadiumMap';
import SeatGridModal from './SeatGridModal';
import Stadium3DViewer from './Stadium3DViewer';
import { backendAPI } from '../services/api';

// ─── Dynamic Pricing ──────────────────────────────────────────────────────────
function computeDynamicPrice(basePrice, {
  daysLeft = 30, occupancyRatio = 0, standType = 'GENERAL',
  totalSeats = 1000, availableSeats = 1000, recentBookings24h = 0,
} = {}) {
  let timeFactor =
    daysLeft > 30 ? 0.9 : daysLeft > 14 ? 1.0 : daysLeft > 7 ? 1.1 :
      daysLeft > 3 ? 1.25 : daysLeft > 1 ? 1.45 : 1.6;

  let scarcityFactor =
    occupancyRatio < 0.3 ? 1.0 : occupancyRatio < 0.5 ? 1.05 :
      occupancyRatio < 0.7 ? 1.15 : occupancyRatio < 0.85 ? 1.3 :
        occupancyRatio < 0.95 ? 1.5 : 1.75;

  const tierMap = { VIP: 1.15, PREMIUM: 1.08, COVERED: 1.03, GENERAL: 1.0, OPEN: 0.95 };
  const tierFactor = tierMap[standType?.toUpperCase()] ?? 1.0;

  const crazeFactor =
    availableSeats < 50 ? 1.2 : availableSeats < 150 ? 1.1 :
      availableSeats < 300 ? 1.05 : 1.0;

  const heat24hFactor =
    recentBookings24h > 200 ? 1.15 : recentBookings24h > 100 ? 1.08 :
      recentBookings24h > 50 ? 1.04 : 1.0;

  const raw = timeFactor * scarcityFactor * tierFactor * crazeFactor * heat24hFactor;
  const multiplier = Math.round(Math.min(2.5, Math.max(0.85, raw)) * 100) / 100;
  return { price: Math.round(basePrice * multiplier), basePrice, multiplier };
}

function getDemandLevel(multiplier) {
  if (multiplier >= 1.8) return { label: 'SURGE', emoji: '🔥', color: '#dc2626' };
  if (multiplier >= 1.4) return { label: 'HIGH', emoji: '📈', color: '#ea580c' };
  if (multiplier >= 1.1) return { label: 'MODERATE', emoji: '⚡', color: '#ca8a04' };
  if (multiplier >= 0.95) return { label: 'NORMAL', emoji: '✅', color: '#16a34a' };
  return { label: 'LOW', emoji: '💤', color: '#2563eb' };
}

const inr = n => '₹' + Number(n).toLocaleString('en-IN');

// ─── Camera coords for 3D viewer based on stand position ─────────────────────
function getCameraCoords(stand) {
  if (!stand) return { x: 0, y: 150, z: 200 };
  const sa = (stand.start - 90) * Math.PI / 180;
  const ea = (stand.end - 90) * Math.PI / 180;
  const angleRad = (sa + ea) / 2;
  const dist = 120;
  return { x: Math.cos(angleRad) * dist, y: 40, z: Math.sin(angleRad) * dist };
}

// ─────────────────────────────────────────────────────────────────────────────

export default function StadiumViewer({
  stadiumData,
  matchLabel,
  matchId,
  matchDate,
  darkMode,
  stadiumImage,
}) {
  const [enrichedStands, setEnrichedStands] = useState(stadiumData?.stands ?? []);
  const [standsLoading, setStandsLoading] = useState(false);
  const [selectedStand, setSelectedStand] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [dynamicPriceData, setDynamicPriceData] = useState(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [cardView, setCardView] = useState('2D'); // '2D' | '3D'

  // State for Fullscreen Expand View
  const [isExpanded, setIsExpanded] = useState(false);

  const imgRef = useRef(null);

  // ── Fetch stands + merge stand_image ──────────────────────────────────────
  useEffect(() => {
    if (!matchId) return;
    setStandsLoading(true);

    backendAPI
      .get(`/matches/${matchId}/stands`)
      .then(res => {
        const dbMap = {};
        res.data.forEach(s => { dbMap[s.stand_id ?? s.id] = s; });

        const merged = (stadiumData?.stands ?? []).map(staticStand => {
          const db = dbMap[staticStand.id] ?? {};
          return {
            ...staticStand,
            stand_image: db.stand_image ?? staticStand.stand_image ?? null,
            cap: db.capacity ?? staticStand.cap,
            base: db.base_price ?? staticStand.base,
          };
        });
        setEnrichedStands(merged);
      })
      .catch(err => {
        console.warn('Could not fetch stands from DB:', err.message);
        setEnrichedStands(stadiumData?.stands ?? []);
      })
      .finally(() => setStandsLoading(false));
  }, [matchId, stadiumData]);

  // Keep selectedStand fresh after enrichedStands updates
  useEffect(() => {
    if (!selectedStand) return;
    const updated = enrichedStands.find(s => s.id === selectedStand.id);
    if (updated) setSelectedStand(updated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enrichedStands]);

  // ── Active image ───────────────────────────────────────────────────────────
  const activeImage = selectedStand?.stand_image || stadiumImage || null;

  useEffect(() => {
    setImgLoaded(false);
    if (imgRef.current && imgRef.current.complete) setImgLoaded(true);
  }, [activeImage]);

  // ── Dynamic pricing ────────────────────────────────────────────────────────
  const computeDaysLeft = useCallback(() => {
    if (!matchDate) return 30;
    return Math.max(0, Math.ceil((new Date(matchDate) - new Date()) / 86400000));
  }, [matchDate]);

  useEffect(() => {
    if (!selectedStand || !matchId) { setDynamicPriceData(null); return; }
    setPriceLoading(true);
    backendAPI
      .get(`/matches/${matchId}/stands/${selectedStand.id}/blocks`)
      .then(res => {
        let totalSeats = 0, availableSeats = 0;
        res.data.forEach(b => {
          totalSeats += b.total_seats || 0;
          availableSeats += b.available_seats || 0;
        });
        const occupancyRatio = totalSeats > 0 ? (totalSeats - availableSeats) / totalSeats : 0;
        const result = computeDynamicPrice(selectedStand.base, {
          daysLeft: computeDaysLeft(), occupancyRatio,
          standType: selectedStand.type, totalSeats, availableSeats,
        });
        setDynamicPriceData({ ...result, availableSeats });
      })
      .catch(() => {
        setDynamicPriceData({
          price: selectedStand.base, basePrice: selectedStand.base,
          multiplier: 1.0, availableSeats: selectedStand.cap,
        });
      })
      .finally(() => setPriceLoading(false));
  }, [selectedStand, matchId, computeDaysLeft]);

  // ── Theme ──────────────────────────────────────────────────────────────────
  const t = {
    panelBg: darkMode ? '#0f172a' : '#ffffff',
    panelBorder: darkMode ? '1px solid #1e293b' : '1px solid #e2e8f0',
    panelShadow: darkMode ? '0 10px 30px rgba(0,0,0,0.4)' : '0 10px 30px rgba(37,99,235,0.08)',
    textPrimary: darkMode ? '#f8fafc' : '#0f172a',
    textSecondary: darkMode ? '#94a3b8' : '#64748b',
    cardBg: darkMode ? '#1e293b' : '#f8fafc',
    cardBorder: darkMode ? '1px solid #334155' : '1px solid #e2e8f0',
    priceBg: darkMode ? '#1e3a8a' : '#eff6ff',
    priceBorder: darkMode ? '1px solid #1e40af' : '1px solid #bfdbfe',
    primaryBlue: '#2563eb',
    divider: darkMode
      ? 'linear-gradient(90deg,#3b82f6 0%,#0f172a 100%)'
      : 'linear-gradient(90deg,#2563eb 0%,#ffffff 100%)',
    toggleActiveBg: '#2563eb',
    toggleInactiveBg: darkMode ? 'transparent' : 'transparent',
  };

  const demand = dynamicPriceData ? getDemandLevel(dynamicPriceData.multiplier) : null;
  const enrichedStadiumData = enrichedStands.length
    ? { ...stadiumData, stands: enrichedStands }
    : stadiumData;

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from { opacity:0; transform:translateY(12px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position:-400px 0; }
          100% { background-position: 400px 0; }
        }
        @keyframes expandIn {
          from { opacity:0; transform:scale(0.95); }
          to   { opacity:1; transform:scale(1); }
        }
        .stand-img-fade { animation: fadeInUp 0.4s ease forwards; }
        .img-skeleton {
          background: linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%);
          background-size: 400px 100%;
          animation: shimmer 1.4s infinite;
        }

        .sv-grid { display: grid; grid-template-columns: 1fr; gap: 24px; margin-top: 20px; }
        @media (min-width: 950px)  { .sv-grid { grid-template-columns: 1fr 460px; } }
        @media (min-width: 1300px) { .sv-grid { grid-template-columns: 1fr 540px; } }
        @media (min-width: 1500px) { .sv-grid { grid-template-columns: 1fr 620px; } }

        .view-toggle-btn {
          padding: 7px 18px;
          border-radius: 8px;
          border: none;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 13px;
          letter-spacing: 1.5px;
          cursor: pointer;
          transition: background 0.2s, color 0.2s, transform 0.15s;
        }
        .view-toggle-btn:hover { transform: scale(1.04); }

        .expand-btn {
          position: absolute;
          top: 12px;
          right: 12px;
          z-index: 10;
          background: rgba(0,0,0,0.5);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 8px;
          cursor: pointer;
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .expand-btn:hover { background: rgba(0,0,0,0.8); transform: scale(1.05); }
      `}</style>

      <div className="sv-grid">

        {/* ── LEFT: Canvas map ── */}
        <div>
          <StadiumMap
            stadiumData={enrichedStadiumData}
            selectedId={selectedStand?.id ?? null}
            hoveredId={hoveredId}
            onHover={setHoveredId}
            onSelect={stand => {
              const enriched = enrichedStands.find(s => s.id === stand.id) ?? stand;
              setSelectedStand(enriched);
            }}
            darkMode={darkMode}
          />
        </div>

        {/* ── RIGHT: Image/3D card + info panel ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* IMAGE / 3D CARD */}
          <div style={{
            borderRadius: '20px', overflow: 'hidden',
            border: t.panelBorder, boxShadow: t.panelShadow,
            background: darkMode ? '#0f172a' : '#f8fafc',
            position: 'relative',
          }}>

            {/* ── Expand Button ── */}
            {(cardView === '3D' || activeImage) && (
              <button
                className="expand-btn"
                onClick={() => setIsExpanded(true)}
                title="Fullscreen View"
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
            )}

            {/* ── 2D / 3D Toggle ── */}
            <div style={{
              display: 'flex', justifyContent: 'center', gap: '6px',
              padding: '10px 12px 0',
              position: 'relative', zIndex: 4,
            }}>
              <div style={{
                display: 'inline-flex', gap: '4px',
                background: darkMode ? '#1e293b' : '#e2e8f0',
                padding: '4px', borderRadius: '10px',
              }}>
                <button
                  className="view-toggle-btn"
                  onClick={() => setCardView('2D')}
                  style={{
                    background: cardView === '2D' ? t.toggleActiveBg : 'transparent',
                    color: cardView === '2D' ? '#fff' : t.textSecondary,
                  }}
                >
                  📷 PHOTO
                </button>
                <button
                  className="view-toggle-btn"
                  onClick={() => setCardView('3D')}
                  style={{
                    background: cardView === '3D' ? t.toggleActiveBg : 'transparent',
                    color: cardView === '3D' ? '#fff' : t.textSecondary,
                  }}
                >
                  🏟 3D VIEW
                </button>
              </div>
            </div>

            {/* ── Card body: photo or 3D ── */}
            <div style={{ position: 'relative', aspectRatio: '16/9', minHeight: '200px', marginTop: '10px' }}>

              {/* ── PHOTO MODE ── */}
              {cardView === '2D' && (
                <>
                  {!imgLoaded && (
                    <div className="img-skeleton" style={{ position: 'absolute', inset: 0, zIndex: 1 }} />
                  )}

                  {activeImage ? (
                    <img
                      ref={imgRef}
                      key={activeImage}
                      src={activeImage}
                      alt={selectedStand?.name ?? stadiumData?.name}
                      onLoad={() => setImgLoaded(true)}
                      onError={() => setImgLoaded(true)}
                      className="stand-img-fade"
                      style={{
                        width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                        opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.35s ease',
                      }}
                    />
                  ) : (
                    <div style={{
                      position: 'absolute', inset: 0, display: 'flex',
                      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      color: t.textSecondary, gap: '8px',
                    }}>
                      <span style={{ fontSize: '40px' }}>🏟️</span>
                      <span style={{
                        fontFamily: 'JetBrains Mono', fontSize: '10px',
                        letterSpacing: '1px', textTransform: 'uppercase',
                      }}>
                        {standsLoading ? 'Loading…' : 'No image available'}
                      </span>
                    </div>
                  )}
                </>
              )}

              {/* ── 3D MODE ── */}
              {cardView === '3D' && (
                <Suspense fallback={
                  <div style={{
                    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: t.textSecondary, fontFamily: 'JetBrains Mono',
                    fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase',
                  }}>
                    Loading 3D Engine…
                  </div>
                }>
                  <div style={{ width: '100%', height: '100%', background: '#020617' }}>
                    <Stadium3DViewer activeBlockCoords={getCameraCoords(selectedStand)} />
                  </div>
                </Suspense>
              )}

              {/* Bottom label overlay (both modes) */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                background: 'linear-gradient(to top,rgba(0,0,0,0.65) 0%,transparent 100%)',
                padding: '20px 16px 12px', zIndex: 2,
                pointerEvents: 'none',
              }}>
                <p style={{
                  margin: 0, fontFamily: 'JetBrains Mono', fontSize: '10px',
                  fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.9)',
                }}>
                  {selectedStand
                    ? `📍 ${selectedStand.name}`
                    : `🏟️ ${stadiumData?.name ?? 'Stadium View'}`}
                </p>
              </div>

              {/* "Choose a stand" badge */}
              {!selectedStand && cardView === '2D' && (
                <div style={{
                  position: 'absolute', top: '12px', left: '12px', zIndex: 3,
                  background: 'rgba(37,99,235,0.92)', backdropFilter: 'blur(8px)',
                  borderRadius: '8px', padding: '6px 12px',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}>
                  <span style={{ fontSize: '11px' }}>👆</span>
                  <span style={{
                    fontFamily: 'JetBrains Mono', fontSize: '9px', fontWeight: '700',
                    letterSpacing: '1.5px', color: '#fff', textTransform: 'uppercase',
                  }}>Choose a Stand</span>
                </div>
              )}
            </div>
          </div>

          {/* INFO PANEL */}
          <div style={{
            background: t.panelBg, padding: '24px', borderRadius: '16px',
            border: t.panelBorder, boxShadow: t.panelShadow,
            transition: 'all 0.3s ease', flex: 1,
          }}>
            {!selectedStand ? (
              <div style={{ textAlign: 'center', color: t.textSecondary, padding: '24px 0' }}>
                <p style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', letterSpacing: '1px', margin: 0 }}>
                  SELECT A SECTOR TO VIEW DETAILS
                </p>
              </div>
            ) : (
              <div style={{ animation: 'fadeInUp 0.35s ease forwards' }}>
                <h2 style={{
                  fontFamily: 'Bebas Neue', fontSize: '34px', margin: 0,
                  color: t.textPrimary, letterSpacing: '1px'
                }}>
                  {selectedStand.name}
                </h2>
                <p style={{
                  fontFamily: 'JetBrains Mono', fontSize: '10px', color: t.primaryBlue,
                  textTransform: 'uppercase', fontWeight: '800',
                  letterSpacing: '2px', marginTop: '4px'
                }}>
                  {selectedStand.type}
                </p>

                <div style={{ height: '1px', background: t.divider, margin: '20px 0' }} />

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ background: t.cardBg, padding: '16px', borderRadius: '12px', border: t.cardBorder }}>
                    <small style={{ fontSize: '9px', color: t.textSecondary, fontFamily: 'JetBrains Mono' }}>
                      REMAINING SEATS
                    </small>
                    <div style={{ fontFamily: 'Bebas Neue', fontSize: '28px', color: t.textPrimary }}>
                      {dynamicPriceData
                        ? dynamicPriceData.availableSeats.toLocaleString()
                        : selectedStand.cap.toLocaleString()}
                    </div>
                  </div>

                  <div style={{ background: t.priceBg, padding: '16px', borderRadius: '12px', border: t.priceBorder }}>
                    {priceLoading ? (
                      <>
                        <small style={{ fontSize: '9px', color: t.primaryBlue, fontFamily: 'JetBrains Mono' }}>COMPUTING...</small>
                        <div style={{ fontFamily: 'Bebas Neue', fontSize: '22px', color: '#94a3b8' }}>---</div>
                      </>
                    ) : (
                      <>
                        <small style={{ fontSize: '9px', color: t.primaryBlue, fontFamily: 'JetBrains Mono' }}>CURRENT PRICE</small>
                        <div style={{ fontFamily: 'Bebas Neue', fontSize: '28px', color: t.primaryBlue }}>
                          {inr(dynamicPriceData?.price ?? selectedStand.base)}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Demand badge */}
                {dynamicPriceData && !priceLoading && (
                  <div style={{
                    marginTop: '14px', borderRadius: '12px', padding: '12px 16px',
                    background: darkMode ? '#1e293b' : '#f8fafc', border: t.cardBorder,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      background: demand?.color + '18', border: `1px solid ${demand?.color}40`,
                      padding: '4px 10px', borderRadius: '20px',
                    }}>
                      <span style={{ fontSize: '12px' }}>{demand?.emoji}</span>
                      <span style={{
                        fontFamily: 'JetBrains Mono', fontSize: '9px',
                        fontWeight: '700', color: demand?.color, letterSpacing: '1px'
                      }}>
                        {demand?.label} DEMAND
                      </span>
                    </div>
                    <div style={{ fontFamily: 'Bebas Neue', fontSize: '22px', color: t.textPrimary }}>
                      {dynamicPriceData.multiplier}x
                    </div>
                  </div>
                )}

                {/* Book button */}
                <button
                  style={{
                    width: '100%', marginTop: '20px', padding: '18px',
                    background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
                    color: '#fff', border: 'none', borderRadius: '12px',
                    fontFamily: 'Bebas Neue', fontSize: '22px', letterSpacing: '3px',
                    cursor: 'pointer', boxShadow: '0 8px 20px rgba(37,99,235,0.25)',
                    transition: 'transform 0.2s',
                  }}
                  onClick={() => setShowModal(true)}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  BOOK SEATS NOW
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── EXPANDED FULLSCREEN OVERLAY ── */}
      {isExpanded && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(10px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          paddingTop: '64px' // Added top padding to clear the navbar
        }}>
          {/* Close Button */}
          <button
            onClick={() => setIsExpanded(false)}
            style={{
              position: 'absolute', top: '84px', right: '32px', zIndex: 10001, // Pushed top value down to avoid navbar
              background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none',
              borderRadius: '50%', width: '48px', height: '48px', fontSize: '20px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.transform = 'rotate(90deg)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'rotate(0deg)'; }}
          >✕</button>

          {/* Content Wrapper */}
          <div style={{
            width: '90vw', height: '75vh', position: 'relative', // Reduced height to 75vh to fit nicely
            borderRadius: '24px', overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255,255,255,0.1)',
            animation: 'expandIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            {cardView === '2D' ? (
              <img
                src={activeImage}
                alt="Expanded view"
                style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
              />
            ) : (
              <Suspense fallback={<div style={{ color: 'white', display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>Loading 3D Engine...</div>}>
                <div style={{ width: '100%', height: '100%', background: '#020617' }}>
                  <Stadium3DViewer activeBlockCoords={getCameraCoords(selectedStand)} />
                </div>
              </Suspense>
            )}
          </div>

          <div style={{
            position: 'absolute', bottom: '30px',
            fontFamily: 'JetBrains Mono', color: 'rgba(255,255,255,0.5)', fontSize: '12px', letterSpacing: '1px'
          }}>
            {cardView === '3D' ? 'SCROLL TO ZOOM • DRAG TO ROTATE' : `${selectedStand?.name ?? stadiumData?.name} - HD PHOTO`}
          </div>
        </div>
      )}

      {/* ── SEAT SELECTION MODAL ── */}
      {showModal && selectedStand && (
        <SeatGridModal matchId={matchId} standData={selectedStand} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}