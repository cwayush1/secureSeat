import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { backendAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

/* ─── CSS injected once ─────────────────────────────────────── */
const STYLES = `
  @keyframes modalIn  { from { opacity:0; transform:scale(0.97) translateY(12px) } to { opacity:1; transform:scale(1) translateY(0) } }
  @keyframes fadeUp   { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
  @keyframes spin     { to { transform:rotate(360deg) } }
  
  .sgm-modal         { animation: modalIn .3s cubic-bezier(.16,1,.3,1) both; }
  .sgm-blocks-wrap   { animation: fadeUp .3s ease both; }
  .sgm-seats-wrap    { animation: fadeUp .2s ease both; }

  /* Clean Light Scrollbar */
  .sgm-scrollbar::-webkit-scrollbar        { width: 8px; height: 8px; }
  .sgm-scrollbar::-webkit-scrollbar-track  { background: transparent; }
  .sgm-scrollbar::-webkit-scrollbar-thumb  { background: #cbd5e1; border-radius: 4px; }
  .sgm-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

  /* ── SEAT GRID & ZOOM (NATIVE CSS TRANSITION, NO BLURRY SCALE) ── */
  .sgm-seat-grid {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 0 auto; /* Centers the grid safely */
    transition: gap 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .sgm-seat-row {
    display: flex;
    align-items: center;
    transition: gap 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .sgm-seat {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-family: 'JetBrains Mono', monospace;
    font-weight: 700;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .sgm-seat.booked {
    background: #cbd5e1 !important;
    color: transparent !important;
    cursor: not-allowed;
    opacity: 0.5;
    box-shadow: none !important;
  }

  /* 1X ZOOM STATE */
  .z1 { gap: 6px; }
  .z1 .sgm-seat-row { gap: 4px; }
  .z1 .sgm-seat { 
    width: 12px; height: 12px; 
    border-radius: 3px; 
    font-size: 0px; /* Hide text completely */
    color: transparent;
  }
  .z1 .sgm-row-label { opacity: 0; font-size: 0px; width: 0px; }
  
  /* 4X ZOOM STATE */
  .z4 { gap: 16px; }
  .z4 .sgm-seat-row { gap: 10px; }
  .z4 .sgm-seat { 
    width: 36px; height: 36px; 
    border-radius: 8px 8px 4px 4px; 
    font-size: 11px; /* Perfectly crisp native text */
    color: #ffffff;
  }
  .z4 .sgm-row-label { opacity: 1; font-size: 14px; width: 40px; }

  /* Hover Effects (Only active at 4x) */
  .z4 .sgm-seat.avail:hover { transform: translateY(-4px) scale(1.1); z-index: 10; }
  .z4 .sgm-seat.avail.reg:hover { box-shadow: 0 8px 16px rgba(37, 99, 235, 0.3); }
  .z4 .sgm-seat.avail.vip:hover { box-shadow: 0 8px 16px rgba(245, 158, 11, 0.3); }

  /* Colors */
  .sgm-seat.avail.reg { background: #3b82f6; }
  .sgm-seat.avail.vip { background: #f59e0b; }

  /* ── Block Card ── */
  .sgm-block-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 20px 16px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.02);
  }
  .sgm-block-card:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(0,0,0,0.06); }
  .sgm-block-card.regular:hover { border-color: #2563eb; }
  .sgm-block-card.vip:hover { border-color: #f59e0b; }

  /* ── Zoom Toggle ── */
  .sgm-zoom-btn {
    padding: 8px 18px; border: none; border-radius: 8px;
    font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: bold;
    cursor: pointer; transition: all 0.2s ease; color: #64748b; background: transparent;
  }
  .sgm-zoom-btn.active  { background: #ffffff; color: #0f172a; box-shadow: 0 2px 6px rgba(0,0,0,0.05); }

  /* ── Back Button ── */
  .sgm-back-btn {
    display: flex; align-items: center; gap: 8px; padding: 12px 20px;
    border: none; border-radius: 12px; font-family: 'JetBrains Mono', monospace;
    font-size: 12px; font-weight: bold; cursor: pointer; transition: all 0.2s ease;
  }
  .sgm-back-btn.regular { background: #0f172a; color: #ffffff; box-shadow: 0 4px 12px rgba(15,23,42,0.15); }
  .sgm-back-btn.regular:hover { background: #1e293b; transform: translateY(-1px); }
  .sgm-back-btn.vip { background: #f59e0b; color: #ffffff; box-shadow: 0 4px 12px rgba(245,158,11,0.2); }
  .sgm-back-btn.vip:hover { background: #d97706; transform: translateY(-1px); }
`;

/* ─── Inject styles once ────────────────────────────────────── */
let stylesInjected = false;
function injectStyles() {
  if (stylesInjected) return;
  stylesInjected = true;
  const el = document.createElement('style');
  el.textContent = STYLES;
  document.head.appendChild(el);
}

/* ─── Stadium SVG overview (DYNAMIC SEMI-CIRCLE) ──────────────── */
const StandOverviewSVG = ({ blocks, onBlockClick }) => {
  const [hovered, setHovered] = useState(null);

  const paths = useMemo(() => blocks.map((block, i) => {
    const totalSweep = 180;
    const startOffset = 180; 
    const step = totalSweep / Math.max(1, blocks.length);
    const gap = blocks.length > 1 ? 2 : 0; 
    
    const sa = startOffset + (i * step) + (gap / 2);
    const ea = startOffset + ((i + 1) * step) - (gap / 2);
    const r  = Math.PI / 180;
    
    const cx = 400;
    const cy = 250;
    
    const x1 = cx + 200 * Math.cos(sa * r), y1 = cy + 200 * Math.sin(sa * r);
    const x2 = cx + 200 * Math.cos(ea * r), y2 = cy + 200 * Math.sin(ea * r);
    const x3 = cx + 105 * Math.cos(ea * r), y3 = cy + 105 * Math.sin(ea * r);
    const x4 = cx + 105 * Math.cos(sa * r), y4 = cy + 105 * Math.sin(sa * r);
    
    return {
      block,
      d: `M ${x1} ${y1} A 200 200 0 0 1 ${x2} ${y2} L ${x3} ${y3} A 105 105 0 0 0 ${x4} ${y4} Z`
    };
  }), [blocks]);

  return (
    <div style={{ position:'relative', width:'100%', height:'320px', display:'flex', justifyContent:'center' }}>
      <svg viewBox="0 0 800 300" style={{ width:'100%', height:'100%', filter:'drop-shadow(0 10px 15px rgba(0,0,0,.05))' }}>
        
        {paths.map(({ block, d }) => {
          const isHov = hovered?.id === block.id;
          const isVIP = block.category === 'VIP';
          
          let fill = '#ffffff'; 
          let stroke = '#e2e8f0';
          
          if (isHov) {
            fill = isVIP ? '#f59e0b' : '#3b82f6';
            stroke = isVIP ? '#d97706' : '#2563eb';
          } else if (isVIP) {
            fill = '#fef3c7'; 
            stroke = '#fde68a';
          }

          return (
            <path
              key={block.id}
              d={d}
              fill={fill}
              stroke={stroke}
              strokeWidth={isHov ? 2 : 1}
              style={{ cursor:'pointer', transition:'all 0.2s ease' }}
              onMouseEnter={() => setHovered(block)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onBlockClick(block)}
            />
          );
        })}

        {/* Pitch */}
        <ellipse cx="400" cy="250" rx="65" ry="30" fill="#22c55e" stroke="#16a34a" strokeWidth="2"/>
        <rect x="395" y="235" width="10" height="30" fill="#fef08a" rx="2" opacity="0.8" />
        <text x="400" y="253" textAnchor="middle" style={{ fontFamily:'Bebas Neue,sans-serif', fontSize:'11px', fill:'#ffffff', letterSpacing:'2px' }}>PITCH</text>
      </svg>

      {/* Hover tooltip */}
      {hovered && (
        <div style={{
          position:'absolute', top:'12px', left:'50%', transform:'translateX(-50%)',
          background:'rgba(15, 23, 42, 0.9)', backdropFilter:'blur(8px)',
          padding:'16px 24px', borderRadius:'16px', color:'white',
          pointerEvents:'none', textAlign:'center', whiteSpace:'nowrap',
          boxShadow:'0 16px 32px rgba(0,0,0,.15)', border:'1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ fontFamily:'Bebas Neue,sans-serif', fontSize:'24px', letterSpacing:'1px', lineHeight:1 }}>{hovered.name}</div>
          <div style={{ display:'flex', gap:'8px', justifyContent:'center', marginTop:'8px' }}>
            <span style={{ fontFamily:'JetBrains Mono', fontWeight:'bold', fontSize:'10px', background:hovered.category==='VIP'?'#f59e0b':'#3b82f6', padding:'2px 8px', borderRadius:'6px' }}>{hovered.category}</span>
            <span style={{ fontFamily:'JetBrains Mono', fontWeight:'bold', fontSize:'10px', background:'#475569', padding:'2px 8px', borderRadius:'6px' }}>{hovered.tier}</span>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Main Modal ────────────────────────────────────────────── */
export default function SeatGridModal({ matchId, standData, onClose }) {
  injectStyles();

  const [view,          setView]          = useState('blocks');
  const [blocks,        setBlocks]        = useState([]);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [seats,         setSeats]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [zoomed,        setZoomed]        = useState(false); 
  const gridWrapRef = useRef(null);
  const navigate    = useNavigate();

  const isVIP   = selectedBlock?.category === 'VIP';
  const isUpper = selectedBlock?.tier     === 'Upper';

  /* fetch blocks */
  useEffect(() => {
    if (view !== 'blocks') return;
    let alive = true;
    setLoading(true);
    setError(null);
    backendAPI.get(`/matches/${matchId}/stands/${standData.id}/blocks`)
      .then(r  => { if (alive) { setBlocks(r.data); setLoading(false); } })
      .catch(e => { if (alive) { setError(e.response?.data?.message || 'Failed to load blocks'); setLoading(false); } });
    return () => { alive = false; };
  }, [matchId, standData.id, view]);

  /* block click → fetch seats */
  const handleBlockClick = useCallback(async (block) => {
    try {
      setLoading(true);
      setError(null);
      setSelectedBlock(block);
      setZoomed(false);
      const res = await backendAPI.get(`/matches/${matchId}/blocks/${block.id}/seats`);
      setSeats(res.data);
      setView('seats');
    } catch {
      setError('Failed to load seats for this block');
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  /* group seats by row */
  const rows = useMemo(() => seats.reduce((acc, seat) => {
    (acc[seat.row_id] ||= []).push(seat);
    return acc;
  }, {}), [seats]);

  /* seat click */
  const handleSeatClick = useCallback((seat) => {
    if (!zoomed) { setZoomed(true); return; }
    if (seat.seat_status === 'Available') {
      navigate(`/checkout/${matchId}/${seat.seat_id}`);
    }
  }, [zoomed, matchId, navigate]);

  /* close on backdrop */
  const handleBackdrop = (e) => { if (e.target === e.currentTarget) onClose(); };

  return (
    <div
      onClick={handleBackdrop}
      style={{
        position:'fixed', inset:0,
        background:'rgba(15, 23, 42, 0.7)', 
        backdropFilter:'blur(12px)',
        display:'flex', justifyContent:'center', alignItems:'center',
        zIndex:9999, 
        padding:'16px',
        paddingTop: '64px'
      }}
    >
      <div
        className="sgm-modal"
        style={{
          background:'#ffffff', 
          width:'100%',
          maxWidth: isUpper ? '1500px' : '1300px',
          height:'82vh', 
          borderRadius:'32px',
          display:'flex', flexDirection:'column',
          overflow:'hidden',
          border:'1px solid rgba(0,0,0,0.05)',
          boxShadow: isVIP
            ? '0 25px 80px rgba(245, 158, 11, 0.2)'
            : '0 25px 80px rgba(15, 23, 42, 0.2)',
        }}
      >

        {/* ── Premium Light Header ─────────────────────────────────────────── */}
        <div style={{
          padding:'24px 40px',
          borderBottom:'1px solid #e2e8f0',
          display:'flex', justifyContent:'space-between', alignItems:'center',
          background:'#ffffff',
          flexShrink:0
        }}>
          {/* Left */}
          <div style={{ display:'flex', alignItems:'center', gap:'24px' }}>
            {view === 'seats' && (
              <button
                className={`sgm-back-btn ${isVIP ? 'vip' : 'regular'}`}
                onClick={() => setView('blocks')}
              >
                ← STADIUM VIEW
              </button>
            )}
            <div>
              <h2 style={{ fontFamily:'Bebas Neue,sans-serif', fontSize:'42px', margin:0, color:'#0f172a', letterSpacing:'1px', lineHeight:1 }}>
                {standData.name}
                {view === 'seats' && selectedBlock && (
                  <span style={{ color:'#64748b' }}> / {selectedBlock.name}</span>
                )}
              </h2>
              <div style={{ display:'flex', alignItems:'center', gap:'12px', marginTop:'6px' }}>
                {selectedBlock && (
                  <span style={{
                    fontFamily:'JetBrains Mono,monospace', fontSize:'11px', fontWeight:'bold',
                    background: isVIP ? '#fef3c7' : '#eff6ff',
                    color: isVIP ? '#d97706' : '#2563eb',
                    padding:'4px 10px', borderRadius:'6px',
                  }}>
                    {selectedBlock.category}
                  </span>
                )}
                <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:'12px', fontWeight:'600', color:'#64748b' }}>
                  {view === 'seats'
                    ? `${selectedBlock?.tier?.toUpperCase()} TIER • ${seats.length} SEATS`
                    : 'SELECT A BLOCK'
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Right */}
          <div style={{ display:'flex', gap:'16px', alignItems:'center' }}>
            {view === 'seats' && (
              <div style={{
                background:'#f8fafc', border:'1px solid #e2e8f0',
                borderRadius:'12px', padding:'6px', display:'flex', gap:'4px'
              }}>
                <button className={`sgm-zoom-btn ${!zoomed ? 'active' : 'inactive'}`} onClick={() => setZoomed(false)}>1×</button>
                <button className={`sgm-zoom-btn ${zoomed  ? 'active' : 'inactive'}`} onClick={() => setZoomed(true)}>4×</button>
              </div>
            )}
            <button
              onClick={onClose}
              style={{
                background:'#f1f5f9', border:'none',
                borderRadius:'50%', width:'48px', height:'48px',
                fontSize:'20px', cursor:'pointer', color:'#64748b',
                display:'flex', alignItems:'center', justifyContent:'center',
                transition:'all .2s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.background='#e2e8f0'; e.currentTarget.style.color='#0f172a'; e.currentTarget.style.transform='rotate(90deg)'; }}
              onMouseLeave={e => { e.currentTarget.style.background='#f1f5f9'; e.currentTarget.style.color='#64748b'; e.currentTarget.style.transform='rotate(0deg)'; }}
            >✕</button>
          </div>
        </div>

        {/* ── Body ────────────────────────────────────────────── */}
        <div
          ref={gridWrapRef}
          className="sgm-scrollbar"
          style={{
            flex:1,
            overflow:'auto',
            padding: view === 'seats' ? '40px' : '30px',
            background:'#f8fafc', 
            position:'relative',
          }}
        >
          {/* Loading */}
          {loading && (
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'16px' }}>
              <div style={{
                width:'48px', height:'48px',
                border:'4px solid #e2e8f0',
                borderTop:`4px solid ${isVIP ? '#f59e0b' : '#3b82f6'}`,
                borderRadius:'50%',
                animation:'spin 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite'
              }}/>
              <p style={{ fontFamily:'JetBrains Mono,monospace', fontSize:'13px', fontWeight:'600', color:'#64748b', letterSpacing:'2px' }}>
                CALIBRATING...
              </p>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:'12px' }}>
              <div style={{ fontSize:'40px' }}>⚠️</div>
              <p style={{ fontFamily:'JetBrains Mono,monospace', fontSize:'14px', color:'#ef4444', fontWeight:'bold' }}>{error}</p>
            </div>
          )}

          {/* Blocks view */}
          {!loading && !error && view === 'blocks' && (
            <div className="sgm-blocks-wrap" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'40px' }}>
              <StandOverviewSVG blocks={blocks} onBlockClick={handleBlockClick} />

              <div style={{
                display:'grid',
                gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))',
                gap:'16px', width:'100%', maxWidth:'900px'
              }}>
                {blocks.map(block => (
                  <div
                    key={block.id}
                    className={`sgm-block-card ${block.category === 'VIP' ? 'vip' : 'regular'}`}
                    onClick={() => handleBlockClick(block)}
                  >
                    <div style={{ fontFamily:'Bebas Neue,sans-serif', fontSize:'24px', color:'#0f172a', letterSpacing:'1px' }}>
                      {block.name}
                    </div>
                    <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:'11px', fontWeight:'bold', color:'#64748b', marginTop:'8px' }}>
                      {block.category} • {block.available_seats} SEATS
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Seats view (Added minWidth: max-content to prevent clipping) */}
          {!loading && !error && view === 'seats' && (
            <div className="sgm-seats-wrap" style={{ minWidth: 'max-content', padding: '0 40px' }}>
              <div className={`sgm-seat-grid ${zoomed ? 'z4' : 'z1'}`}>
                {Object.keys(rows).sort().map(rowId => (
                  <div key={rowId} className="sgm-seat-row">
                    
                    {/* Row Label (Left) */}
                    <div className="sgm-row-label" style={{ 
                      textAlign:'right', fontFamily:'JetBrains Mono', color:'#94a3b8', fontWeight:'bold', transition:'all 0.3s' 
                    }}>{rowId}</div>

                    {/* Seats */}
                    {rows[rowId].map(seat => {
                      const avail   = seat.seat_status === 'Available';
                      return (
                        <div
                          key={seat.seat_id}
                          className={`sgm-seat ${avail ? (isVIP ? 'avail vip' : 'avail reg') : 'booked'}`}
                          onClick={() => handleSeatClick(seat)}
                          title={`${rowId}${seat.seat_number}${avail ? ' — Available' : ' — Reserved'}`}
                        >
                          {seat.seat_number}
                        </div>
                      );
                    })}

                    {/* Row Label (Right) */}
                    <div className="sgm-row-label" style={{ 
                      textAlign:'left', fontFamily:'JetBrains Mono', color:'#94a3b8', fontWeight:'bold', transition:'all 0.3s' 
                    }}>{rowId}</div>

                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Premium Light Legend ──────────────────────────────────────────── */}
        {view === 'seats' && (
          <div style={{
            padding:'20px 40px',
            borderTop:'1px solid #e2e8f0',
            display:'flex', justifyContent:'center', gap:'40px',
            background:'#ffffff',
            flexShrink:0
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
              <div style={{ width:'18px', height:'18px', borderRadius:'6px', background: isVIP ? '#f59e0b' : '#3b82f6', boxShadow:`0 4px 10px ${isVIP ? 'rgba(245,158,11,0.3)' : 'rgba(59,130,246,0.3)'}` }}/>
              <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:'12px', fontWeight:'bold', color:'#475569' }}>AVAILABLE</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
              <div style={{ width:'18px', height:'18px', borderRadius:'6px', background:'#cbd5e1' }}/>
              <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:'12px', fontWeight:'bold', color:'#475569' }}>RESERVED</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
