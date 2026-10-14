export const CITIES = ['All Cities', 'New Delhi', 'Mumbai', 'Pune', 'Bengaluru', 'Hyderabad', 'Chennai'];

export const CATEGORIES = [
  { id: 'pothole', label: 'Pothole', bg: 'bg-amber-100', fg: 'text-amber-700' },
  { id: 'road', label: 'Broken Road', bg: 'bg-rose-100', fg: 'text-rose-600' },
  { id: 'drain', label: 'Open Drain', bg: 'bg-cyan-100', fg: 'text-cyan-700' },
  { id: 'light', label: 'Street Light', bg: 'bg-yellow-100', fg: 'text-yellow-600' },
  { id: 'signal', label: 'Traffic Signal', bg: 'bg-emerald-100', fg: 'text-emerald-700' },
  { id: 'footpath', label: 'Footpath', bg: 'bg-orange-100', fg: 'text-orange-600' },
  { id: 'water', label: 'Water Logging', bg: 'bg-sky-100', fg: 'text-sky-600' },
  { id: 'other', label: 'Others', bg: 'bg-purple-100', fg: 'text-purple-600' },
];

export const SEVERITIES = {
  high: { label: 'High', badge: 'bg-red-100 text-red-700 ring-red-200', solid: 'bg-red-600 text-white', btn: 'bg-red-600 text-white', pin: '#DC2626', glyph: '!' },
  medium: { label: 'Medium', badge: 'bg-amber-100 text-amber-800 ring-amber-200', solid: 'bg-amber-600 text-white', btn: 'bg-amber-100 text-amber-800', pin: '#F59E0B', glyph: 'M' },
  low: { label: 'Low', badge: 'bg-green-100 text-green-700 ring-green-200', solid: 'bg-green-700 text-white', btn: 'bg-green-100 text-green-700', pin: '#22C55E', glyph: 'L' },
};

export const STATUSES = {
  reported: 'Reported',
  verified: 'Verified',
  assigned: 'Assigned',
  in_progress: 'Work in Progress',
  resolved: 'Resolved',
};

export const RESOLVED_PIN = '#0F766E';

export const categoryById = (id) => CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];

/** Marker colour + glyph. Resolved issues use their own colour and a tick. */
export const pinStyle = (issue) =>
  issue.status === 'resolved'
    ? { color: RESOLVED_PIN, glyph: '✓' }
    : { color: SEVERITIES[issue.severity]?.pin || '#F59E0B', glyph: SEVERITIES[issue.severity]?.glyph || '!' };

export function filterIssues(issues, { city, query = '', category = 'all', severity = 'all', status = 'all' } = {}) {
  const q = query.trim().toLowerCase();
  return (issues || []).filter((i) => {
    if (city && city !== 'All Cities' && i.city && i.city.toLowerCase() !== city.toLowerCase()) return false;
    if (category !== 'all' && i.category !== category) return false;
    if (severity !== 'all' && i.severity !== severity) return false;
    if (status === 'resolved' && i.status !== 'resolved') return false;
    if (status === 'open' && i.status === 'resolved') return false;
    if (q && !`${i.title || ''} ${i.locationName || ''} ${i.description || ''} ${categoryById(i.category)?.label || ''}`.toLowerCase().includes(q)) return false;
    return true;
  });
}
 
export function timeAgo(iso) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'Just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? '' : 's'} ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d === 1 ? '' : 's'} ago`;
}
 
export function formatDateTime(iso) {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
  });
}
 
export const DEMO_ISSUES = [];