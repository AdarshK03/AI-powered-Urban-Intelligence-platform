import { SEVERITIES, STATUSES } from '../../data/demoIssues';
 
// Severity is always shown as text, so colour is never the only signal.
export function SeverityBadge({ severity }) {
  const s = SEVERITIES[severity];
  return <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${s.badge}`}>{s.label}</span>;
}
 
export function StatusBadge({ status }) {
  const resolved = status === 'resolved';
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${resolved ? 'bg-teal-50 text-teal-800 ring-teal-200' : 'bg-slate-100 text-slate-700 ring-slate-200'}`}>
      {STATUSES[status]}
    </span>
  );
}
 