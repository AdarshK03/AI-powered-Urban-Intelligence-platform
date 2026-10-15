import React, { useState } from 'react';
import {
  MapPin,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Camera,
  Check,
  X,
} from 'lucide-react';
import IssuePhoto from '../../assets/IssuePhotos';

export default function AssignedTaskCard({
  task,
  onRespond,
  isResponding = false,
  highlight = false,
}) {
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  if (!task) return null;

  const isPending =
    task.assignmentStatus === 'pending' ||
    !task.assignmentStatus ||
    task.assignmentStatus === 'pending_acceptance';
  const isAccepted = task.assignmentStatus === 'accepted';
  const isRejected = task.assignmentStatus === 'rejected';

  const handleAccept = () => {
    onRespond(task.id, 'accept');
  };

  const handleConfirmReject = () => {
    onRespond(task.id, 'reject', rejectReason);
    setRejectModalOpen(false);
    setRejectReason('');
  };

  return (
    <div
      id={`task-${task.id}`}
      className={`bg-white rounded-2xl border transition-all p-5 shadow-2xs ${
        highlight
          ? 'border-teal-500 ring-4 ring-teal-500/20 shadow-md'
          : isPending
          ? 'border-amber-200 bg-amber-50/10'
          : 'border-slate-200'
      }`}
    >
      {/* Top Details & Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-200">
            {task.referenceNumber}
          </span>
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              task.severity === 'high'
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : task.severity === 'medium'
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}
          >
            {task.severity?.toUpperCase()} PRIORITY
          </span>
          <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
            {task.category}
          </span>
        </div>

        {/* Assignment Status Pill */}
        <div>
          {isPending ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
              <Clock className="w-3.5 h-3.5" />
              <span>Pending Crew Decision</span>
            </span>
          ) : isAccepted ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Work Order Accepted</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300">
              <XCircle className="w-3.5 h-3.5" />
              <span>Declined by Crew</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Photos Gallery */}
        <div className="md:col-span-1">
          {task.photos && task.photos.length > 0 ? (
            <div className="h-44 w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200 relative">
              <IssuePhoto
                photo={task.photos[0]}
                alt={task.title}
                className="w-full h-full object-cover"
              />
              {task.photos.length > 1 && (
                <span className="absolute bottom-2 right-2 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs">
                  +{task.photos.length - 1} photos
                </span>
              )}
            </div>
          ) : (
            <div className="h-44 w-full rounded-xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-slate-400 p-3 text-center">
              <Camera className="w-8 h-8 mb-1" />
              <span className="text-xs">No citizen photos provided</span>
            </div>
          )}
        </div>

        {/* Task Details & Description */}
        <div className="md:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 leading-snug">
              {task.title}
            </h3>

            <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
              <span>{task.locationName || task.city}</span>
              <span className="text-slate-300">•</span>
              <span className="text-teal-700 bg-teal-50 px-2 py-0.2 rounded font-medium">
                {task.city}
              </span>
            </div>

            <p className="mt-2 text-xs text-slate-600 line-clamp-3 leading-relaxed">
              {task.description || 'No detailed description provided by the citizen.'}
            </p>
          </div>

          {/* Action Decision Buttons */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
            <span className="text-[11px] text-slate-400">
              Reported on: {new Date(task.reportedAt).toLocaleDateString()}
            </span>

            {isPending && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(true)}
                  disabled={isResponding}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 text-rose-600 hover:bg-rose-50 hover:border-rose-300 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Decline</span>
                </button>
                <button
                  type="button"
                  onClick={handleAccept}
                  disabled={isResponding}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Accept Assignment</span>
                </button>
              </div>
            )}

            {isAccepted && (
              <div className="text-right">
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Active Work Order Under Maintenance</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Decline Reason Modal */}
      {rejectModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <XCircle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">Decline Work Order?</h3>
              <p className="text-xs text-slate-600 mt-1">
                You are declining assignment for <strong>"{task.title}"</strong>. The municipal administration will be notified to re-dispatch another crew.
              </p>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Reason for Declining (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Requires specialized heavy drainage vacuum truck not in our roster..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>
            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={isResponding}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm disabled:opacity-50"
              >
                {isResponding ? 'Declining...' : 'Confirm Decline'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
