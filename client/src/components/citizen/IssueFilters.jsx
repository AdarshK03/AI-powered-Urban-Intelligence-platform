import { CATEGORIES, SEVERITIES } from '../../data/demoIssues';
import { focusRing } from './ui';
 
const selectCls = `cursor-pointer rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 ${focusRing}`;
 
// Category / severity / status filters. `filters` = { category, severity, status }
export default function IssueFilters({ filters, onChange }) {
  const set = (key) => (e) => onChange({ ...filters, [key]: e.target.value });
  const active = filters.category !== 'all' || filters.severity !== 'all' || filters.status !== 'all';
  return (
    <div className="flex items-center gap-2 overflow-x-auto px-4 pb-3" role="group" aria-label="Filter issues">
      <label className="sr-only" htmlFor="f-category">Category</label>
      <select id="f-category" value={filters.category} onChange={set('category')} className={selectCls}>
        <option value="all">All categories</option>
        {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
      </select>
      <label className="sr-only" htmlFor="f-severity">Severity</label>
      <select id="f-severity" value={filters.severity} onChange={set('severity')} className={selectCls}>
        <option value="all">All severities</option>
        {Object.entries(SEVERITIES).map(([id, s]) => <option key={id} value={id}>{s.label}</option>)}
      </select>
      <label className="sr-only" htmlFor="f-status">Status</label>
      <select id="f-status" value={filters.status} onChange={set('status')} className={selectCls}>
        <option value="all">Open + resolved</option>
        <option value="open">Open only</option>
        <option value="resolved">Resolved only</option>
      </select>
      {active && (
        <button type="button" onClick={() => onChange({ category: 'all', severity: 'all', status: 'all' })} className={`shrink-0 cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-50 ${focusRing}`}>
          Reset
        </button>
      )}
    </div>
  );
}