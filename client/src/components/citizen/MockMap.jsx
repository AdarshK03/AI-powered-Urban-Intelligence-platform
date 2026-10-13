import { useRef, useState } from 'react';
import { LocateIcon, MinusIcon, PlusIcon } from './icons';
import { focusRing } from './ui';
 
// ILLUSTRATIVE map drawn locally with SVG. It is NOT real geography and has no GPS.
// Marker positions are percentages (x, y) of the map area. Swap for MapLibre later.
const LANDMARKS = [
  { name: 'Connaught Place', x: 44, y: 22 }, { name: 'India Gate', x: 84, y: 30 },
  { name: 'Lodhi Garden', x: 22, y: 54 }, { name: 'Nizamuddin', x: 76, y: 56 },
  { name: 'AIIMS', x: 50, y: 78 }, { name: 'Vasant Kunj', x: 14, y: 92 }, { name: 'Hauz Khas', x: 62, y: 93 },
];
 
function MapArt() {
  const roads = [
    'M0 120 C120 150 220 90 400 130', 'M0 330 C140 300 250 360 400 320', 'M60 0 C90 150 40 330 80 600',
    'M230 0 C210 160 260 330 240 600', 'M360 0 C340 200 380 380 350 600', 'M0 470 C150 450 260 500 400 470',
  ];
  return (
    <svg viewBox="0 0 400 600" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
      <rect width="400" height="600" fill="#EDF2EE" />
      <path d="M50 270 120 250 160 300 130 360 60 350z" fill="#CFE5C4" />
      <path d="M300 150 380 140 390 250 310 260z" fill="#CFE5C4" />
      <path d="M160 440 240 430 250 520 170 530z" fill="#DDE3E8" />
      <path d="M280 470 360 480 350 570 270 560z" fill="#CFE5C4" />
      {roads.map((d) => (
        <g key={d} fill="none" strokeLinecap="round">
          <path d={d} stroke="#D3DAD6" strokeWidth="10" /><path d={d} stroke="#FFFFFF" strokeWidth="6.5" />
        </g>
      ))}
      <path d="M0 220 C130 260 260 200 400 250" fill="none" stroke="#F3D98B" strokeWidth="7" strokeLinecap="round" />
      <circle cx="176" cy="132" r="30" fill="none" stroke="#FFFFFF" strokeWidth="6" />
    </svg>
  );
}
 
export function Pin({ color, glyph, className = 'h-9 w-7' }) {
  return (
    <svg viewBox="0 0 28 36" className={className} aria-hidden="true">
      <path d="M14 35S2 22.5 2 13.5a12 12 0 0 1 24 0C26 22.5 14 35 14 35z" fill={color} stroke="#fff" strokeWidth="2" />
      <circle cx="14" cy="13.5" r="7" fill="#fff" fillOpacity=".95" />
      <text x="14" y="17.5" textAnchor="middle" fontSize="11" fontWeight="700" fill={color} fontFamily="system-ui, sans-serif">{glyph}</text>
    </svg>
  );
}
 
const ctrlBtn = `flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white text-slate-700 shadow-md hover:bg-slate-50 ${focusRing}`;
 
/**
 * markers: [{ id, pos: {x,y}, color, glyph, label }]
 * onSelect(id|null): marker tapped / background tapped
 * onPick({x,y}): optional, background tapped (used by the report location picker)
 * pin: optional {x,y} pin dropped by the user
 * children: overlays (legend, preview card…) that do not zoom or pan
 */
export default function MockMap({ markers = [], selectedId = null, onSelect, onPick, pin = null, children, className = '' }) {
  const [view, setView] = useState({ zoom: 1, x: 0, y: 0 });
  const layerRef = useRef(null);
  const drag = useRef({ moved: false, sx: 0, sy: 0, ox: 0, oy: 0 });
 
  const zoomBy = (d) => setView((v) => {
    const zoom = Math.min(3, Math.max(1, v.zoom + d));
    return zoom === 1 ? { zoom, x: 0, y: 0 } : { ...v, zoom };
  });
 
  const handleTap = (ev) => {
    if (onPick && layerRef.current) {
      const r = layerRef.current.getBoundingClientRect();
      const x = Math.min(98, Math.max(2, ((ev.clientX - r.left) / r.width) * 100));
      const y = Math.min(98, Math.max(2, ((ev.clientY - r.top) / r.height) * 100));
      onPick({ x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 });
    } else onSelect?.(null);
  };
 
  const onPointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    const d = drag.current;
    Object.assign(d, { moved: false, sx: e.clientX, sy: e.clientY, ox: view.x, oy: view.y });
    const move = (ev) => {
      const dx = ev.clientX - d.sx;
      const dy = ev.clientY - d.sy;
      if (Math.abs(dx) + Math.abs(dy) > 5) d.moved = true;
      if (!d.moved) return;
      const w = layerRef.current?.offsetWidth ?? 0;
      const h = layerRef.current?.offsetHeight ?? 0;
      setView((v) => {
        const mx = ((v.zoom - 1) * w) / 2;
        const my = ((v.zoom - 1) * h) / 2;
        return { ...v, x: Math.max(-mx, Math.min(mx, d.ox + dx)), y: Math.max(-my, Math.min(my, d.oy + dy)) };
      });
    };
    const up = (ev) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      if (!d.moved) handleTap(ev);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
 
  const counter = { transform: `translate(-50%, -100%) scale(${1 / view.zoom})`, transformOrigin: '50% 100%' };
 
  return (
    <div className={`relative overflow-hidden bg-[#EDF2EE] ${className}`}>
      <div className={`absolute inset-0 touch-none ${onPick ? 'cursor-crosshair' : 'cursor-grab'}`} onPointerDown={onPointerDown}>
        <div ref={layerRef} className="absolute inset-0" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})` }}>
          <MapArt />
          {LANDMARKS.map((l) => (
            <span key={l.name} className="pointer-events-none absolute -translate-x-1/2 text-[9px] font-semibold uppercase tracking-wide text-slate-400" style={{ left: `${l.x}%`, top: `${l.y}%` }}>
              {l.name}
            </span>
          ))}
          {markers.map((m) => (
            <button
              key={m.id}
              type="button"
              aria-label={m.label}
              aria-pressed={selectedId === m.id}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onSelect?.(m.id)}
              className={`absolute cursor-pointer ${focusRing} rounded ${selectedId === m.id ? 'z-20 drop-shadow-lg' : 'z-10'}`}
              style={{ left: `${m.pos.x}%`, top: `${m.pos.y}%`, ...counter }}
            >
              <Pin color={m.color} glyph={m.glyph} className={selectedId === m.id ? 'h-11 w-9' : 'h-9 w-7'} />
            </button>
          ))}
          {pin && (
            <span className="pointer-events-none absolute z-20" style={{ left: `${pin.x}%`, top: `${pin.y}%`, ...counter }}>
              <Pin color="#0D9488" glyph="●" className="h-11 w-9" />
            </span>
          )}
        </div>
      </div>
 
      <div className="absolute right-3 top-3 z-30 flex flex-col gap-2">
        <button type="button" aria-label="Zoom in" onClick={() => zoomBy(0.5)} className={ctrlBtn}><PlusIcon className="h-5 w-5" /></button>
        <button type="button" aria-label="Zoom out" onClick={() => zoomBy(-0.5)} className={ctrlBtn}><MinusIcon className="h-5 w-5" /></button>
        <button type="button" aria-label="Recenter map" onClick={() => setView({ zoom: 1, x: 0, y: 0 })} className={ctrlBtn}><LocateIcon className="h-5 w-5" /></button>
      </div>
 
      <p className="pointer-events-none absolute left-3 top-3 z-30 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-slate-600 shadow">
        Illustrative map · not real GPS
      </p>
      {children}
    </div>
  );
}