import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useIssues } from '../context/IssueContext';
import { useNav } from '../hooks/useCitizenNav';
import { SEVERITIES, RESOLVED_PIN, categoryById, filterIssues } from '../data/demoIssues';
import { ThumbUpIcon, CameraIcon } from '../components/citizen/icons';
import IssuePhoto from '../assets/IssuePhotos';
import AppHeader from '../components/citizen/AppHeader';
import IssueFilters from '../components/citizen/IssueFilters';
import GoogleMapView from '../components/common/GoogleMapView';
import { SeverityBadge } from '../components/citizen/SeverityBadge';
import { focusRing } from '../components/citizen/ui';

const LEGEND = [
  { label: 'High', color: '#DC2626', glyph: '!' },
  { label: 'Medium', color: '#F59E0B', glyph: 'M' },
  { label: 'Low', color: '#22C55E', glyph: 'L' },
  { label: 'Resolved', color: '#0F766E', glyph: '✓' },
];

export default function IssueMap() {
  const { issues, city } = useIssues();
  const { navigate } = useNav();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({
    category: searchParams.get('category') ?? 'all',
    severity: 'all',
    status: 'all',
  });
  const [selectedId, setSelectedId] = useState(null);

  const matching = useMemo(
    () => filterIssues(issues, { city, query, ...filters }),
    [issues, city, query, filters]
  );

  // Issues with valid geographic coordinates
  const onMap = matching.filter(
    (i) => i.latitude !== null && i.longitude !== null && !isNaN(parseFloat(i.latitude)) && !isNaN(parseFloat(i.longitude))
  );

  const selected = onMap.find((i) => i.id === selectedId) ?? (onMap.length > 0 ? onMap[0] : null);

  const mapMarkers = onMap.map((i) => ({
    id: i.id,
    lat: parseFloat(i.latitude),
    lng: parseFloat(i.longitude),
    title: i.title,
    severity: i.severity,
    category: categoryById(i.category)?.label,
    status: i.status,
    locationName: i.locationName,
  }));

  // Map center defaults to selected issue or first issue or Delhi
  const mapCenter = selected
    ? { lat: parseFloat(selected.latitude), lng: parseFloat(selected.longitude) }
    : onMap.length > 0
    ? { lat: parseFloat(onMap[0].latitude), lng: parseFloat(onMap[0].longitude) }
    : { lat: 28.6139, lng: 77.2090 };

  return (
    <div className="flex h-dvh flex-col bg-slate-50">
      <AppHeader query={query} onQuery={setQuery} placeholder="Search location or civic issue..." />
      <IssueFilters filters={filters} onChange={setFilters} />

      <div className="relative mb-16 flex-1 lg:mb-0">
        <GoogleMapView
          center={mapCenter}
          zoom={onMap.length > 0 ? 14 : 12}
          markers={mapMarkers}
          selectedMarkerId={selected?.id}
          onMarkerClick={(id) => setSelectedId(id)}
          height="100%"
          className="h-full w-full rounded-none border-0"
        >
          {/* Selected Issue Preview Card */}
          {selected && (
            <button
              type="button"
              onClick={() => navigate('issue', { id: selected.id })}
              className={`absolute inset-x-3 bottom-14 z-30 flex lg:right-auto lg:left-4 lg:w-96 cursor-pointer items-center gap-3 rounded-2xl bg-white/95 backdrop-blur-md p-3 text-left shadow-xl border border-slate-200/80 ${focusRing}`}
            >
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100 border border-slate-200">
                <IssuePhoto
                  photo={selected.photos?.[0]}
                  alt={`Photo of ${selected.title}`}
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-slate-900">{selected.title}</span>
                <span className="block truncate text-[11px] text-slate-500">
                  {selected.locationName || `${categoryById(selected.category)?.label}`} · Tap for details
                </span>
                <span className="mt-1 flex items-center gap-2">
                  <span className="flex items-center gap-1 text-xs font-semibold text-slate-700">
                    <ThumbUpIcon className="h-3.5 w-3.5 text-teal-600" />
                    {selected.supportCount} votes
                  </span>
                  <SeverityBadge severity={selected.severity} />
                </span>
              </span>
            </button>
          )}

          {/* Map Issue Counter Badge */}
          <div className="pointer-events-none absolute left-3 top-14 z-20 rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold text-slate-700 shadow-md border border-slate-200">
            {onMap.length} live issues on Google Maps
          </div>

          {/* Map Legend */}
          <ul
            className="pointer-events-none absolute inset-x-3 bottom-3 z-20 flex justify-around lg:right-auto lg:left-4 lg:w-96 rounded-full bg-white/95 px-3 py-2 shadow-md border border-slate-200"
            aria-label="Map legend"
          >
            {LEGEND.map((l) => (
              <li key={l.label} className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
                <span
                  className="flex h-3.5 w-3.5 items-center justify-center rounded-full text-[9px] font-bold text-white shadow-xs"
                  style={{ background: l.color }}
                >
                  {l.glyph}
                </span>
                {l.label}
              </li>
            ))}
          </ul>

          {/* Empty state when no issues on map */}
          {onMap.length === 0 && (
            <div className="absolute inset-x-6 top-1/2 z-20 -translate-y-1/2 rounded-2xl bg-white/95 p-6 text-center shadow-xl border border-slate-200 backdrop-blur max-w-md mx-auto">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-teal-700 mb-3">
                <CameraIcon className="h-6 w-6" />
              </span>
              <p className="font-bold text-slate-900 text-sm">No Live Issues Reported Yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Data comes exclusively from live citizen reports. Upload a photo and mark the location to register the first issue.
              </p>
              <button
                type="button"
                onClick={() => navigate('report')}
                className="mt-4 cursor-pointer rounded-xl bg-teal-700 px-4 py-2 text-xs font-bold text-white hover:bg-teal-800 shadow"
              >
                Report a Road Issue
              </button>
            </div>
          )}
        </GoogleMapView>
      </div>
    </div>
  );
}