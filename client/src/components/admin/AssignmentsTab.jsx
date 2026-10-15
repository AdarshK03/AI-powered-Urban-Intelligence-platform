import React, { useState } from 'react'
import {
  ClipboardList,
  Plus,
  Send,
  CheckCircle2,
  Clock,
  Car,
  AlertCircle,
  RotateCcw,
  User,
  ShieldAlert,
  Wrench,
  XCircle,
  MessageSquare,
  RefreshCw,
} from 'lucide-react'

export default function AssignmentsTab({
  crews,
  issues,
  crewRequests = [],
  onRespondCrewRequest,
  onUpdateCrewStatus,
  onAssignCrewToIssue,
  onOpenReportModal,
}) {
  const [filterStatus, setFilterStatus] = useState('All')
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false)
  const [selectedCrewId, setSelectedCrewId] = useState(null)
  const [selectedIssueId, setSelectedIssueId] = useState('')

  // Decline request modal state
  const [declineModalOpen, setDeclineModalOpen] = useState(false)
  const [selectedRequestId, setSelectedRequestId] = useState(null)
  const [declineNotes, setDeclineNotes] = useState('')
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false)

  const unresolvedIssues = issues.filter((i) => i.status !== 'Resolved')

  const filteredCrews = crews.filter((c) => {
    if (filterStatus !== 'All' && c.status !== filterStatus) return false
    return true
  })

  const pendingRequests = crewRequests.filter((r) => r.status === 'pending')

  const openDispatchDialog = (crewId) => {
    setSelectedCrewId(crewId)
    setSelectedIssueId(unresolvedIssues[0]?.id || '')
    setDispatchModalOpen(true)
  }

  const handleConfirmDispatch = (e) => {
    e.preventDefault()
    if (!selectedCrewId || !selectedIssueId) return
    onAssignCrewToIssue(selectedIssueId, selectedCrewId)
    setDispatchModalOpen(false)
  }

  const handleApproveRequest = async (requestId) => {
    if (!onRespondCrewRequest) return
    setIsSubmittingResponse(true)
    try {
      await onRespondCrewRequest(requestId, 'approve', 'Approved by Municipal Admin')
    } finally {
      setIsSubmittingResponse(false)
    }
  }

  const openDeclineDialog = (requestId) => {
    setSelectedRequestId(requestId)
    setDeclineNotes('')
    setDeclineModalOpen(true)
  }

  const handleConfirmDecline = async (e) => {
    e.preventDefault()
    if (!onRespondCrewRequest || !selectedRequestId) return
    setIsSubmittingResponse(true)
    try {
      await onRespondCrewRequest(selectedRequestId, 'reject', declineNotes || 'Declined by administration')
      setDeclineModalOpen(false)
    } finally {
      setIsSubmittingResponse(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* SECTION 1: CREW ASSIGNMENT REQUESTS (REVIEW PANEL) */}
      <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold shrink-0">
              <Wrench className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Crew Assignment Requests
                </h2>
                {pendingRequests.length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    {pendingRequests.length} Pending Review
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Review and approve or decline defect tasks requested by field crew leaders
              </p>
            </div>
          </div>
        </div>

        {crewRequests.length === 0 ? (
          <div className="p-6 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-center">
            <p className="text-xs text-slate-500">No crew task requests currently pending or recorded.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {crewRequests.map((req) => (
              <div
                key={req.id}
                className={`p-4 rounded-2xl border transition-all ${
                  req.status === 'pending'
                    ? 'bg-amber-50/30 border-amber-200 shadow-xs'
                    : req.status === 'approved'
                    ? 'bg-slate-50/60 border-slate-200 opacity-80'
                    : 'bg-rose-50/20 border-rose-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-teal-800 bg-white px-2 py-0.5 rounded border border-teal-200">
                        {req.reference_number || req.issue_id}
                      </span>
                      {req.retry_count > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                          <RefreshCw className="w-2.5 h-2.5" />
                          <span>Final Appeal</span>
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mt-1 leading-snug">
                      {req.issue_title}
                    </h4>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      req.status === 'pending'
                        ? 'bg-amber-100 text-amber-800'
                        : req.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {req.status}
                  </span>
                </div>

                <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs text-slate-600 bg-white/80 p-2.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase">Requesting Crew</span>
                    <span className="font-bold text-slate-800">{req.crew_name}</span>
                    <span className="text-[11px] text-slate-500 block">Leader: {req.crew_leader_name || 'Assigned'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase">Location & Zone</span>
                    <span className="font-bold text-slate-800 truncate block">{req.issue_location_name || req.issue_city}</span>
                    <span className="text-[11px] text-teal-700 font-semibold block">{req.issue_city}</span>
                  </div>
                </div>

                {req.notes && (
                  <div className="mt-2 text-xs bg-slate-100/70 p-2 rounded-lg text-slate-700 italic border border-slate-200/50">
                    <span className="font-semibold not-italic text-slate-500 mr-1">Leader Notes:</span>
                    "{req.notes}"
                  </div>
                )}

                {req.admin_notes && req.status !== 'pending' && (
                  <div className="mt-2 text-xs bg-rose-50 p-2 rounded-lg text-rose-800 border border-rose-200">
                    <span className="font-semibold mr-1">Admin Response:</span>
                    "{req.admin_notes}"
                  </div>
                )}

                {req.status === 'pending' && (
                  <div className="mt-3.5 pt-3 border-t border-slate-200/80 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      disabled={isSubmittingResponse}
                      onClick={() => openDeclineDialog(req.id)}
                      className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Decline</span>
                    </button>
                    <button
                      type="button"
                      disabled={isSubmittingResponse}
                      onClick={() => handleApproveRequest(req.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve & Assign</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Decline Reason Modal */}
      {declineModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Decline Task Request</h3>
            <p className="text-xs text-slate-500 mt-1">
              Provide feedback to the crew leader. They will have one final chance to re-submit or remove the request.
            </p>

            <form onSubmit={handleConfirmDecline} className="mt-4 space-y-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1 text-xs">
                  Reason / Administrative Notes:
                </label>
                <textarea
                  rows={3}
                  value={declineNotes}
                  onChange={(e) => setDeclineNotes(e.target.value)}
                  placeholder="e.g., Heavy asphalt equipment needed; please confirm required machinery."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-100"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDeclineModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingResponse}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Confirm Decline</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SECTION 2: ROSTER & DEPLOYMENT BANNER */}
      <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Field Crew Roster</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage municipal roadwork teams, emergency asphalt crews, and drainage squads
          </p>
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
          {['All', 'Available', 'Dispatched', 'On Site'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filterStatus === st ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Roster Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCrews.map((crew) => {
          const assignedIssue = issues.find((i) => i.id === crew.assignedIssueId)

          return (
            <div
              key={crew.id}
              className="bg-white rounded-[20px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col justify-between transition-all hover:shadow-md"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-cyan-700 uppercase tracking-wider block">
                      {crew.specialty}
                    </span>
                    <h3 className="text-base font-bold text-slate-800 mt-0.5">{crew.name}</h3>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      crew.status === 'Dispatched'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : crew.status === 'On Site'
                        ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {crew.status}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600 bg-slate-50 p-2 rounded-lg">
                    <span className="text-slate-400">Crew Chief:</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {crew.leader}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 bg-slate-50 p-2 rounded-lg">
                    <span className="text-slate-400">Vehicle / Unit:</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1">
                      <Car className="w-3.5 h-3.5 text-slate-400" />
                      {crew.vehicleNumber} ({crew.members} workers)
                    </span>
                  </div>

                  {assignedIssue ? (
                    <div className="mt-3 p-3 bg-cyan-50/60 rounded-xl border border-cyan-100 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-cyan-800 uppercase">
                          Current Work Order
                        </span>
                        <button
                          onClick={() => onOpenReportModal(assignedIssue)}
                          className="text-[10px] text-cyan-700 font-semibold hover:underline"
                        >
                          View Incident →
                        </button>
                      </div>
                      <p className="font-bold text-slate-800 mt-1">{assignedIssue.title}</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">{assignedIssue.location}</p>
                    </div>
                  ) : (
                    <div className="mt-3 p-3 bg-slate-50 rounded-xl text-center text-slate-400 text-xs border border-dashed border-slate-200">
                      Standby at depot. No active assignment.
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2">
                {crew.status === 'Available' ? (
                  <button
                    onClick={() => openDispatchDialog(crew.id)}
                    className="w-full py-2 px-3 bg-[#0c6b82] hover:bg-[#0a5c70] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Dispatch to Incident</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => onUpdateCrewStatus(crew.id, 'Available')}
                      className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Complete Job</span>
                    </button>
                    <button
                      onClick={() => onUpdateCrewStatus(crew.id, 'Available')}
                      className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                      title="Recall Crew"
                    >
                      Recall
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Dispatch Modal */}
      {dispatchModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Dispatch Work Order</h3>
            <p className="text-xs text-slate-500 mt-1">
              Select an unresolved road hazard to assign to this maintenance unit.
            </p>

            <form onSubmit={handleConfirmDispatch} className="mt-4 space-y-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1 text-xs">
                  Choose Incident:
                </label>
                <select
                  value={selectedIssueId}
                  onChange={(e) => setSelectedIssueId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none"
                >
                  {unresolvedIssues.map((i) => (
                    <option key={i.id} value={i.id}>
                      [{i.priority}] #{i.id > 1000 ? String(i.id).slice(-4) : i.id} - {i.title} (
                      {i.location})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDispatchModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0c6b82] hover:bg-[#0a5c70] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Confirm Dispatch</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
