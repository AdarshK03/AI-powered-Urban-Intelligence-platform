import React, { useState, useRef } from 'react';
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
  Upload,
  Trash2,
  FileText,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import IssuePhoto from '../../assets/IssuePhotos';

export default function AssignedTaskCard({
  task,
  onRespond,
  onSubmitWork,
  isResponding = false,
  highlight = false,
}) {
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Submit Completed Work Modal State
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [workPhotos, setWorkPhotos] = useState([]);
  const [workNotes, setWorkNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const fileInputRef = useRef(null);

  if (!task) return null;

  const isPending =
    task.assignmentStatus === 'pending' ||
    !task.assignmentStatus ||
    task.assignmentStatus === 'pending_acceptance';
  const isAccepted = task.assignmentStatus === 'accepted';
  const isRejected = task.assignmentStatus === 'rejected';
  const isWorkSubmitted =
    task.assignmentStatus === 'work_submitted' ||
    task.status === 'work_completed';
  const isReworkRequired = task.assignmentStatus === 'rework_required';
  const isResolved =
    task.status === 'resolved' ||
    task.assignmentStatus === 'approved';

  const handleAccept = () => {
    onRespond(task.id, 'accept');
  };

  const handleConfirmReject = () => {
    onRespond(task.id, 'reject', rejectReason);
    setRejectModalOpen(false);
    setRejectReason('');
  };

  // Handle Photo selection for completed work
  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setSubmitError('');
    files.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        setSubmitError('Only image files (JPG, PNG, WebP) are allowed.');
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        setSubmitError('Each photo must be smaller than 8MB.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setWorkPhotos((prev) => [
          ...prev,
          {
            id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            name: file.name,
            dataUrl: event.target.result,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = (photoId) => {
    setWorkPhotos((prev) => prev.filter((p) => p.id !== photoId));
  };

  const handleSubmitWork = async (e) => {
    e.preventDefault();
    if (workPhotos.length === 0) {
      setSubmitError('Please attach at least one photo showing the completed repair.');
      return;
    }
    if (!workNotes.trim()) {
      setSubmitError('Please provide a brief summary of the repair work done.');
      return;
    }

    if (!onSubmitWork) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const photosPayload = workPhotos.map((p) => ({
        url: p.dataUrl,
        name: p.name,
      }));

      const success = await onSubmitWork(task.id, {
        photos: photosPayload,
        notes: workNotes.trim(),
      });

      if (success) {
        setSubmitModalOpen(false);
        setWorkPhotos([]);
        setWorkNotes('');
      }
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit completed work.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id={`task-${task.id}`}
      className={`bg-white rounded-2xl border transition-all p-5 shadow-2xs ${
        highlight
          ? 'border-teal-500 ring-4 ring-teal-500/20 shadow-md'
          : isReworkRequired
          ? 'border-amber-400 bg-amber-50/15'
          : isPending
          ? 'border-amber-200 bg-amber-50/10'
          : isResolved
          ? 'border-emerald-200 bg-emerald-50/5'
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
          ) : isReworkRequired ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
              <RotateCcw className="w-3.5 h-3.5 text-amber-700 animate-spin" />
              <span>Rework Requested by Admin</span>
            </span>
          ) : isWorkSubmitted ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-900 border border-sky-300">
              <Clock className="w-3.5 h-3.5 text-sky-600" />
              <span>Work Submitted — Under Admin Review</span>
            </span>
          ) : isResolved ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Repairs Approved & Published</span>
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

      {/* Rework Notice Banner if Admin requested rework */}
      {isReworkRequired && (
        <div className="mt-3 p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start gap-2.5 text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold block text-amber-950">Municipal Admin Inspection Feedback:</span>
            <p className="mt-0.5 text-amber-900 leading-relaxed font-medium">
              "{task.adminFeedback || 'Additional repair work is needed to meet municipal standards.'}"
            </p>
            <span className="text-[11px] text-amber-700 block mt-1">
              Please carry out additional fixes and re-submit completed work photos.
            </span>
          </div>
        </div>
      )}

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

            {/* Submitted Work Preview in card */}
            {task.workDonePhotos && task.workDonePhotos.length > 0 && (
              <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <span className="font-bold text-slate-700 block mb-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                  Your Submitted Repair Evidence:
                </span>
                <p className="text-slate-600 text-[11px] italic mb-2">
                  "{task.workDoneNotes || 'Repairs completed on site.'}"
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {task.workDonePhotos.map((wp, idx) => (
                    <img
                      key={idx}
                      src={typeof wp === 'string' ? wp : wp.url}
                      alt={`Repair photo ${idx + 1}`}
                      className="h-16 w-16 object-cover rounded-lg border border-slate-200 shadow-2xs shrink-0"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Decision Buttons */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <span className="text-[11px] text-slate-400">
              Reported on: {new Date(task.reportedAt).toLocaleDateString()}
            </span>

            {/* 1. Pending Assignment: Accept or Decline */}
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

            {/* 2. Accepted: In Progress -> Option to Submit Completed Work */}
            {isAccepted && (
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Active Maintenance</span>
                </span>
                <button
                  type="button"
                  onClick={() => setSubmitModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Submit Completed Work</span>
                </button>
              </div>
            )}

            {/* 3. Rework Required: Button to Re-submit Completed Work */}
            {isReworkRequired && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSubmitModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Re-submit Completed Work</span>
                </button>
              </div>
            )}

            {/* 4. Work Submitted: Awaiting Admin Review */}
            {isWorkSubmitted && (
              <div className="text-right">
                <span className="text-xs font-bold text-sky-700 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>Under Municipal Admin Inspection</span>
                </span>
              </div>
            )}

            {/* 5. Resolved: Completed & Published */}
            {isResolved && (
              <div className="text-right">
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Repairs Verified & Published to Citizens</span>
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
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={isResponding}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isResponding ? 'Declining...' : 'Confirm Decline'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Completed Work Modal */}
      {submitModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  {task.referenceNumber}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {isReworkRequired ? 'Re-submit Completed Repair Work' : 'Submit Completed Work Report'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload photos of the completed field repairs and submit notes for Municipal Admin inspection.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSubmitModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {submitError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitWork} className="space-y-4">
              {/* Photo Upload Area */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Repair Photos Evidence <span className="text-rose-500">*</span>
                </label>

                {/* Thumbnail Previews */}
                {workPhotos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2.5 mb-3">
                    {workPhotos.map((p) => (
                      <div key={p.id} className="relative h-24 rounded-xl overflow-hidden border border-slate-200 shadow-2xs group">
                        <img src={p.dataUrl} alt={p.name} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(p.id)}
                          aria-label="Remove photo"
                          className="absolute top-1 right-1 bg-slate-900/80 text-white hover:bg-rose-600 p-1 rounded-md transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <span className="absolute bottom-1 left-1 right-1 truncate bg-slate-900/70 text-white text-[9px] px-1 rounded">
                          {p.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-teal-300 hover:border-teal-500 bg-teal-50/40 hover:bg-teal-50/70 rounded-xl p-5 text-center cursor-pointer transition-colors"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoSelect}
                    accept="image/*"
                    multiple
                    className="hidden"
                  />
                  <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center mx-auto mb-2">
                    <Camera className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-teal-900 block">
                    Click to browse or take repair photos
                  </span>
                  <span className="text-[11px] text-teal-700 block mt-0.5">
                    Supports JPG, PNG, WebP (up to 4 photos)
                  </span>
                </div>
              </div>

              {/* Repair Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Repair & Completion Summary <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Cleared drainage blockage and replaced broken iron grate. Asphalt patch compacted and leveled with road surface."
                  value={workNotes}
                  onChange={(e) => setWorkNotes(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-[11px] leading-relaxed">
                <strong>Municipal Verification Notice:</strong> Upon submission, these repair photos will be inspected side-by-side with original citizen reports by the Municipal Administrator. Once approved, the work will be published to the citizen portal for public ratings.
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSubmitModalOpen(false)}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting Evidence...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isReworkRequired ? 'Re-submit Work' : 'Submit for Admin Approval'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
