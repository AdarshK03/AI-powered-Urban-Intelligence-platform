import { useIssues } from '../context/IssueContext';
import { useNav } from '../hooks/useCitizenNav';
import { useAuth } from '../context/AuthContext';
import IssueCard from '../components/citizen/IssueCard';
import { btnPrimary } from '../components/citizen/ui';
 
// Lightweight placeholder: lists only reports created in this browser session.
export default function MyReports() {
  const { issues } = useIssues();
  const { navigate } = useNav();
  const { user } = useAuth();
  const mine = issues.filter((i) => i.createdByUser && i.reporterId === user?.id);
  return (
    <div className="px-4 pb-28 pt-6 lg:pb-10 lg:pt-8">
      <h1 className="text-xl font-bold text-slate-900">My Reports</h1>
      <p className="mt-1 text-xs text-slate-500">Reports you create in this browser session. Issue storage in the backend is not built yet, so they are cleared when you refresh.</p>
      {mine.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-6 text-center">
          <p className="text-sm text-slate-600">You haven't reported anything yet.</p>
          <div className="mx-auto mt-4 max-w-xs"><button type="button" className={btnPrimary} onClick={() => navigate('report')}>Report an issue</button></div>
        </div>
      ) : (
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {mine.map((i) => <IssueCard key={i.id} issue={i} layout="row" onOpen={(id) => navigate('issue', { id })} />)}
        </div>
      )}
    </div>
  );
}