import React, { useState } from 'react';
import {
  X,
  MapPin,
  Building2,
  Calendar,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Trash2,
  Send,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Camera,
  Star,
  Check,
} from 'lucide-react';

export default function IssueDetailModal({
  report,
  onClose,
  onUpdateStatus,
  onDeleteIssue,
  onAssignCrew,
  onClassifyIssue,
  onReviewWork,
  crews,
}) {
  const [selectedCrew, setSelectedCrew] = useState(report?.assignedCrew || '');
  const [isClassifying, setIsClassifying] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [showReworkInput, setShowReworkInput] = useState(false);
  const [reworkFeedback, setReworkFeedback] = useState('');

  if (!report) return null;

  const isUnderReview =
    report.aiNeedsReview ||
    report.category === 'Under Review' ||
    report.categoryRaw === 'under_review';

  const hasWorkDone =
    (Array.isArray(report.workDonePhotos) && report.workDonePhotos.length > 0) ||
    Boolean(report.beforeAfter?.after);

  const isWorkCompleted =
    report.status === 'Work Completed' ||
    report.status === 'work_completed' ||
    report.rawStatus === 'work_completed' ||
    report.assignmentStatus === 'work_submitted';

  const isResolved =
    report.status === 'Resolved' ||
    report.status === 'resolved' ||
    report.rawStatus === 'resolved' ||
    report.assignmentStatus === 'approved';

  const isRework = report.assignmentStatus === 'rework_required';

  const handleClassify = async (catId) => {
    if (onClassifyIssue) {
      setIsClassifying(true);
      try {
        await onClassifyIssue(report.id, catId);
      } finally {
        setIsClassifying(false);
      }
    }
  };

  const handleApproveWork = async () => {
    if (!onReviewWork) return;
    setIsReviewing(true);
    try {
      await onReviewWork(report.id, 'approve');
    } finally {
      setIsReviewing(false);
    }
  };

  const handleRequestRework = async () => {
    if (!onReviewWork) return;
    if (!reworkFeedback.trim()) {
      alert('Please specify what rework is required for the crew.');
      return;
    }
    setIsReviewing(true);
    try {
      await onReviewWork(report.id, 'request_rework', reworkFeedback.trim());
      setShowReworkInput(false);
      setReworkFeedback('');
    } finally {
      setIsReviewing(false);
    }
  };

  const categoryChoices = [
    { id: 'pothole', label: 'Pothole' },
    { id: 'road', label: 'Broken Road' },
    { id: 'drain', label: 'Open Drain' },
    { id: 'water', label: 'Water Logging' },
    { id: 'light', label: 'Street Light' },
    { id: 'signal', label: 'Traffic Signal' },
    { id: 'footpath', label: 'Footpath' },
    { id: 'other', label: 'Others' },
  ];

  const citizenPhoto =
    Array.isArray(report.photos) && report.photos.length > 0
      ? typeof report.photos[0] === 'string'
        ? report.photos[0]
        : report.photos[0]?.url
      : report.beforeAfter?.before || null;

  const repairPhoto =
    Array.isArray(report.workDonePhotos) && report.workDonePhotos.length > 0
      ? typeof report.workDonePhotos[0] === 'string'
        ? report.workDonePhotos[0]
        : report.workDonePhotos[0]?.url
      : report.beforeAfter?.after || null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200/80">
        {/* Header */}
        <div className="flex items-start justify-between pb-3.5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-cyan-700 uppercase tracking-wider font-mono">
                Incident #{report.referenceNumber || report.id}
              </span>
              {report.aiConfidence ? (
                <span className="bg-cyan-50 text-cyan-800 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-cyan-200">
                  AI Confidence: {report.aiConfidence}%
                </span>
              ) : isUnderReview ? (
                <span className="bg-amber-50 text-amber-800 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-amber-200">
                  ⚠️ AI Needs Review
                </span>
              ) : null}

              {isWorkCompleted && (
                <span className="bg-sky-50 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-sky-300 animate-pulse">
                  ⚡ Inspection Pending
                </span>
              )}
              {isResolved && (
                <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                  ✓ Publicly Resolved
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-slate-800 mt-1">{report.title}</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-4 text-xs sm:text-sm">
          {/* Action Required: Defect Classification by Admin */}
          {isUnderReview && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-4 shadow-xs">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                    Action Required: Defect Classification
                  </h4>
                  <p className="mt-1 text-xs text-amber-800 leading-relaxed">
                    The uploaded citizen photo was not clear enough for the AI model to determine the defect type with high confidence. Please inspect the image below and decide the defect type:
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {categoryChoices.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        disabled={isClassifying}
                        onClick={() => handleClassify(cat.id)}
                        className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-amber-300 bg-white hover:bg-amber-100 text-amber-900 transition cursor-pointer shadow-2xs disabled:opacity-60"
                      >
                        {isClassifying ? 'Saving...' : `Assign ${cat.label}`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* WORK DONE INSPECTION & BEFORE / AFTER COMPARISON SECTION */}
          {/* ======================================================== */}
          {(hasWorkDone || isWorkCompleted || isResolved) && (
            <div className="rounded-2xl border-2 border-teal-500/30 bg-teal-50/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider text-teal-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  <span>Work Done Inspection & Verification</span>
                </span>
                {report.assignedCrew && (
                  <span className="text-[11px] font-semibold text-teal-800 bg-teal-100/80 px-2.5 py-0.5 rounded-full border border-teal-200">
                    Crew: {report.assignedCrew}
                  </span>
                )}
              </div>

              {/* Side-by-side Before vs After Photo Evidence */}
              <div className="grid grid-cols-2 gap-3">
                {/* BEFORE */}
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      BEFORE (Defect)
                    </span>
                    <span className="text-[10px] text-slate-400">Citizen</span>
                  </div>
                  {citizenPhoto ? (
                    <img
                      src={citizenPhoto}
                      alt="Before repair defect evidence"
                      className="h-32 w-full object-cover rounded-lg border border-slate-200"
                    />
                  ) : (
                    <div className="h-32 w-full bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-xs text-center p-2">
                      No citizen photo
                    </div>
                  )}
                  <p className="mt-1.5 text-[10px] text-slate-500 truncate">
                    Reported on: {report.reportedOn}
                  </p>
                </div>

                {/* AFTER */}
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      AFTER (Repair)
                    </span>
                    <span className="text-[10px] text-slate-400">Crew Field</span>
                  </div>
                  {repairPhoto ? (
                    <img
                      src={repairPhoto}
                      alt="Completed repair evidence"
                      className="h-32 w-full object-cover rounded-lg border border-slate-200"
                    />
                  ) : (
                    <div className="h-32 w-full bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-xs text-center p-2">
                      Repair photo pending
                    </div>
                  )}
                  <p className="mt-1.5 text-[10px] text-slate-500 truncate">
                    {report.workSubmittedAt
                      ? `Submitted: ${new Date(report.workSubmittedAt).toLocaleDateString()}`
                      : 'Field photo'}
                  </p>
                </div>
              </div>

              {/* Crew Notes */}
              {report.workDoneNotes && (
                <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs">
                  <span className="font-bold text-slate-700 block mb-0.5">Crew Repair Summary:</span>
                  <p className="text-slate-600 italic">"{report.workDoneNotes}"</p>
                </div>
              )}

              {/* Admin Verification Decision Actions */}
              {isWorkCompleted && onReviewWork && (
                <div className="pt-2 border-t border-teal-200/60 space-y-2.5">
                  <p className="text-xs text-slate-700 font-medium">
                    Please inspect the before & after evidence above and decide whether to approve and publish to the Citizen Portal or request rework from the crew.
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isReviewing}
                      onClick={handleApproveWork}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isReviewing ? 'Publishing...' : 'Approve & Publish to Citizens'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={isReviewing}
                      onClick={() => setShowReworkInput((prev) => !prev)}
                      className="py-2.5 px-3 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                      <span>Request Rework</span>
                    </button>
                  </div>

                  {showReworkInput && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 space-y-2 animate-in fade-in duration-150">
                      <label className="block text-xs font-bold text-amber-950">
                        Feedback / Rework Instructions for Crew:
                      </label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Surface patch uneven; requires further smoothing and edge sealing..."
                        value={reworkFeedback}
                        onChange={(e) => setReworkFeedback(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-amber-300 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowReworkInput(false)}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 text-xs font-semibold hover:bg-white cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={isReviewing}
                          onClick={handleRequestRework}
                          className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          Send Rework Request
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* If Rework was already requested */}
              {isRework && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-amber-950">Rework Requested:</span>
                    <p className="mt-0.5 italic">"{report.adminFeedback || 'Additional repair work needed.'}"</p>
                    <span className="text-[11px] text-amber-700 block mt-1">
                      Field crew notified to carry out repairs and re-submit photos.
                    </span>
                  </div>
                </div>
              )}

              {/* If Resolved and Published */}
              {isResolved && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold block text-emerald-950">
                        Repairs Approved & Published to Citizen Portal
                      </span>
                      {report.workApprovedAt && (
                        <span className="text-[11px] text-emerald-700 block">
                          Verified on: {new Date(report.workApprovedAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {report.crewRatingAvg ? (
                    <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-emerald-200">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                      <span className="font-bold text-slate-800 text-xs">{report.crewRatingAvg}</span>
                      <span className="text-[10px] text-slate-500">({report.crewRatingCount})</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-emerald-700 font-medium">
                      Awaiting citizen ratings
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Citizen Photo Gallery if not showing comparison */}
          {!hasWorkDone && !isWorkCompleted && !isResolved && Array.isArray(report.photos) && report.photos.length > 0 && (
            <div>
              <span className="text-slate-400 block text-[11px] mb-1.5">Reported Photo Evidence</span>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {report.photos.map((p, idx) => (
                  <img
                    key={idx}
                    src={typeof p === 'string' ? p : p.url}
                    alt={`Defect photo ${idx + 1}`}
                    className="h-28 w-28 object-cover rounded-xl border border-slate-200 shadow-2xs shrink-0"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <div>
              <span className="text-slate-400 block text-[11px]">Location</span>
              <span className="font-semibold text-slate-700 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                <span className="truncate">{report.location}</span>
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">City</span>
              <span className="font-semibold text-cyan-800 flex items-center gap-1 mt-0.5">
                <span>📍 {(!report.city || report.city === 'All Cities') ? 'Pune' : report.city}</span>
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Category</span>
              <span className={`font-semibold mt-0.5 inline-block ${isUnderReview ? 'text-amber-700 font-bold' : 'text-slate-700'}`}>
                {report.category}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Priority</span>
              <span
                className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                  report.priority === 'High'
                    ? 'bg-rose-50 text-rose-600 border border-rose-200'
                    : report.priority === 'Medium'
                    ? 'bg-amber-50 text-amber-600 border border-amber-200'
                    : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                }`}
              >
                {report.priority}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Reported Date</span>
              <span className="font-semibold text-slate-700 mt-0.5 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                {report.reportedOn}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">First Assigned</span>
              <span className="font-semibold text-slate-700 mt-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                {report.firstAssignedAt ? new Date(report.firstAssignedAt).toLocaleDateString() : 'Unassigned'}
              </span>
            </div>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px] mb-1">Assigned Department</span>
            <p className="text-slate-700 font-medium bg-white border border-slate-200 rounded-lg p-2.5 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-cyan-700" />
              <span>{report.department || 'Urban Infrastructure Taskforce'}</span>
            </p>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px] mb-1">Issue Details & Diagnosis</span>
            <p className="text-slate-600 bg-slate-50 p-3 rounded-lg leading-relaxed border border-slate-100">
              {report.details}
            </p>
          </div>

          {/* Crew Assignment Section */}
          {crews && (
            <div>
              <span className="text-slate-600 block text-xs font-semibold mb-1.5">
                Assigned Maintenance Crew
              </span>
              <div className="flex items-center gap-2">
                <select
                  value={selectedCrew}
                  onChange={(e) => setSelectedCrew(e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-slate-800 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-cyan-600/20"
                >
                  <option value="">No crew assigned yet</option>
                  {crews.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name} ({c.specialty} - {c.status})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedCrew) {
                      onAssignCrew(report.id, selectedCrew);
                    }
                  }}
                  className="px-3 py-2 bg-[#0c6b82] hover:bg-[#0a5c70] text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Assign</span>
                </button>
              </div>
            </div>
          )}

          {/* Interactive Status Update Buttons */}
          <div className="pt-2">
            <span className="text-slate-700 block text-xs font-semibold mb-2">
              Update Operational Status:
            </span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { name: 'Pending', label: 'Pending' },
                { name: 'In Progress', label: 'In Progress' },
                { name: 'Resolved', label: 'Resolved' },
              ].map((st) => (
                <button
                  key={st.name}
                  onClick={() => onUpdateStatus(report.id, st.name)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    report.status === st.name
                      ? 'bg-cyan-700 text-white border-cyan-700 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {report.status === st.name && <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>{st.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          {onDeleteIssue && (
            <button
              onClick={() => onDeleteIssue(report.id)}
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Issue</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="ml-auto px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
