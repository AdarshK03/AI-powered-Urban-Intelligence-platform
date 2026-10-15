import React from 'react';
import { Bell, ArrowRight, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

export default function CrewNotificationDropdown({
  notifications = [],
  isOpen,
  onClose,
  onSelectNotification,
}) {
  if (!isOpen) return null;

  return (
    <div
      role="region"
      aria-label="Crew Notifications Panel"
      className="absolute right-0 top-12 z-50 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl text-xs text-slate-700 max-h-[460px] overflow-y-auto animate-in fade-in duration-150"
    >
      <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-100">
        <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
          <Bell className="w-4 h-4 text-teal-600" />
          <span>Task Notifications</span>
        </div>
        <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
          {notifications.length} {notifications.length === 1 ? 'task' : 'tasks'}
        </span>
      </div>

      {notifications.length === 0 ? (
        <div className="py-8 text-center text-slate-400">
          <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-medium text-slate-500">No pending task assignments.</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Admin assignments will appear here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const isPending = notif.isPendingAcceptance;
            return (
              <button
                key={notif.id}
                type="button"
                onClick={() => {
                  onSelectNotification(notif.issueId);
                  onClose();
                }}
                className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isPending
                    ? 'bg-amber-50/70 border-amber-200/80 hover:bg-amber-50 hover:shadow-xs'
                    : 'bg-slate-50 border-slate-200/70 hover:bg-slate-100'
                }`}
              >
                <div className="min-w-0 flex-1">
                  {/* Shown with just the title as strictly requested */}
                  <div className="flex items-center gap-2">
                    {isPending ? (
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-pulse" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />
                    )}
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {notif.title}
                    </h4>
                  </div>

                  <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500 pl-4">
                    <span className="font-mono">{notif.referenceNumber}</span>
                    <span>•</span>
                    <span
                      className={`font-semibold capitalize ${
                        notif.severity === 'high' ? 'text-rose-600' : 'text-slate-600'
                      }`}
                    >
                      {notif.severity} Priority
                    </span>
                    {isPending && (
                      <span className="bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold">
                        Pending Decision
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-bold text-teal-700 bg-white px-2 py-1 rounded-lg border border-slate-200 shrink-0 shadow-2xs">
                  <span>Review</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
