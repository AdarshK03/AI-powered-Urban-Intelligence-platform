import React, { useState } from 'react'
import { X, MapPin, Building2, Calendar, ShieldAlert, CheckCircle2, Clock, Trash2, Send, AlertTriangle, Sparkles } from 'lucide-react'

export default function IssueDetailModal({
  report,
  onClose,
  onUpdateStatus,
  onDeleteIssue,
  onAssignCrew,
  onClassifyIssue,
  crews,
}) {
  const [selectedCrew, setSelectedCrew] = useState(report?.assignedCrew || '')
  const [isClassifying, setIsClassifying] = useState(false)

  if (!report) return null

  const isUnderReview =
    report.aiNeedsReview ||
    report.category === 'Under Review' ||
    report.categoryRaw === 'under_review'

  const handleClassify = async (catId) => {
    if (onClassifyIssue) {
      setIsClassifying(true)
      try {
        await onClassifyIssue(report.id, catId)
      } finally {
        setIsClassifying(false)
      }
    }
  }

  const categoryChoices = [
    { id: 'pothole', label: 'Pothole' },
    { id: 'road', label: 'Broken Road' },
    { id: 'drain', label: 'Open Drain' },
    { id: 'water', label: 'Water Logging' },
    { id: 'light', label: 'Street Light' },
    { id: 'signal', label: 'Traffic Signal' },
    { id: 'footpath', label: 'Footpath' },
    { id: 'other', label: 'Others' },
  ]

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200/80">
        <div className="flex items-start justify-between pb-3.5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-cyan-700 uppercase tracking-wider">
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
            </div>
            <h3 className="text-lg font-bold text-slate-800 mt-0.5">{report.title}</h3>
          </div>
          <button
            onClick={onClose}
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

          {/* Photo Gallery if present */}
          {Array.isArray(report.photos) && report.photos.length > 0 && (
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
                      onAssignCrew(report.id, selectedCrew)
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
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Issue</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="ml-auto px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
