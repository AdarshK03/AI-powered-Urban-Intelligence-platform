import { useState } from 'react';
import { useIssues } from '../context/IssueContext';
import { useNav } from '../hooks/useCitizenNav';
import { useAuth } from '../context/AuthContext';
import IssueCard from '../components/citizen/IssueCard';
import { TrashIcon } from '../components/citizen/icons';
import { btnPrimary } from '../components/citizen/ui';

export default function MyReports() {
  const { issues, deleteIssue } = useIssues();
  const { navigate } = useNav();
  const { user } = useAuth();
  const [issueToDelete, setIssueToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const mine = issues.filter((i) => Boolean(user?.id && (i.reporterId === user.id || String(i.reporterId) === String(user.id))));

  const handleDelete = async () => {
    if (!issueToDelete) return;
    try {
      setIsDeleting(true);
      setDeleteError('');
      await deleteIssue(issueToDelete.id);
      setIssueToDelete(null);
    } catch (err) {
      setDeleteError(err.message || 'Failed to remove report.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="px-4 pb-28 pt-6 lg:pb-10 lg:pt-8">
      <h1 className="text-xl font-bold text-slate-900">My Reports</h1>
      <p className="mt-1 text-xs text-slate-500">
        Civic road issues registered under your account, tracked in the central PostgreSQL registry.
      </p>

      {deleteError && (
        <div className="mt-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700">
          {deleteError}
        </div>
      )}

      {mine.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-6 text-center">
          <p className="text-sm text-slate-600">You haven't reported any road infrastructure issues yet.</p>
          <div className="mx-auto mt-4 max-w-xs">
            <button type="button" className={btnPrimary} onClick={() => navigate('report')}>
              Report an issue now
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {mine.map((i) => (
            <div key={i.id} className="relative group">
              <IssueCard issue={i} layout="row" onOpen={(id) => navigate('issue', { id })} />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIssueToDelete(i);
                }}
                title="Remove this report"
                aria-label={`Remove report ${i.title}`}
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 opacity-90 hover:opacity-100 hover:bg-rose-100 active:bg-rose-200 transition-all border border-rose-200 shadow-sm cursor-pointer"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {issueToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 mx-auto">
              <TrashIcon className="h-6 w-6" />
            </div>
            <div className="text-center">
              <h3 id="dialog-title" className="text-lg font-bold text-slate-900">
                Remove Report?
              </h3>
              <p className="mt-1 text-xs text-slate-600">
                Are you sure you want to permanently delete <span className="font-semibold text-slate-800">"{issueToDelete.title}"</span> (<span className="font-mono">{issueToDelete.referenceNumber}</span>)?
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIssueToDelete(null)}
                disabled={isDeleting}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 rounded-xl bg-rose-600 py-2.5 text-xs font-semibold text-white hover:bg-rose-700 active:bg-rose-800 disabled:opacity-60 cursor-pointer shadow-sm"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}