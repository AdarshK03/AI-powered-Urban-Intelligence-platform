export const CITIES = ['New Delhi', 'Mumbai', 'Pune'];
 
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
    : { color: SEVERITIES[issue.severity].pin, glyph: SEVERITIES[issue.severity].glyph };
 
export function filterIssues(issues, { city, query = '', category = 'all', severity = 'all', status = 'all' } = {}) {
  const q = query.trim().toLowerCase();
  return issues.filter((i) => {
    if (city && i.city !== city) return false;
    if (category !== 'all' && i.category !== category) return false;
    if (severity !== 'all' && i.severity !== severity) return false;
    if (status === 'resolved' && i.status !== 'resolved') return false;
    if (status === 'open' && i.status === 'resolved') return false;
    if (q && !`${i.title} ${i.locationName} ${i.description} ${categoryById(i.category).label}`.toLowerCase().includes(q)) return false;
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
 
const now = Date.now();
const ago = (hours) => new Date(now - hours * 3600 * 1000).toISOString();
const t = (status, label, hours) => ({ status, label, at: ago(hours) });
 
export const DEMO_ISSUES = [
  {
    id: 'iss-001', referenceNumber: 'DEMO-001', city: 'New Delhi',
    title: 'Large pothole on MG Road',
    description: 'Deep pothole in the left lane near the junction. Two-wheelers are swerving into the next lane to avoid it.',
    category: 'pothole', severity: 'high', status: 'resolved',
    locationName: 'MG Road, New Delhi', latitude: null, longitude: null, mapPos: { x: 72, y: 60 },
    photos: [{ kind: 'pothole' }, { kind: 'road' }], supportCount: 128, similarCount: 5,
    reportedAt: ago(240), updatedAt: ago(2),
    timeline: [
      t('reported', 'Reported by citizen', 240), t('verified', 'Verified by authority', 216),
      t('assigned', 'Assigned to Public Works Department', 192), t('in_progress', 'Work in Progress', 144),
      t('resolved', 'Resolved', 2),
    ],
    beforeAfter: { before: { kind: 'pothole' }, after: { kind: 'repaired' } },
    comments: [
      { id: 'c1', author: 'Demo user A', text: 'This one almost caused an accident last week.', at: ago(230) },
      { id: 'c2', author: 'Demo user B', text: 'Thanks for the repair, the lane is smooth now.', at: ago(1) },
    ],
    isDemo: true, createdByUser: false,
  },
  {
    id: 'iss-002', referenceNumber: 'DEMO-002', city: 'New Delhi',
    title: 'Broken footpath',
    description: 'Several paving slabs are cracked and lifted, making the footpath unsafe for elderly pedestrians.',
    category: 'footpath', severity: 'medium', status: 'verified',
    locationName: 'Lajpat Nagar, New Delhi', latitude: null, longitude: null, mapPos: { x: 80, y: 73 },
    photos: [{ kind: 'footpath' }], supportCount: 87, similarCount: 2,
    reportedAt: ago(30), updatedAt: ago(5),
    timeline: [t('reported', 'Reported by citizen', 30), t('verified', 'Verified by authority', 5)],
    beforeAfter: null,
    comments: [{ id: 'c3', author: 'Demo user C', text: 'Slabs are loose near the bus stop too.', at: ago(20) }],
    isDemo: true, createdByUser: false,
  },
  {
    id: 'iss-003', referenceNumber: 'DEMO-003', city: 'New Delhi',
    title: 'Open drain near park entrance',
    description: 'Drain cover is missing next to the park gate. It is a hazard for children and cyclists.',
    category: 'drain', severity: 'high', status: 'assigned',
    locationName: 'Lodhi Road, New Delhi', latitude: null, longitude: null, mapPos: { x: 26, y: 46 },
    photos: [{ kind: 'drain' }], supportCount: 54, similarCount: 3,
    reportedAt: ago(70), updatedAt: ago(12),
    timeline: [
      t('reported', 'Reported by citizen', 70), t('verified', 'Verified by authority', 48),
      t('assigned', 'Assigned to Public Works Department', 12),
    ],
    beforeAfter: null, comments: [], isDemo: true, createdByUser: false,
  },
  {
    id: 'iss-004', referenceNumber: 'DEMO-004', city: 'New Delhi',
    title: 'Street light not working',
    description: 'Three consecutive street lights are off, leaving the stretch very dark after sunset.',
    category: 'light', severity: 'low', status: 'reported',
    locationName: 'Connaught Place, New Delhi', latitude: null, longitude: null, mapPos: { x: 44, y: 30 },
    photos: [{ kind: 'light' }], supportCount: 23, similarCount: 0,
    reportedAt: ago(8), updatedAt: ago(8),
    timeline: [t('reported', 'Reported by citizen', 8)],
    beforeAfter: null, comments: [], isDemo: true, createdByUser: false,
  },
  {
    id: 'iss-005', referenceNumber: 'DEMO-005', city: 'New Delhi',
    title: 'Water logging after rain',
    description: 'Water stays on the carriageway for hours after light rain; the drain inlet looks blocked.',
    category: 'water', severity: 'medium', status: 'in_progress',
    locationName: 'Ring Road near AIIMS, New Delhi', latitude: null, longitude: null, mapPos: { x: 52, y: 69 },
    photos: [{ kind: 'water' }], supportCount: 41, similarCount: 4,
    reportedAt: ago(100), updatedAt: ago(6),
    timeline: [
      t('reported', 'Reported by citizen', 100), t('verified', 'Verified by authority', 80),
      t('assigned', 'Assigned to Public Works Department', 60), t('in_progress', 'Work in Progress', 6),
    ],
    beforeAfter: null, comments: [], isDemo: true, createdByUser: false,
  },
  {
    id: 'iss-006', referenceNumber: 'DEMO-006', city: 'New Delhi',
    title: 'Cracked and sunken road surface',
    description: 'A long crack with a sunken section runs across the lane near the market.',
    category: 'road', severity: 'high', status: 'verified',
    locationName: 'Nizamuddin, New Delhi', latitude: null, longitude: null, mapPos: { x: 84, y: 50 },
    photos: [{ kind: 'road' }], supportCount: 62, similarCount: 1,
    reportedAt: ago(52), updatedAt: ago(20),
    timeline: [t('reported', 'Reported by citizen', 52), t('verified', 'Verified by authority', 20)],
    beforeAfter: null, comments: [], isDemo: true, createdByUser: false,
  },
  {
    id: 'iss-007', referenceNumber: 'DEMO-007', city: 'New Delhi',
    title: 'Traffic signal stuck on red',
    description: 'The signal stays red for the main road for several minutes, causing long queues.',
    category: 'signal', severity: 'medium', status: 'reported',
    locationName: 'Near India Gate, New Delhi', latitude: null, longitude: null, mapPos: { x: 87, y: 37 },
    photos: [{ kind: 'signal' }], supportCount: 34, similarCount: 0,
    reportedAt: ago(4), updatedAt: ago(4),
    timeline: [t('reported', 'Reported by citizen', 4)],
    beforeAfter: null, comments: [], isDemo: true, createdByUser: false,
  },
  {
    id: 'iss-008', referenceNumber: 'DEMO-008', city: 'New Delhi',
    title: 'Small pothole patched',
    description: 'Shallow pothole on the service lane. Repaired by the maintenance team.',
    category: 'pothole', severity: 'low', status: 'resolved',
    locationName: 'Hauz Khas, New Delhi', latitude: null, longitude: null, mapPos: { x: 60, y: 86 },
    photos: [{ kind: 'pothole' }], supportCount: 12, similarCount: 0,
    reportedAt: ago(300), updatedAt: ago(100),
    timeline: [
      t('reported', 'Reported by citizen', 300), t('verified', 'Verified by authority', 280),
      t('assigned', 'Assigned to Public Works Department', 250), t('resolved', 'Resolved', 100),
    ],
    beforeAfter: { before: { kind: 'pothole' }, after: { kind: 'repaired' } },
    comments: [], isDemo: true, createdByUser: false,
  },
];