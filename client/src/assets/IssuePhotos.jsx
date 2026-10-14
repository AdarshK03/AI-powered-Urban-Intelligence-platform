const ASPHALT = (
  <>
    <defs>
      <linearGradient id="uip-asphalt" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#74777c" /><stop offset="1" stopColor="#4a4d52" />
      </linearGradient>
      <radialGradient id="uip-crater">
        <stop offset="0" stopColor="#25201d" /><stop offset=".7" stopColor="#483f39" /><stop offset="1" stopColor="#6a6058" />
      </radialGradient>
      <filter id="uip-noise"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="4" /><feColorMatrix type="saturate" values="0" /></filter>
    </defs>
    <rect width="400" height="300" fill="url(#uip-asphalt)" />
    <rect width="400" height="300" filter="url(#uip-noise)" opacity=".2" />
  </>
);
 
const Grass = () => (
  <>
    <path d="M0 0h400v48q-90 14-200 4T0 42z" fill="#5b8c4a" />
    <circle cx="60" cy="18" r="26" fill="#3f7a3f" /><circle cx="330" cy="14" r="30" fill="#4a8a47" /><circle cx="210" cy="8" r="22" fill="#3f7a3f" />
  </>
);
 
function Scene({ kind }) {
  switch (kind) {
    case 'pothole':
      return (
        <>
          {ASPHALT}<Grass />
          <path d="M70 150 150 128 245 135 330 165 345 205 290 245 190 255 105 238 62 195z" fill="#8a8077" />
          <path d="M92 158 160 140 240 146 312 170 322 202 276 232 192 240 118 226 84 196z" fill="url(#uip-crater)" />
          <path d="M130 170q40-12 70-4M210 205q40 8 80-8M120 205q30 14 60 10" stroke="#6a6058" strokeWidth="3" fill="none" opacity=".7" />
          <path d="M60 195 20 215M345 200l45 20M200 128l-6-40M290 245l30 40M110 238l-40 40" stroke="#33353a" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M0 285h400" stroke="#d9d9d4" strokeWidth="6" strokeDasharray="40 30" opacity=".8" />
        </>
      );
    case 'road':
      return (
        <>
          {ASPHALT}
          <path d="M0 90C90 110 120 70 210 120S330 150 400 130M200 0l-20 120 30 90-20 90" stroke="#26282c" strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M130 170 250 150 300 215 210 250 120 225z" fill="#2f3135" />
          <path d="M0 280h400" stroke="#d9d9d4" strokeWidth="6" strokeDasharray="40 30" opacity=".8" />
        </>
      );
    case 'repaired':
      return (
        <>
          <defs>
            <linearGradient id="uip-fresh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4b4e53" /><stop offset="1" stopColor="#35373b" /></linearGradient>
            <filter id="uip-noise2"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="9" /><feColorMatrix type="saturate" values="0" /></filter>
          </defs>
          <rect width="400" height="300" fill="url(#uip-fresh)" />
          <rect width="400" height="300" filter="url(#uip-noise2)" opacity=".12" />
          <Grass />
          <rect x="100" y="140" width="200" height="110" rx="14" fill="#2c2e32" />
          <path d="M0 285h400" stroke="#ececE6" strokeWidth="6" strokeDasharray="40 30" />
        </>
      );
    case 'footpath':
      return (
        <>
          <rect width="400" height="300" fill="#8e949b" />
          <path d="M0 0h400v50H0z" fill="#5b8c4a" />
          {[0, 1, 2, 3, 4].map((r) => [0, 1, 2, 3, 4, 5].map((c) => (
            <rect key={`${r}-${c}`} x={c * 70 - (r % 2) * 35 + 4} y={64 + r * 46} width="64" height="40" rx="2" fill={(r + c) % 3 === 0 ? '#b3b8bd' : '#a2a8ae'} />
          )))}
          <path d="M120 150 200 120 280 170 230 230 150 210z" fill="#4c4f55" />
          <path d="M60 110 130 160 90 230M300 90l40 80 40 40" stroke="#3a3d42" strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      );
    case 'drain':
      return (
        <>
          {ASPHALT}
          <rect y="170" width="400" height="30" fill="#b9bcc0" />
          <rect x="90" y="190" width="220" height="80" rx="6" fill="#1b1d20" />
          <rect x="100" y="204" width="200" height="56" fill="#26455a" opacity=".85" />
          <path d="M100 210h200M100 224h200M100 238h200" stroke="#15161a" strokeWidth="3" opacity=".5" />
          <path d="M0 0h400v70H0z" fill="#5b8c4a" opacity=".85" />
        </>
      );
    case 'water':
      return (
        <>
          {ASPHALT}
          <ellipse cx="200" cy="190" rx="170" ry="60" fill="#7fa3b8" opacity=".9" />
          <ellipse cx="200" cy="185" rx="130" ry="36" fill="#a9c5d4" opacity=".6" />
          <path d="M0 40h400" stroke="#d9d9d4" strokeWidth="5" strokeDasharray="40 30" opacity=".6" />
        </>
      );
    case 'light':
      return (
        <>
          <defs><linearGradient id="uip-dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1e2a4a" /><stop offset="1" stopColor="#6b7a99" /></linearGradient></defs>
          <rect width="400" height="300" fill="url(#uip-dusk)" />
          <rect y="230" width="400" height="70" fill="#3d4047" />
          <rect x="196" y="40" width="8" height="195" fill="#20232a" />
          <path d="M200 44h60" stroke="#20232a" strokeWidth="8" strokeLinecap="round" />
          <rect x="250" y="40" width="26" height="12" rx="4" fill="#4a4f5a" />
        </>
      );
    case 'signal':
      return (
        <>
          <rect width="400" height="300" fill="#9fb3c4" />
          <rect y="235" width="400" height="65" fill="#4b4e53" />
          <rect x="196" y="60" width="8" height="180" fill="#2a2d33" />
          <rect x="168" y="30" width="64" height="104" rx="12" fill="#1f2228" />
          <circle cx="200" cy="55" r="15" fill="#e53935" /><circle cx="200" cy="82" r="15" fill="#3a3d44" /><circle cx="200" cy="109" r="15" fill="#3a3d44" />
        </>
      );
    default:
      return (<>{ASPHALT}<path d="M0 150C100 130 160 190 400 160" stroke="#2a2c30" strokeWidth="5" fill="none" /></>);
  }
}
 
export default function IssuePhoto({ photo, alt, className = '' }) {
  const src = typeof photo === 'string' ? photo : (photo?.url || photo?.dataUrl);
  if (src) {
    return (
      <img
        src={src}
        alt={alt || 'Reported road issue photo'}
        className={`object-cover ${className}`}
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.style.display = 'none';
          if (e.currentTarget.parentElement) {
            e.currentTarget.parentElement.classList.add('bg-slate-200');
          }
        }}
      />
    );
  }
  return (
    <div className={`flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-2 text-center ${className}`}>
      <span className="text-[11px] font-medium">No photo available</span>
    </div>
  );
}