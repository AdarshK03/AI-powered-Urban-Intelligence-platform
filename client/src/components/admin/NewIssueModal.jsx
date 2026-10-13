import React, { useState } from 'react'
import { X, Plus, AlertCircle, MapPin } from 'lucide-react'

export default function NewIssueModal({ isOpen, onClose, onAddIssue, departments, categories }) {
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [category, setCategory] = useState('Pothole')
  const [priority, setPriority] = useState('High')
  const [department, setDepartment] = useState('Public Works Department (PWD)')
  const [details, setDetails] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim() || !location.trim()) return

    const newIssue = {
      id: Date.now(),
      title: title.trim(),
      location: location.trim(),
      category,
      priority,
      status: 'Pending',
      reportedOn: 'Just now',
      department,
      details: details.trim() || 'Citizen road safety hazard flagged via administrative dispatch console.',
      coordinates: {
        lat: 28.6139 + (Math.random() - 0.5) * 0.08,
        lng: 77.209 + (Math.random() - 0.5) * 0.08,
        x: 20 + Math.floor(Math.random() * 60),
        y: 20 + Math.floor(Math.random() * 60),
      },
      assignedCrew: null,
      aiConfidence: Math.floor(88 + Math.random() * 11),
    }

    onAddIssue(newIssue)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200/80">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Report New Road Issue</h3>
              <p className="text-xs text-slate-500">Log municipal infrastructure incident</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="py-4 space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block text-slate-700 font-semibold mb-1 text-xs">
              Issue Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Deep pothole causing lane hazard"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1 text-xs">
                Location / Road Landmark *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. Ring Road, Pillar #42"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2 border border-slate-200 rounded-xl text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-600"
                />
                <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1 text-xs">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-600"
              >
                {categories.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1 text-xs">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-600"
              >
                <option value="High">High (Urgent Dispatch)</option>
                <option value="Medium">Medium (Standard)</option>
                <option value="Low">Low (Scheduled Maintenance)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1 text-xs">
                Assigned Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-600"
              >
                {departments.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1 text-xs">
              Inspection Notes / Description
            </label>
            <textarea
              rows="3"
              placeholder="Describe road defect dimensions, traffic obstruction, or damage level..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-600"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#0c6b82] hover:bg-[#0a5c70] text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Log Incident</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
