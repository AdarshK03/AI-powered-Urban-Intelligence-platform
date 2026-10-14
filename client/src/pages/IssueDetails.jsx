import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useIssues } from '../context/IssueContext';
import { useAuth } from '../context/AuthContext';
import { useNav } from '../hooks/useCitizenNav';
import { SEVERITIES, categoryById, formatDateTime } from '../data/demoIssues';
import IssuePhoto from '../assets/IssuePhotos';
import {
  ArrowLeftIcon,
  CheckIcon,
  ClockIcon,
  FileIcon,
  PinIcon,
  ShareIcon,
  ShieldAlertIcon,
  ThumbUpIcon,
  ThumbDownIcon,
  TrashIcon,
  UserIcon,
  UsersIcon,
} from '../components/citizen/icons';
import { StatusBadge } from '../components/citizen/SeverityBadge';
import GoogleMapView from '../components/common/GoogleMapView';
import { btnPrimary, errorCls, focusRing, inputBad, inputCls, inputOk } from '../components/citizen/ui';

const STATUS_ICONS = { reported: UserIcon, verified: CheckIcon, assigned: FileIcon, in_progress: ClockIcon, resolved: CheckIcon };
const TABS = [['timeline', 'Timeline'], ['details', 'Details'], ['comments', 'Comments']];

export default function IssueDetails() {
  const { id } = useParams();
  return <IssueDetailsView key={id} id={id} />;
}

function IssueDetailsView({ id }) {
  const { back, navigate } = useNav();
  const { user } = useAuth();
  const { getIssue, supportIssue, getUserVote, deleteIssue, addComment } = useIssues();
  const issueFromContext = getIssue(id);
  const [fetchedIssue, setFetchedIssue] = useState(null);
  const [loading, setLoading] = useState(!issueFromContext);
  const [tab, setTab] = useState('timeline');
  const [heroIndex, setHeroIndex] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [commentError, setCommentError] = useState('');
  const [shareMsg, setShareMsg] = useState('');
  const [voteError, setVoteError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!issueFromContext && id) {
      setLoading(true);
      fetch(`/api/issues/${encodeURIComponent(id)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.success && data.issue) {
            setFetchedIssue(data.issue);
          }
        })
        .catch((err) => console.error('Error fetching issue:', err))
        .finally(() => setLoading(false));
    }
  }, [id, issueFromContext]);

  const issue = issueFromContext || fetchedIssue;

  if (loading) {
    return (
      <div className="px-4 py-16 text-center">
        <p className="text-sm font-semibold text-slate-700 animate-pulse">Loading report details...</p>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="px-4 py-16 text-center">
        <p className="text-sm text-slate-600">This civic issue could not be found in the database.</p>
        <div className="mx-auto mt-4 max-w-xs"><button type="button" className={btnPrimary} onClick={back}>Go back</button></div>
      </div>
    );
  }
 
  const sev = SEVERITIES[issue.severity];
  const cat = categoryById(issue.category);
  const userCity = user?.city || 'Pune';
  const issueCity = issue.city || 'Pune';
  const isDifferentCity = Boolean(
    userCity &&
    issueCity &&
    issueCity.toLowerCase() !== 'all cities' &&
    issueCity.toLowerCase() !== userCity.toLowerCase()
  );
  const isOwner = Boolean(
    user?.id &&
      (issue.reporterId === user.id ||
        issue.reporter_id === user.id ||
        issue.userId === user.id ||
        String(issue.reporterId) === String(user.id))
  );
  const currentVote = getUserVote(issue.id);

  const handleVote = async (voteType) => {
    if (isOwner) {
      setVoteError('You cannot vote on your own reported issue.');
      return;
    }
    if (isDifferentCity) {
      setVoteError(`Voting is restricted to residents of ${issueCity}. Your registered city is ${userCity}.`);
      return;
    }
    try {
      setVoteError('');
      await supportIssue(issue.id, voteType);
    } catch (err) {
      setVoteError(err.message || 'Unable to register vote.');
    }
  };

  const handleDeleteReport = async () => {
    try {
      setIsDeleting(true);
      setVoteError('');
      await deleteIssue(issue.id);
      setShowDeleteModal(false);
      navigate('myreports', {}, { replace: true });
    } catch (err) {
      setVoteError(err.message || 'Failed to remove report.');
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const share = async () => {
    const text = `${issue.title} (${issue.referenceNumber}) on Urban Intelligence Platform`;
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: issue.title, text, url });
      else {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        setShareMsg('Issue link and summary copied to clipboard!');
        setTimeout(() => setShareMsg(''), 4000);
      }
    } catch {
      setShareMsg('Sharing was cancelled or not supported.');
    }
  };

  const postComment = async (e) => {
    e.preventDefault();
    const text = commentText.trim();
    if (!text) { setCommentError('Write a comment before posting.'); return; }
    if (text.length > 300) { setCommentError('Comments must be 300 characters or fewer.'); return; }
    await addComment(issue.id, text);
    setCommentText('');
    setCommentError('');
  };

  return (
    <div className="pb-32 lg:grid lg:grid-cols-2 lg:items-start lg:gap-8 lg:p-8 lg:pb-10">
      <div>
      <div className="relative lg:overflow-hidden lg:rounded-2xl">
        <IssuePhoto photo={issue.photos[heroIndex]} alt={`Photo ${heroIndex + 1} of ${issue.title}`} className="h-56 w-full sm:h-72 lg:h-96" />
        <button type="button" onClick={back} aria-label="Go back" className={`absolute left-3 top-3 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/90 text-slate-800 shadow hover:bg-white ${focusRing}`}>
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        {issue.photos.length > 1 && (
          <div className="absolute bottom-2 right-2 flex gap-1.5">
            {issue.photos.map((p, i) => (
              <button key={i} type="button" onClick={() => setHeroIndex(i)} aria-label={`Show photo ${i + 1}`} aria-pressed={heroIndex === i} className={`cursor-pointer overflow-hidden rounded-md border-2 ${heroIndex === i ? 'border-white' : 'border-transparent opacity-80'} ${focusRing}`}>
                <IssuePhoto photo={p} alt="" className="h-10 w-12" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 pt-3 lg:px-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold ${sev.solid}`}>
            <ShieldAlertIcon className="h-3.5 w-3.5" />{sev.label} Priority
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-cyan-50 px-2.5 py-1 text-xs font-bold text-cyan-800 border border-cyan-200">
            📍 {issueCity}
          </span>
          {isOwner && (
            <span className="inline-flex items-center gap-1 rounded-md bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-800 border border-teal-200">
              <UserIcon className="h-3.5 w-3.5" />Your Reported Issue
            </span>
          )}
        </div>
        <h1 className="mt-2 text-xl font-bold text-slate-900">{issue.title}</h1>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600"><PinIcon className="h-4 w-4 shrink-0 text-teal-700" />{issue.locationName}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-700">
          <span className="flex items-center gap-1.5 font-semibold"><ThumbUpIcon className="h-4 w-4 text-teal-600" />{issue.supportCount} votes</span>
          {issue.similarCount > 0 && <span className="flex items-center gap-1.5"><UsersIcon className="h-4 w-4 text-teal-600" />{issue.similarCount} people reported</span>}
          <StatusBadge status={issue.status} />
        </div>
        <p className="mt-2 text-xs text-slate-500">Reported on: {formatDateTime(issue.reportedAt)}</p>
      </div>

      </div>

      <div>
      <div className="mt-4 px-4 lg:mt-0 lg:px-0">
        <div role="tablist" aria-label="Issue information" className="flex border-b border-slate-200">
          {TABS.map(([id, label]) => (
            <button key={id} role="tab" id={`tab-${id}`} aria-selected={tab === id} aria-controls={`panel-${id}`} type="button" onClick={() => setTab(id)} className={`flex-1 cursor-pointer border-b-2 py-2.5 text-sm font-semibold ${tab === id ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-500 hover:text-slate-700'} ${focusRing}`}>
              {label}{id === 'comments' ? ` (${issue.comments?.length || 0})` : ''}
            </button>
          ))}
        </div>

        {tab === 'timeline' && (
          <div role="tabpanel" id="panel-timeline" aria-labelledby="tab-timeline" className="py-4">
            <ol>
              {issue.timeline?.map((t, i) => {
                const Icon = STATUS_ICONS[t.status] ?? ClockIcon;
                const last = i === issue.timeline.length - 1;
                return (
                  <li key={t.status} className="relative flex gap-3 pb-5 last:pb-0">
                    {!last && <span aria-hidden="true" className="absolute left-[17px] top-9 h-[calc(100%-2.25rem)] w-0.5 bg-teal-200" />}
                    <span className={`z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${t.status === 'resolved' ? 'bg-green-500 text-white' : 'bg-teal-100 text-teal-700'}`}><Icon className="h-4 w-4" /></span>
                    <div>
                      <p className={`text-sm font-semibold ${t.status === 'resolved' ? 'text-green-700' : 'text-slate-900'}`}>{t.label}</p>
                      <p className="text-xs text-slate-500">{formatDateTime(t.at)}</p>
                      {t.status === 'reported' && issue.photos?.length > 0 && (
                        <button type="button" onClick={() => { setHeroIndex(0); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className={`mt-1 cursor-pointer rounded bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-700 ${focusRing}`}>View Image</button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
            {issue.timeline?.length === 1 && <p className="mt-4 text-xs text-slate-500">No further updates yet. Verification, assignment and repair steps appear here when they happen.</p>}
          </div>
        )}

        {tab === 'details' && (
          <div role="tabpanel" id="panel-details" aria-labelledby="tab-details" className="py-4 space-y-4">
            <dl className="space-y-3 text-sm">
              {[
                ['Description', issue.description || 'No description provided.'],
                ['Category', cat.label],
                ['Location', issue.locationName],
                ['Severity', sev.label],
                ['Status', <StatusBadge key="s" status={issue.status} />],
                ['Report reference', <span key="r" className="font-mono">{issue.referenceNumber}</span>],
                ['Last updated', formatDateTime(issue.updatedAt)],
                ...(issue.latitude != null ? [['GPS coordinates', `${issue.latitude}, ${issue.longitude}`]] : []),
              ].map(([k, v]) => (
                <div key={k} className="flex gap-3"><dt className="w-32 shrink-0 text-slate-500">{k}</dt><dd className="min-w-0 flex-1 text-slate-900">{v}</dd></div>
              ))}
            </dl>

            {issue.latitude != null && issue.longitude != null && (
              <div className="mt-4">
                <p className="text-xs font-bold text-slate-700 mb-2">Google Maps Hazard Pin</p>
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <GoogleMapView
                    pin={{ lat: parseFloat(issue.latitude), lng: parseFloat(issue.longitude) }}
                    center={{ lat: parseFloat(issue.latitude), lng: parseFloat(issue.longitude) }}
                    zoom={16}
                    height="200px"
                    interactive={false}
                    showControls={false}
                  />
                </div>
              </div>
            )}
          </div>
        )}
 
        {tab === 'comments' && (
          <div role="tabpanel" id="panel-comments" aria-labelledby="tab-comments" className="py-4">
            {issue.comments.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">No comments yet. Be the first to add one.</p>
            ) : (
              <ul className="space-y-3">
                {issue.comments.map((c) => (
                  <li key={c.id} className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs font-semibold text-slate-800">{c.author} <span className="font-normal text-slate-400">· {formatDateTime(c.at)}</span></p>
                    <p className="mt-1 text-sm text-slate-700">{c.text}</p>
                  </li>
                ))}
              </ul>
            )}
            <form onSubmit={postComment} noValidate className="mt-4">
              <label htmlFor="comment" className="mb-1.5 block text-sm font-semibold text-slate-900">Add a comment</label>
              <textarea id="comment" rows={3} value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Share an update or extra detail..." className={`${inputCls} ${commentError ? inputBad : inputOk} resize-none`} />
              {commentError && <p role="alert" className={errorCls}>{commentError}</p>}
              <div className="mt-2"><button type="submit" className={btnPrimary}>Post comment</button></div>
              <p className="mt-2 text-[11px] text-slate-500">Comments are recorded in the public issue registry.</p>
            </form>
          </div>
        )}
      </div>
 
      <section className="mt-2 px-4 lg:px-0" aria-labelledby="evidence-title">
        <h2 id="evidence-title" className="text-sm font-bold text-slate-900">Resolution evidence</h2>
        {issue.beforeAfter ? (
          <div className="mt-2 grid grid-cols-2 gap-2">
            {[['Before', issue.beforeAfter.before], ['After', issue.beforeAfter.after]].map(([label, photo]) => (
              <figure key={label} className="relative overflow-hidden rounded-xl">
                <IssuePhoto photo={photo} alt={`${label} repair photo`} className="h-28 w-full" />
                <figcaption className="absolute bottom-1.5 left-1.5 rounded bg-slate-900/75 px-2 py-0.5 text-[11px] font-semibold text-white">{label}</figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <p className="mt-2 rounded-xl border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500">No before/after photos yet. They appear here once repair evidence is added.</p>
        )}
      </section>
 
      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-md border-t border-slate-200 bg-white px-4 pb-3 pt-3 md:max-w-2xl lg:static lg:z-auto lg:mx-0 lg:mt-6 lg:max-w-none lg:border-0 lg:px-0 lg:pb-0 lg:pt-0">
        {voteError && (
          <p role="alert" className="mb-2 text-center text-xs font-semibold text-rose-600">
            {voteError}
          </p>
        )}
        <div className="flex gap-2">
          {isOwner ? (
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              disabled={isDeleting}
              aria-label="Remove this reported issue"
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 active:bg-rose-800 disabled:opacity-60 transition-colors cursor-pointer"
            >
              <TrashIcon className="h-5 w-5" />
              {isDeleting ? 'Removing Report...' : 'Remove My Report'}
            </button>
          ) : isDifferentCity ? (
            <div className="flex-1 rounded-xl bg-slate-100 border border-slate-200 px-3 py-2 text-center text-xs font-semibold text-slate-600 flex items-center justify-center gap-1.5">
              <span>📍 Viewing {issueCity} report. Voting is reserved for {issueCity} residents.</span>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleVote('up')}
                aria-label={currentVote === 'up' ? 'Remove upvote' : 'Upvote this issue'}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold cursor-pointer transition-all ${
                  currentVote === 'up'
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200'
                }`}
              >
                <ThumbUpIcon className="h-4 w-4" />
                {currentVote === 'up' ? 'Upvoted' : 'Upvote'}
              </button>
              <button
                type="button"
                onClick={() => handleVote('down')}
                aria-label={currentVote === 'down' ? 'Remove downvote' : 'Downvote this issue'}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold cursor-pointer transition-all ${
                  currentVote === 'down'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                }`}
              >
                <ThumbDownIcon className="h-4 w-4" />
                {currentVote === 'down' ? 'Downvoted' : 'Downvote'}
              </button>
            </>
          )}
          <button
            type="button"
            onClick={share}
            aria-label="Share this issue"
            className={`flex w-12 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 ${focusRing}`}
          >
            <ShareIcon className="h-5 w-5" />
          </button>
        </div>
        <p role="status" className="mt-1.5 text-center text-[11px] text-slate-500">
          {shareMsg ||
            (isOwner
              ? 'You created this report. You can remove it anytime from municipal tracking.'
              : isDifferentCity
              ? `You can inspect and track civic reports in ${issueCity}, but voting is only permitted for your registered home city (${userCity}).`
              : 'Community votes directly influence municipal dispatch priority.')}
        </p>
      </div>

      {showDeleteModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 mx-auto">
              <TrashIcon className="h-6 w-6" />
            </div>
            <div className="text-center">
              <h3 id="delete-dialog-title" className="text-lg font-bold text-slate-900">
                Remove Civic Report?
              </h3>
              <p className="mt-1 text-xs text-slate-600">
                Are you sure you want to permanently remove this report (<span className="font-mono font-semibold">{issue.referenceNumber}</span>)? It will be deleted from public municipal tracking and cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteReport}
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
    </div>
  );
}