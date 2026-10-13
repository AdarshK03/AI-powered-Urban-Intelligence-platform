export default function CategoryIcon({ id, className = 'h-6 w-6' }) {
  const common = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, className };
  switch (id) {
    case 'pothole': return <svg {...common}><path d="M3 18h18M5 18a7 7 0 0 1 14 0M9 14.5h6" /></svg>;
    case 'road': return <svg {...common}><path d="M8 3 4 21M16 3l4 18M12 5v3M12 11v3M12 17v3" /></svg>;
    case 'drain': return <svg {...common}><path d="M3 10h18a9 9 0 0 1-18 0zM8 6h8" /></svg>;
    case 'light': return <svg {...common}><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z" /></svg>;
    case 'signal': return <svg {...common}><rect x="8" y="2" width="8" height="20" rx="3" /><path d="M12 7h.01M12 12h.01M12 17h.01" /></svg>;
    case 'footpath': return <svg {...common}><path d="M12 3 6 19h12zM8.5 13h7M10 8h4M4 21h16" /></svg>;
    case 'water': return <svg {...common}><path d="M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11z" /></svg>;
    default: return <svg {...common}><circle cx="6" cy="12" r="1.5" fill="currentColor" /><circle cx="12" cy="12" r="1.5" fill="currentColor" /><circle cx="18" cy="12" r="1.5" fill="currentColor" /></svg>;
  }
}