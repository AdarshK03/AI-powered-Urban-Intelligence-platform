import { useMemo, useState } from 'react';
import { useIssues } from '../context/IssueContext';
import { useNav } from '../hooks/useCitizenNav';
import { useAuth } from '../context/AuthContext';
import { filterIssues } from '../data/demoIssues';
import { ArrowRightIcon, CameraIcon } from '../components/citizen/icons';
import AppHeader from '../components/citizen/AppHeader';
import CategoryGrid from '../components/citizen/CategoryGrid';
import IssueCard from '../components/citizen/IssueCard';
import { focusRing } from '../components/citizen/ui';
 
export default function CitizenHome() {
  const { issues, city } = useIssues();
  const { navigate } = useNav();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
 
  const trending = useMemo(
    () => [...filterIssues(issues, { city, query })].sort((a, b) => b.supportCount - a.supportCount),
    [issues, city, query],
  );
  const shown = showAll || query ? trending : trending.slice(0, 4);
 
  return (
    <div className="pb-28 lg:pb-10">
      <AppHeader query={query} onQuery={setQuery} placeholder="Search for issues, locations..." />
 
      <p className="px-4 pb-2 text-sm font-semibold text-slate-900">Hello, {user?.name?.split(' ')[0] ?? 'there'}</p>
      <p className="mx-4 mb-2 rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
        Issues shown here are demo data. Reports are not sent to a municipality yet and are cleared when you refresh.
      </p>
 
      <CategoryGrid onSelect={(category) => navigate('map', { category })} />
 
      <button
        type="button"
        onClick={() => navigate('report')}
        className={`mx-4 mt-3 flex w-[calc(100%-2rem)] cursor-pointer items-center gap-3 rounded-2xl bg-teal-700 p-4 text-left text-white shadow-md transition hover:bg-teal-800 ${focusRing}`}
      >
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/15"><CameraIcon className="h-7 w-7" /></span>
        <span className="flex-1">
          <span className="block text-base font-bold">Report a Road Issue</span>
          <span className="block text-xs text-teal-50">Take a photo and help improve your city</span>
        </span>
        <ArrowRightIcon className="h-6 w-6 shrink-0" />
      </button>
 
      <section className="mt-6 px-4" aria-labelledby="trending-title">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="trending-title" className="text-lg font-bold text-slate-900">{query ? 'Search results' : 'Trending Issues'}</h2>
          {!query && trending.length > 4 && (
            <button type="button" onClick={() => setShowAll((s) => !s)} className={`cursor-pointer rounded text-sm font-semibold text-teal-700 ${focusRing}`}>
              {showAll ? 'Show less' : 'See All'}
            </button>
          )}
        </div>
        {shown.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
            {query ? `No issues match "${query}".` : `No demo issues in ${city} yet.`}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {shown.map((issue) => <IssueCard key={issue.id} issue={issue} onOpen={(id) => navigate('issue', { id })} />)}
          </div>
        )}
      </section>
    </div>
  );
}