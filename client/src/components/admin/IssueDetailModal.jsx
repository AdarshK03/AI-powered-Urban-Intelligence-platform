import React, { useState } from 'react'
import { X, MapPin, Building2, Calendar, ShieldAlert, CheckCircle2, Clock, Trash2, Send } from 'lucide-react'

export default function IssueDetailModal({
  report,
  onClose,
  onUpdateStatus,
  onDeleteIssue,
  onAssignCrew,
  crews,
}) {
  const [selectedCrew, setSelectedCrew] = useState(report?.assignedCrew || '')

  if (!report) return null

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200/80">
        <div className="flex items-start justify-between pb-3.5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-cyan-700 uppercase tracking-wider">
                Incident #{report.id}
              </span>
              {report.aiConfidence && (
                <span className="bg-cyan-50 text-cyan-800 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-cyan-200">
                  AI Confidence: {report.aiConfidence}%
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-slate-800 mt-0.5">{report.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-4 text-xs sm:text-sm">
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
              <span className="font-semibold text-slate-700 mt-0.5 block">{report.category}</span>
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
              <span className="font-semibold text-slate-700 mt-0.5 block flex items-center gap-1">
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
                  className="px-3 py-2 bg-[#0c6b82] hover:bg-[#0a5c70] text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
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
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
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
