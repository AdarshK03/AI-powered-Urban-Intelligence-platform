import { useState, useRef, useEffect } from 'react';
import { useIssues } from '../../context/IssueContext';
import { useNav } from '../../hooks/useCitizenNav';
import { CITIES } from '../../data/demoIssues';
import { BellIcon, ChevronDownIcon, PinIcon, SearchIcon, ThumbUpIcon, ThumbDownIcon } from './icons';
import { focusRing } from './ui';
import { MessageSquare, Sparkles } from 'lucide-react';

// Location selector + notification bell + search box (shared by Home and Map).
export default function AppHeader({ query, onQuery, placeholder }) {
  const { city, setCity, notifications, refreshNotifications } = useIssues();
  const { navigate } = useNav();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const comments = notifications?.commentsOnMyReports || [];
  const votes = notifications?.votesOnMyReports || [];
  const allUpdates = notifications?.notifications || [...comments, ...votes];
  const totalCount = allUpdates.length;

  const handleNotificationClick = (issueId) => {
    setOpen(false);
    navigate('issue', { id: issueId });
  };

  return (
    <header className="space-y-3 bg-white px-4 pb-3 pt-4">
      <div className="flex items-center justify-between">
        <div className="relative">
          <label htmlFor="city-select" className="sr-only">City</label>
          <PinIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-teal-700" />
          <select
            id="city-select"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className={`cursor-pointer appearance-none rounded-full bg-slate-100 py-2 pl-9 pr-9 text-sm font-semibold text-slate-900 ${focusRing}`}
          >
            {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => {
              setOpen((o) => !o);
              if (!open) refreshNotifications?.();
            }}
            aria-label={`Notifications (${totalCount} updates)`}
            aria-expanded={open}
            className={`relative cursor-pointer rounded-full p-2 text-slate-800 hover:bg-slate-100 ${focusRing}`}
          >
            <BellIcon className="h-6 w-6" />
            {totalCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                {totalCount > 9 ? '9+' : totalCount}
              </span>
            )}
          </button>

          {open && (
            <div
              role="region"
              aria-label="Notifications Panel"
              className="absolute right-0 top-12 z-50 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl text-xs text-slate-700 max-h-[420px] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <BellIcon className="h-4 w-4 text-teal-600" />
                  <span>Notifications</span>
                </span>
                <span className="text-[11px] font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                  {totalCount} {totalCount === 1 ? 'update' : 'updates'}
                </span>
              </div>

              {/* Comments on user's reported issues */}
              {comments.length > 0 && (
                <div className="mb-3 space-y-2">
                  <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-amber-700 px-1">
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    <span>Comments On Your Reports</span>
                  </div>

                  {comments.map((notif) => (
                    <button
                      key={notif.id}
                      type="button"
                      onClick={() => handleNotificationClick(notif.issueId)}
                      className="w-full text-left p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/90 hover:bg-amber-100/60 transition cursor-pointer"
                    >
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white">
                          <MessageSquare className="h-3 w-3" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-900 truncate">
                            {notif.issueTitle}
                          </p>
                          <p className="text-[11px] text-amber-900 font-medium line-clamp-2 mt-0.5">
                            {notif.message}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Tap to view report & responses
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Votes on user's reported issues */}
              {votes.length > 0 && (
                <div className="mb-3 space-y-2">
                  <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-teal-700 px-1">
                    <ThumbUpIcon className="w-3 h-3 text-teal-600" />
                    <span>Votes On Your Reports</span>
                  </div>

                  {votes.map((notif) => (
                    <button
                      key={notif.id}
                      type="button"
                      onClick={() => handleNotificationClick(notif.issueId)}
                      className="w-full text-left p-2.5 rounded-xl bg-teal-50/70 border border-teal-200/90 hover:bg-teal-100/60 transition cursor-pointer"
                    >
                      <div className="flex items-start gap-2">
                        <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white ${notif.voteType === 'down' ? 'bg-rose-500' : 'bg-teal-600'}`}>
                          {notif.voteType === 'down' ? <ThumbDownIcon className="h-3 w-3" /> : <ThumbUpIcon className="h-3 w-3" />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-900 truncate">
                            {notif.issueTitle}
                          </p>
                          <p className="text-[11px] text-teal-950 font-medium line-clamp-2 mt-0.5">
                            {notif.message}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Tap to view report
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Empty state: No new activity */}
              {totalCount === 0 && (
                <div className="py-8 text-center text-slate-500 space-y-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400 mx-auto">
                    <BellIcon className="h-5 w-5" />
                  </div>
                  <p className="font-semibold text-slate-800 text-xs">No new activity</p>
                  <p className="text-[11px] text-slate-400 max-w-[220px] mx-auto leading-relaxed">
                    When other citizens comment or vote on your reported road issues, updates will appear here.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
 
      <div className="relative">
        <label htmlFor="issue-search" className="sr-only">{placeholder}</label>
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          id="issue-search"
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-slate-200 bg-slate-100 py-3 pl-11 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/30"
        />
      </div>
    </header>
  );
}