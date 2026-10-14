import React, { useState } from 'react'
import {
  MapPin,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Send,
  Eye,
  Activity,
  Compass,
} from 'lucide-react'
import GoogleMapView from '../common/GoogleMapView'

export default function MapViewTab({
  issues = [],
  onOpenReportModal,
  onUpdateStatus,
  onDispatchCrew,
  categories = [],
}) {
  const [selectedIssue, setSelectedIssue] = useState(issues[0] || null)
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')

  // Filtered map pins from live issues
  const visibleIssues = issues.filter((i) => {
    if (categoryFilter !== 'All' && i.category !== categoryFilter) return false
    if (priorityFilter !== 'All' && i.priority !== priorityFilter) return false
    return true
  })

  // Format markers for Google Maps
  const markers = visibleIssues
    .filter((i) => (i.latitude || i.lat) && (i.longitude || i.lng))
    .map((i) => ({
      id: i.id,
      lat: Number(i.latitude || i.lat),
      lng: Number(i.longitude || i.lng),
      title: i.title,
      severity: i.priority || i.severity,
      category: i.category,
      status: i.status,
    }))

  const mapCenter = selectedIssue && (selectedIssue.latitude || selectedIssue.lat)
    ? { lat: Number(selectedIssue.latitude || selectedIssue.lat), lng: Number(selectedIssue.longitude || selectedIssue.lng) }
    : markers.length > 0
    ? { lat: markers[0].lat, lng: markers[0].lng }
    : { lat: 28.6139, lng: 77.2090 }

  return (
    <div className="space-y-4">
      {/* Top Map Control Bar */}
      <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Urban GIS Hazard Map
            </h2>
            <span className="bg-cyan-50 text-cyan-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-cyan-200">
              Live Google Maps Telemetry
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Geospatial tracking of live road defects and hazard coordinates submitted by citizens
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none"
          >
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none"
          >
            <option value="All">All Priorities</option>
            <option value="High">High Severity</option>
            <option value="Medium">Medium Severity</option>
            <option value="Low">Low Severity</option>
          </select>
        </div>
      </div>

      {/* Main Map Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Google Maps Visual (2 cols) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="rounded-[22px] overflow-hidden border border-slate-200 shadow-md">
            <GoogleMapView
              center={mapCenter}
              zoom={13}
              markers={markers}
              selectedMarkerId={selectedIssue?.id}
              onMarkerClick={(m) => {
                const found = visibleIssues.find((i) => String(i.id) === String(m.id))
                if (found) setSelectedIssue(found)
              }}
              height="480px"
            />
          </div>

          {/* Map Footer Legend */}
          <div className="flex items-center justify-between text-xs text-slate-600 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-xs flex-wrap gap-2">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-[11px] font-medium">High Hazard ({visibleIssues.filter((i) => (i.priority || i.severity || '').toLowerCase() === 'high').length})</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-[11px] font-medium">Medium ({visibleIssues.filter((i) => (i.priority || i.severity || '').toLowerCase() === 'medium').length})</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-[11px] font-medium">Low ({visibleIssues.filter((i) => (i.priority || i.severity || '').toLowerCase() === 'low').length})</span>
              </span>
            </div>
            <div className="text-[11px] text-cyan-800 font-semibold">
              {markers.length} GPS pin{markers.length === 1 ? '' : 's'} plotted in real time
            </div>
          </div>
        </div>

        {/* Selected Incident Telemetry & Actions Card (1 col) */}
        <div className="bg-white rounded-[22px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col justify-between">
          {selectedIssue ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[11px] font-bold text-cyan-700 uppercase tracking-wider block">
                    Target Incident #{String(selectedIssue.id).slice(-4)}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5 leading-snug">
                    {selectedIssue.title}
                  </h3>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    (selectedIssue.priority || selectedIssue.severity || '').toLowerCase() === 'high'
                      ? 'bg-rose-50 text-rose-600 border border-rose-200'
                      : (selectedIssue.priority || selectedIssue.severity || '').toLowerCase() === 'medium'
                      ? 'bg-amber-50 text-amber-600 border border-amber-200'
                      : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                  }`}
                >
                  {selectedIssue.priority || selectedIssue.severity || 'Normal'}
                </span>
              </div>

              {/* Geo info pills */}
              <div className="space-y-2 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">Location Coordinates</span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                    <span className="truncate">{selectedIssue.location || selectedIssue.city || 'Coordinates Plotted'}</span>
                  </span>
                  {(selectedIssue.latitude || selectedIssue.lat) && (
                    <span className="text-[10px] text-cyan-700 font-mono block mt-1">
                      GPS: {Number(selectedIssue.latitude || selectedIssue.lat).toFixed(5)}, {Number(selectedIssue.longitude || selectedIssue.lng).toFixed(5)}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">Defect Type</span>
                    <span className="font-bold text-slate-800 mt-0.5 block truncate">
                      {selectedIssue.category || 'Road Defect'}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">Current Status</span>
                    <span className="font-bold text-cyan-700 mt-0.5 block capitalize">
                      {selectedIssue.status || 'Reported'}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">Responsible Department</span>
                  <span className="font-medium text-slate-700 mt-0.5 block truncate">
                    {selectedIssue.department || 'Public Works Department (PWD)'}
                  </span>
                </div>

                <div className="bg-cyan-50/50 p-2.5 rounded-xl border border-cyan-100">
                  <span className="text-cyan-900 block text-[10px] font-semibold">Incident Details</span>
                  <p className="text-slate-600 text-xs mt-1 leading-relaxed line-clamp-3">
                    {selectedIssue.details || selectedIssue.description || 'Live citizen submission recorded in database.'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  onClick={() => onDispatchCrew(selectedIssue.id, 'Rapid Asphalt Patch Crew #1')}
                  className="w-full py-2.5 px-4 bg-[#0c6b82] hover:bg-[#0a5c70] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Dispatch Maintenance Crew</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      const current = (selectedIssue.status || '').toLowerCase()
                      const next = current === 'resolved' ? 'In Progress' : 'Resolved'
                      onUpdateStatus(selectedIssue.id, next)
                    }}
                    className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-emerald-200"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{(selectedIssue.status || '').toLowerCase() === 'resolved' ? 'Reopen' : 'Mark Fixed'}</span>
                  </button>

                  <button
                    onClick={() => onOpenReportModal(selectedIssue)}
                    className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Full Details</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              <MapPin className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              Select an incident marker on the map to review details.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
