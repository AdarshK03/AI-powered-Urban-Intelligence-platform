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
} from 'lucide-react'

export default function AssignmentsTab({
  crews,
  issues,
  onUpdateCrewStatus,
  onAssignCrewToIssue,
  onOpenReportModal,
}) {
  const [filterStatus, setFilterStatus] = useState('All')
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false)
  const [selectedCrewId, setSelectedCrewId] = useState(null)
  const [selectedIssueId, setSelectedIssueId] = useState('')

  const unresolvedIssues = issues.filter((i) => i.status !== 'Resolved')

  const filteredCrews = crews.filter((c) => {
    if (filterStatus !== 'All' && c.status !== filterStatus) return false
    return true
  })

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

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Field Crew Assignments</h2>
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
