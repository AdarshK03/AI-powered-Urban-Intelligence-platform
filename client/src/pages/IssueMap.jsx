import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useIssues } from '../context/IssueContext';
import { useNav } from '../hooks/useCitizenNav';
import { SEVERITIES, RESOLVED_PIN, categoryById, filterIssues, pinStyle } from '../data/demoIssues';
import { ThumbUpIcon } from '../components/citizen/icons';
import IssuePhoto from '../assets/IssuePhotos';
import AppHeader from '../components/citizen/AppHeader';
import IssueFilters from '../components/citizen/IssueFilters';
import MockMap from '../components/citizen/MockMap';
import { SeverityBadge } from '../components/citizen/SeverityBadge';
import { focusRing } from '../components/citizen/ui';
 
const LEGEND = [
  { label: 'High', color: SEVERITIES.high.pin, glyph: '!' },
  { label: 'Medium', color: SEVERITIES.medium.pin, glyph: 'M' },
  { label: 'Low', color: SEVERITIES.low.pin, glyph: 'L' },
  { label: 'Resolved', color: RESOLVED_PIN, glyph: '✓' },
];
 
export default function IssueMap() {
  const { issues, city } = useIssues();
  const { navigate } = useNav();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({ category: searchParams.get('category') ?? 'all', severity: 'all', status: 'all' });
  const [selectedId, setSelectedId] = useState(null);
 
  const matching = useMemo(() => filterIssues(issues, { city, query, ...filters }), [issues, city, query, filters]);
  const onMap = matching.filter((i) => i.mapPos);
  const selected = onMap.find((i) => i.id === selectedId) ?? null;
 
  const markers = onMap.map((i) => ({
    id: i.id,
    pos: i.mapPos,
    ...pinStyle(i),
    label: `${i.title}, ${SEVERITIES[i.severity].label} severity, ${i.status === 'resolved' ? 'resolved' : 'open'}`,
  }));
 
  return (
    <div className="flex h-dvh flex-col">
      <AppHeader query={query} onQuery={setQuery} placeholder="Search location or issue..." />
      <IssueFilters filters={filters} onChange={setFilters} />
 
      <MockMap className="mb-16 flex-1 lg:mb-0" markers={markers} selectedId={selected?.id} onSelect={setSelectedId}>
        {selected && (
          <button
            type="button"
            onClick={() => navigate('issue', { id: selected.id })}
            className={`absolute inset-x-3 bottom-14 z-30 flex lg:right-auto lg:left-4 lg:w-96 cursor-pointer items-center gap-3 rounded-xl bg-white p-2 pr-3 text-left shadow-lg ${focusRing}`}
          >
            <IssuePhoto photo={selected.photos[0]} alt={`Photo of ${selected.title}`} className="h-14 w-16 shrink-0 rounded-lg" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-slate-900">{selected.title}</span>
              <span className="block truncate text-[11px] text-slate-500">{categoryById(selected.category).label} · Tap to open details</span>
              <span className="mt-1 flex items-center gap-2">
                <span className="flex items-center gap-1 text-xs font-semibold text-slate-700"><ThumbUpIcon className="h-3.5 w-3.5 text-teal-600" />{selected.supportCount} votes</span>
                <SeverityBadge severity={selected.severity} />
              </span>
            </span>
          </button>
        )}
 
        <p role="status" className="pointer-events-none absolute left-3 top-12 z-30 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-medium text-slate-600 shadow">
          {onMap.length} of {matching.length} issues on map
        </p>
 
        <ul className="pointer-events-none absolute inset-x-3 bottom-3 z-30 flex justify-around lg:right-auto lg:left-4 lg:w-96 rounded-full bg-white/95 px-3 py-2 shadow" aria-label="Map legend">
          {LEGEND.map((l) => (
            <li key={l.label} className="flex items-center gap-1.5 text-[11px] font-medium text-slate-700">
              <span className="flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white" style={{ background: l.color }}>{l.glyph}</span>
              {l.label}
            </li>
          ))}
        </ul>
 
        {onMap.length === 0 && (
          <p className="absolute inset-x-8 top-1/2 z-30 -translate-y-1/2 rounded-xl bg-white/95 p-4 text-center text-sm text-slate-600 shadow">
            No issues match these filters in {city}.
          </p>
        )}
      </MockMap>
    </div>
  );
}