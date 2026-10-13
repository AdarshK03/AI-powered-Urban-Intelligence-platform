import IssuePhoto from '../../assets/IssuePhotos';
import { PinIcon, ThumbUpIcon } from './icons';
import { timeAgo } from '../../data/demoIssues';
import { SeverityBadge, StatusBadge } from './SeverityBadge';
import { focusRing } from './ui';
 
// Clickable issue summary. `layout="row"` is used in My Reports.
export default function IssueCard({ issue, onOpen, layout = 'card' }) {
  const row = layout === 'row';
  return (
    <button
      type="button"
      onClick={() => onOpen(issue.id)}
      className={`block w-full cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm transition hover:shadow-md ${row ? 'flex gap-3 p-2' : ''} ${focusRing}`}
    >
      <IssuePhoto
        photo={issue.photos[0]}
        alt={`Photo of ${issue.title}`}
        className={row ? 'h-20 w-24 shrink-0 rounded-lg' : 'h-28 w-full'}
      />
      <span className={`block ${row ? 'min-w-0 flex-1' : 'p-3'}`}>
        <span className="block truncate text-sm font-bold text-slate-900">{issue.title}</span>
        <span className="mt-1 flex items-center gap-1 text-xs text-slate-500">
          <PinIcon className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{issue.locationName}</span>
        </span>
        <span className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="flex items-center gap-1 text-xs font-semibold text-slate-700">
            <ThumbUpIcon className="h-3.5 w-3.5 text-teal-600" />
            {issue.supportCount} votes
          </span>
          <SeverityBadge severity={issue.severity} />
          {row && <StatusBadge status={issue.status} />}
        </span>
        <span className="mt-1.5 block text-[11px] text-slate-500">Updated {timeAgo(issue.updatedAt)}</span>
      </span>
    </button>
  );
}