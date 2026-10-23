import { useState, useEffect, useMemo } from 'react';
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
import { Star, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import { StatusBadge } from '../components/citizen/SeverityBadge';
import GoogleMapView from '../components/common/GoogleMapView';
import { btnPrimary, errorCls, focusRing, inputBad, inputCls, inputOk } from '../components/citizen/ui';

const STATUS_ICONS = { reported: UserIcon, verified: CheckIcon, assigned: FileIcon, in_progress: ClockIcon, resolved: CheckIcon };
const TABS = [['timeline', 'Timeline'], ['details', 'Details'], ['comments', 'Comments']];

function formatDurationDetailed(startIso, endIso) {
  if (!startIso || !endIso) return null;
  const startMs = new Date(startIso).getTime();
  const endMs = new Date(endIso).getTime();
  const diffMs = endMs - startMs;
  if (isNaN(diffMs) || diffMs < 0) return null;

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const remainingHours = totalHours % 24;
  const remainingMins = totalMinutes % 60;

  if (days === 0 && totalHours === 0) {
    return {
      primary: `${Math.max(1, remainingMins)} min${remainingMins === 1 ? '' : 's'}`,
      subtext: '< 1 hour',
      days: 0,
      hours: 0,
    };
  }
  if (days === 0) {
    return {
      primary: `${totalHours} hr${totalHours === 1 ? '' : 's'}`,
      subtext: `${remainingMins} mins`,
      days: 0,
      hours: totalHours,
    };
  }
  return {
    primary: `${days} day${days === 1 ? '' : 's'}`,
    subtext: remainingHours > 0 ? `${remainingHours} hr${remainingHours === 1 ? '' : 's'}` : 'exact',
    days,
    hours: totalHours,
  };
}

export default function IssueDetails() {
  const { id } = useParams();
  return <IssueDetailsView key={id} id={id} />;
}

function IssueDetailsView({ id }) {
  const { back, navigate } = useNav();
  const { user, token } = useAuth();
  const { getIssue, supportIssue, getUserVote, deleteIssue, addComment } = useIssues();
  const issueFromContext = getIssue(id);
  const [fetchedIssue, setFetchedIssue] = useState(null);
  const [loading, setLoading] = useState(!issueFromContext);
  const [tab, setTab] = useState('timeline');
  const [heroIndex, setHeroIndex] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [commentError, setCommentError] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [shareMsg, setShareMsg] = useState('');
  const [voteError, setVoteError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Crew Rating States
  const [userRating, setUserRating] = useState(null);
  const [selectedRating, setSelectedRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingFeedback, setRatingFeedback] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [ratingSuccess, setRatingSuccess] = useState('');
  const [ratingError, setRatingError] = useState('');

  // Always fetch fresh issue details from server to guarantee up-to-date work-done & rating data
  useEffect(() => {
    let active = true;
    if (id) {
      fetch(`/api/issues/${encodeURIComponent(id)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (active && data?.success && data.issue) {
            setFetchedIssue(data.issue);
          }
        })
        .catch((err) => console.error('Error fetching issue:', err))
        .finally(() => {
          if (active) setLoading(false);
        });
    }
    return () => {
      active = false;
    };
  }, [id, token]);

  // Fetch current citizen rating if resolved
  useEffect(() => {
    let active = true;
    if (id) {
      fetch(`/api/issues/${encodeURIComponent(id)}/rating`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (active && data?.success && data.userRating) {
            setUserRating(data.userRating);
            setSelectedRating(data.userRating.rating);
            setRatingFeedback(data.userRating.feedback || '');
          }
        })
        .catch((err) => console.error('Error fetching rating:', err));
    }
    return () => {
      active = false;
    };
  }, [id, token]);

  const issue = useMemo(() => {
    if (!fetchedIssue && !issueFromContext) return null;
    const base = {
      ...(issueFromContext || {}),
      ...(fetchedIssue || {}),
    };
    if (issueFromContext) {
      if (typeof issueFromContext.supportCount === 'number') {
        base.supportCount = issueFromContext.supportCount;
      }
      if (issueFromContext.userVote !== undefined) {
        base.userVote = issueFromContext.userVote;
      }
      if (issueFromContext.hasSupported !== undefined) {
        base.hasSupported = issueFromContext.hasSupported;
      }
    }
    const comments = fetchedIssue?.comments ?? issueFromContext?.comments ?? [];
    return {
      ...base,
      comments,
    };
  }, [fetchedIssue, issueFromContext]);

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
        <div className="mx-auto mt-4 max-w-xs">
          <button type="button" className={btnPrimary} onClick={back}>
            Go back
          </button>
        </div>
      </div>
    );
  }

  const sev = SEVERITIES[issue.severity] || SEVERITIES.medium;
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
  const isResolved = issue.status === 'resolved' || issue.workApprovedAt;

  // Turnaround calculations
  const timeReportedToAssigned = formatDurationDetailed(issue.reportedAt, issue.firstAssignedAt);
  const timeAssignedToRepaired = formatDurationDetailed(
    issue.firstAssignedAt,
    issue.workApprovedAt || issue.workSubmittedAt
  );
  const timeTotalResolution = formatDurationDetailed(
    issue.reportedAt,
    issue.workApprovedAt || (issue.status === 'resolved' ? issue.updatedAt : null)
  );

  // Before & After photo resolution
  const citizenPhoto =
    Array.isArray(issue.photos) && issue.photos.length > 0
      ? issue.photos[0]
      : issue.beforeAfter?.before || null;

  const repairPhoto =
    Array.isArray(issue.workDonePhotos) && issue.workDonePhotos.length > 0
      ? issue.workDonePhotos[0]
      : issue.beforeAfter?.after || null;

  const hasResolutionEvidence = Boolean(issue.beforeAfter?.after || (issue.workDonePhotos && issue.workDonePhotos.length > 0));
  const repairNotes = issue.workDoneNotes || issue.beforeAfter?.notes || 'Repairs inspected and verified by Municipal Administration.';

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

      // Instantly update fetchedIssue state optimistically (0ms response)
      const currVote = getUserVote(issue.id);
      let nextVote = null;
      let delta = 0;
      if (currVote === voteType) {
        nextVote = null;
        delta = voteType === 'up' ? -1 : 1;
      } else if (currVote === 'up' && voteType === 'down') {
        nextVote = 'down';
        delta = -2;
      } else if (currVote === 'down' && voteType === 'up') {
        nextVote = 'up';
        delta = 2;
      } else {
        nextVote = voteType;
        delta = voteType === 'up' ? 1 : -1;
      }

      setFetchedIssue((prev) =>
        prev
          ? {
              ...prev,
              userVote: nextVote,
              hasSupported: nextVote === 'up',
              supportCount: Math.max(0, (prev.supportCount || 0) + delta),
            }
          : prev
      );

      const res = await supportIssue(issue.id, voteType);
      if (res) {
        setFetchedIssue((prev) =>
          prev
            ? {
                ...prev,
                userVote: res.userVote,
                hasSupported: res.hasSupported,
                supportCount: res.supportCount,
              }
            : prev
        );
      }
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
    if (!text) {
      setCommentError('Write a comment before posting.');
      return;
    }
    if (text.length > 300) {
      setCommentError('Comments must be 300 characters or fewer.');
      return;
    }

    const optimisticComment = {
      id: `temp_${Date.now()}`,
      author: user?.name || 'Citizen',
      text,
      at: new Date().toISOString(),
      isOptimistic: true,
    };

    // Optimistically show the comment immediately
    setFetchedIssue((prev) => {
      const current = prev || issueFromContext;
      if (!current) return prev;
      return {
        ...current,
        comments: [...(current.comments || []), optimisticComment],
      };
    });

    setCommentText('');
    setCommentError('');
    setIsSubmittingComment(true);

    try {
      const res = await addComment(issue.id, text);
      if (res?.comments) {
        setFetchedIssue((prev) => {
          const current = prev || issueFromContext;
          return current ? { ...current, comments: res.comments } : prev;
        });
      }
    } catch (err) {
      // Revert optimistic comment if request failed
      setFetchedIssue((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          comments: (prev.comments || []).filter((c) => c.id !== optimisticComment.id),
        };
      });
      setCommentText(text);
      setCommentError(err.message || 'Failed to post comment. Please try again.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleRateCrew = async (e) => {
    e.preventDefault();
    if (!token) {
      setRatingError('Please sign in to rate crew performance.');
      return;
    }
    if (!selectedRating) {
      setRatingError('Please select a star rating from 1 to 5.');
      return;
    }

    setIsSubmittingRating(true);
    setRatingError('');
    setRatingSuccess('');

    try {
      const res = await fetch(`/api/issues/${encodeURIComponent(issue.id)}/rate-crew`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating: selectedRating,
          feedback: ratingFeedback,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to submit rating.');
      }

      setRatingSuccess(data.message || 'Thank you! Your rating has been recorded.');
      setUserRating({ rating: selectedRating, feedback: ratingFeedback });

      // Update issue rating stats in view
      setFetchedIssue((prev) =>
        prev
          ? {
              ...prev,
              crewRatingAvg: data.crewRatingAvg,
              crewRatingCount: data.crewRatingCount,
            }
          : prev
      );
    } catch (err) {
      setRatingError(err.message || 'Error submitting rating.');
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const crewRatingAvg = fetchedIssue?.crewRatingAvg ?? issue.crewRatingAvg;
  const crewRatingCount = fetchedIssue?.crewRatingCount ?? issue.crewRatingCount ?? 0;

  return (
    <div className="pb-32 lg:grid lg:grid-cols-2 lg:items-start lg:gap-8 lg:p-8 lg:pb-10">
      {/* Left Column: Photos, Hero, Summary Details */}
      <div>
        <div className="relative lg:overflow-hidden lg:rounded-2xl">
          <IssuePhoto
            photo={issue.photos[heroIndex] || issue.photos[0]}
            alt={`Photo ${heroIndex + 1} of ${issue.title}`}
            className="h-56 w-full sm:h-72 lg:h-96"
          />
          <button
            type="button"
            onClick={back}
            aria-label="Go back"
            className={`absolute left-3 top-3 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/90 text-slate-800 shadow hover:bg-white ${focusRing}`}
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          {issue.photos.length > 1 && (
            <div className="absolute bottom-2 right-2 flex gap-1.5">
              {issue.photos.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setHeroIndex(i)}
                  aria-label={`Show photo ${i + 1}`}
                  aria-pressed={heroIndex === i}
                  className={`cursor-pointer overflow-hidden rounded-md border-2 ${
                    heroIndex === i ? 'border-white' : 'border-transparent opacity-80'
                  } ${focusRing}`}
                >
                  <IssuePhoto photo={p} alt="" className="h-10 w-12" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 pt-3 lg:px-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold ${sev.solid}`}>
              <ShieldAlertIcon className="h-3.5 w-3.5" />
              {sev.label} Priority
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-cyan-50 px-2.5 py-1 text-xs font-bold text-cyan-800 border border-cyan-200">
              📍 {issueCity}
            </span>
            {isOwner && (
              <span className="inline-flex items-center gap-1 rounded-md bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-800 border border-teal-200">
                <UserIcon className="h-3.5 w-3.5" />
                Your Reported Issue
              </span>
            )}
            {isResolved && (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Publicly Resolved
              </span>
            )}
          </div>

          <h1 className="mt-2 text-xl font-bold text-slate-900">{issue.title}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
            <PinIcon className="h-4 w-4 shrink-0 text-teal-700" />
            {issue.locationName}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-700">
            <span className="flex items-center gap-1.5 font-semibold">
              <ThumbUpIcon className="h-4 w-4 text-teal-600" />
              {issue.supportCount} votes
            </span>
            {issue.similarCount > 0 && (
              <span className="flex items-center gap-1.5">
                <UsersIcon className="h-4 w-4 text-teal-600" />
                {issue.similarCount} people reported
              </span>
            )}
            <StatusBadge status={issue.status} />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Reported on: {formatDateTime(issue.reportedAt)}
          </p>
        </div>

        {/* ======================================================== */}
        {/* TURNAROUND SLA METRICS (Reported to Assigned to Done)    */}
        {/* ======================================================== */}
        <div className="mt-5 px-4 lg:px-0">
          <section className="rounded-2xl border border-teal-200/80 bg-gradient-to-br from-teal-50/50 via-white to-cyan-50/30 p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-teal-100">
              <div className="flex items-center gap-2">
                <ClockIcon className="h-4 w-4 text-teal-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  Municipal Turnaround & SLA Metrics
                </h3>
              </div>
              {isResolved ? (
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                  ✓ Target Achieved
                </span>
              ) : (
                <span className="text-[11px] font-bold text-cyan-800 bg-cyan-100 px-2.5 py-0.5 rounded-full border border-cyan-300">
                  Live SLA Tracking
                </span>
              )}
            </div>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Metric 1: Reported to Assigned */}
              <div className="rounded-xl bg-white p-3 border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">
                  Reported → Assigned
                </span>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-base sm:text-lg font-black text-teal-900">
                    {timeReportedToAssigned ? timeReportedToAssigned.primary : 'Pending'}
                  </span>
                  {timeReportedToAssigned && timeReportedToAssigned.subtext && (
                    <span className="text-xs text-slate-500 font-medium">
                      ({timeReportedToAssigned.subtext})
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[10px] text-slate-500 leading-tight">
                  Time from citizen report until municipal admin dispatched crew.
                </p>
              </div>

              {/* Metric 2: Assigned to Repaired */}
              <div className="rounded-xl bg-white p-3 border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">
                  Assigned → Repaired
                </span>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-base sm:text-lg font-black text-teal-900">
                    {timeAssignedToRepaired
                      ? timeAssignedToRepaired.primary
                      : issue.firstAssignedAt
                      ? 'In Progress'
                      : 'Awaiting Crew'}
                  </span>
                  {timeAssignedToRepaired && timeAssignedToRepaired.subtext && (
                    <span className="text-xs text-slate-500 font-medium">
                      ({timeAssignedToRepaired.subtext})
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[10px] text-slate-500 leading-tight">
                  Duration for field crew to execute repairs on site.
                </p>
              </div>

              {/* Metric 3: Total Turnaround */}
              <div className="rounded-xl bg-white p-3 border border-teal-200 shadow-2xs bg-teal-50/20">
                <span className="text-[10px] font-bold text-teal-800 block uppercase tracking-wider">
                  Total Turnaround
                </span>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-base sm:text-lg font-black text-teal-700">
                    {timeTotalResolution
                      ? timeTotalResolution.primary
                      : isResolved
                      ? 'Resolved'
                      : 'Under Resolution'}
                  </span>
                  {timeTotalResolution && timeTotalResolution.subtext && (
                    <span className="text-xs text-teal-600 font-medium">
                      ({timeTotalResolution.subtext})
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[10px] text-slate-500 leading-tight">
                  Overall time from initial citizen report to verified resolution.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Right Column: Information Tabs, Evidence, Rating & Actions */}
      <div>
        <div className="mt-4 px-4 lg:mt-0 lg:px-0">
          <div role="tablist" aria-label="Issue information" className="flex border-b border-slate-200">
            {TABS.map(([tId, label]) => (
              <button
                key={tId}
                role="tab"
                id={`tab-${tId}`}
                aria-selected={tab === tId}
                aria-controls={`panel-${tId}`}
                type="button"
                onClick={() => setTab(tId)}
                className={`flex-1 cursor-pointer border-b-2 py-2.5 text-sm font-semibold ${
                  tab === tId
                    ? 'border-teal-600 text-teal-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                } ${focusRing}`}
              >
                {label}
                {tId === 'comments' ? ` (${issue.comments?.length || 0})` : ''}
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
                    <li key={`${t.status}-${i}`} className="relative flex gap-3 pb-5 last:pb-0">
                      {!last && (
                        <span
                          aria-hidden="true"
                          className="absolute left-[17px] top-9 h-[calc(100%-2.25rem)] w-0.5 bg-teal-200"
                        />
                      )}
                      <span
                        className={`z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                          t.status === 'resolved'
                            ? 'bg-emerald-500 text-white'
                            : 'bg-teal-100 text-teal-700'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p
                          className={`text-sm font-semibold ${
                            t.status === 'resolved' ? 'text-emerald-700' : 'text-slate-900'
                          }`}
                        >
                          {t.label}
                        </p>
                        <p className="text-xs text-slate-500">{formatDateTime(t.at)}</p>
                        {t.status === 'reported' && issue.photos?.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setHeroIndex(0);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className={`mt-1 cursor-pointer rounded bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-700 ${focusRing}`}
                          >
                            View Image
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
              {issue.timeline?.length === 1 && (
                <p className="mt-4 text-xs text-slate-500">
                  No further updates yet. Verification, assignment, and repair steps appear here as they occur.
                </p>
              )}
            </div>
          )}

          {tab === 'details' && (
            <div role="tabpanel" id="panel-details" aria-labelledby="tab-details" className="py-4 space-y-4">
              <dl className="space-y-3 text-sm">
                {[
                  ['Description', issue.description || 'No description provided.'],
                  ['Category', cat.label],
                  ['Location', issue.locationName],
                  ['Assigned Crew', issue.assignedCrew || 'Not yet dispatched'],
                  ['Severity', sev.label],
                  ['Status', <StatusBadge key="s" status={issue.status} />],
                  ['Report reference', <span key="r" className="font-mono">{issue.referenceNumber}</span>],
                  ['Last updated', formatDateTime(issue.updatedAt)],
                  ...(issue.latitude != null
                    ? [['GPS coordinates', `${issue.latitude}, ${issue.longitude}`]]
                    : []),
                ].map(([k, v]) => (
                  <div key={k} className="flex gap-3">
                    <dt className="w-32 shrink-0 text-slate-500">{k}</dt>
                    <dd className="min-w-0 flex-1 text-slate-900">{v}</dd>
                  </div>
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
              {issue.comments?.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">
                  No comments yet. Be the first to add one.
                </p>
              ) : (
                <ul className="space-y-3">
                  {issue.comments?.map((c) => (
                    <li key={c.id} className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs font-semibold text-slate-800">
                        {c.author} <span className="font-normal text-slate-400">· {formatDateTime(c.at)}</span>
                      </p>
                      <p className="mt-1 text-sm text-slate-700">{c.text}</p>
                    </li>
                  ))}
                </ul>
              )}
              <form onSubmit={postComment} noValidate className="mt-4">
                <label htmlFor="comment" className="mb-1.5 block text-sm font-semibold text-slate-900">
                  Add a comment
                </label>
                <textarea
                  id="comment"
                  rows={3}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Share an update or extra detail..."
                  className={`${inputCls} ${commentError ? inputBad : inputOk} resize-none`}
                />
                {commentError && <p role="alert" className={errorCls}>{commentError}</p>}
                <div className="mt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingComment}
                    className={`${btnPrimary} ${isSubmittingComment ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    {isSubmittingComment ? 'Posting comment...' : 'Post comment'}
                  </button>
                </div>
                <p className="mt-2 text-[11px] text-slate-500">
                  Comments are recorded in the public issue registry.
                </p>
              </form>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* RESOLUTION EVIDENCE & BEFORE/AFTER SHOWCASE             */}
        {/* ======================================================== */}
        <section className="mt-5 px-4 lg:px-0" aria-labelledby="evidence-title">
          <div className="flex items-center justify-between">
            <h2 id="evidence-title" className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span>Resolution Evidence & Field Work</span>
            </h2>
            {isResolved && (
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                ✓ Inspected & Approved
              </span>
            )}
          </div>

          {hasResolutionEvidence ? (
            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {/* Before Photo */}
                <figure className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-2xs">
                  <IssuePhoto
                    photo={citizenPhoto}
                    alt="Original reported defect"
                    className="h-32 sm:h-40 w-full object-cover"
                  />
                  <figcaption className="absolute top-2 left-2 rounded-md bg-rose-950/85 text-white px-2 py-0.5 text-[10px] font-bold backdrop-blur-xs">
                    BEFORE (Defect)
                  </figcaption>
                  <div className="absolute bottom-1.5 left-2 text-[10px] text-white/90 drop-shadow-md">
                    Reported: {new Date(issue.reportedAt).toLocaleDateString()}
                  </div>
                </figure>

                {/* After Photo */}
                <figure className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-2xs">
                  <IssuePhoto
                    photo={repairPhoto}
                    alt="Completed repair work"
                    className="h-32 sm:h-40 w-full object-cover"
                  />
                  <figcaption className="absolute top-2 left-2 rounded-md bg-emerald-950/85 text-white px-2 py-0.5 text-[10px] font-bold backdrop-blur-xs">
                    AFTER (Repaired)
                  </figcaption>
                  <div className="absolute bottom-1.5 left-2 text-[10px] text-white/90 drop-shadow-md">
                    {issue.workApprovedAt
                      ? `Approved: ${new Date(issue.workApprovedAt).toLocaleDateString()}`
                      : 'Completed Work'}
                  </div>
                </figure>
              </div>

              {/* Repair Notes & Details */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-bold text-slate-800">
                    Field Repairs by: <span className="text-teal-700 font-bold">{issue.assignedCrew || 'Municipal Field Team'}</span>
                  </span>
                  {issue.workApprovedAt && (
                    <span className="text-[11px] text-slate-500">
                      Approved on {new Date(issue.workApprovedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <p className="text-slate-600 leading-relaxed italic">
                  "{repairNotes}"
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-2 rounded-xl border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500">
              No repair evidence uploaded yet. Before and after photos will appear here once the assigned crew completes repairs and municipal administrators approve the work.
            </p>
          )}
        </section>

        {/* ======================================================== */}
        {/* CITIZEN RATING OF CREW PERFORMANCE (When Resolved)      */}
        {/* ======================================================== */}
        {isResolved && (
          <section className="mt-5 px-4 lg:px-0">
            <div className="rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50/50 via-white to-amber-50/30 p-4 sm:p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-amber-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Star className="h-4 w-4 text-amber-500 fill-amber-400" />
                    Rate Crew Performance
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Your rating makes municipal maintenance crew rankings reliable and accountable.
                  </p>
                </div>

                {/* Cumulative Crew Score */}
                <div className="flex items-center gap-2 self-start sm:self-auto bg-white px-3 py-1.5 rounded-xl border border-amber-200 shadow-2xs">
                  <span className="text-xs font-semibold text-slate-600">Crew Score:</span>
                  <div className="flex items-center gap-1 font-bold text-slate-900 text-sm">
                    <Star className="h-4 w-4 text-amber-500 fill-amber-400" />
                    <span>{crewRatingAvg ? Number(crewRatingAvg).toFixed(1) : '5.0'}</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    ({crewRatingCount} {crewRatingCount === 1 ? 'rating' : 'ratings'})
                  </span>
                </div>
              </div>

              {user ? (
                <form onSubmit={handleRateCrew} className="mt-4 space-y-3">
                  <div>
                    <span className="block text-xs font-bold text-slate-700 mb-1.5">
                      {userRating ? 'Update Your Rating for this Repair:' : 'How would you rate the quality of this repair work?'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((starVal) => {
                        const isFilled = (hoverRating || selectedRating) >= starVal;
                        return (
                          <button
                            key={starVal}
                            type="button"
                            onClick={() => setSelectedRating(starVal)}
                            onMouseEnter={() => setHoverRating(starVal)}
                            onMouseLeave={() => setHoverRating(0)}
                            aria-label={`Rate ${starVal} star${starVal > 1 ? 's' : ''}`}
                            className="p-1 rounded-lg hover:scale-110 transition-transform cursor-pointer"
                          >
                            <Star
                              className={`h-6 w-6 transition-colors ${
                                isFilled
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-slate-300 hover:text-amber-200'
                              }`}
                            />
                          </button>
                        );
                      })}
                      <span className="ml-2 text-xs font-bold text-slate-700">
                        {hoverRating || selectedRating ? `${hoverRating || selectedRating} / 5 Stars` : 'Tap stars'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="rating-feedback" className="block text-xs font-semibold text-slate-700 mb-1">
                      Optional Feedback on Field Workmanship
                    </label>
                    <input
                      id="rating-feedback"
                      type="text"
                      placeholder="e.g. Patch is smooth, debris was fully cleared, fast turnaround..."
                      value={ratingFeedback}
                      onChange={(e) => setRatingFeedback(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600"
                    />
                  </div>

                  {ratingSuccess && (
                    <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 p-2 rounded-lg">
                      ✓ {ratingSuccess}
                    </p>
                  )}

                  {ratingError && (
                    <p className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 p-2 rounded-lg">
                      {ratingError}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-500">
                      Assigned Crew: <strong>{issue.assignedCrew || 'Municipal Taskforce'}</strong>
                    </span>
                    <button
                      type="submit"
                      disabled={isSubmittingRating || !selectedRating}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      {isSubmittingRating ? 'Saving...' : userRating ? 'Update Rating' : 'Submit Rating'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                  <span className="text-slate-600">
                    Want to rate <strong>{issue.assignedCrew || 'the crew'}</strong>? Sign in as a citizen to rate repairs.
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="px-3 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-bold hover:bg-teal-700 transition"
                  >
                    Sign In
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Voting & Action Controls */}
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
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold cursor-pointer select-none transition-all duration-150 active:scale-95 ${
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
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold cursor-pointer select-none transition-all duration-150 active:scale-95 ${
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