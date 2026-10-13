import React, { useState } from 'react'
import {
  MapPin,
  Layers,
  ZoomIn,
  ZoomOut,
  Crosshair,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Send,
  Eye,
  Activity,
  Compass,
} from 'lucide-react'

export default function MapViewTab({
  issues,
  onOpenReportModal,
  onUpdateStatus,
  onDispatchCrew,
  categories,
}) {
  const [selectedIssue, setSelectedIssue] = useState(issues[0] || null)
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [mapLayer, setMapLayer] = useState('gis') // 'gis' | 'satellite' | 'heatmap'
  const [zoomLevel, setZoomLevel] = useState(1)

  // Filtered map pins
  const visibleIssues = issues.filter((i) => {
    if (categoryFilter !== 'All' && i.category !== categoryFilter) return false
    if (priorityFilter !== 'All' && i.priority !== priorityFilter) return false
    return true
  })

  // Pre-mapped landmarks in Delhi Urban Region
  const citySectors = [
    { name: 'Connaught Place', x: 48, y: 35, code: 'Z-01' },
    { name: 'Karol Bagh', x: 32, y: 30, code: 'Z-02' },
    { name: 'Lajpat Nagar', x: 62, y: 60, code: 'Z-03' },
    { name: 'MG Road Corridor', x: 25, y: 75, code: 'Z-04' },
    { name: 'Saket Metro', x: 50, y: 80, code: 'Z-05' },
    { name: 'Nehru Place Hub', x: 68, y: 70, code: 'Z-06' },
    { name: 'Rohini Sector 9', x: 20, y: 18, code: 'Z-07' },
    { name: 'Civil Lines', x: 55, y: 20, code: 'Z-08' },
  ]

  const getPinColor = (category, priority) => {
    if (priority === 'High') return '#ef4444' // Red
    if (priority === 'Medium') return '#f59e0b' // Amber
    return '#10b981' // Green
  }

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
              Live GPS Telemetry
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Geospatial tracking of road surface hazards, open drains, and street lighting
          </p>
        </div>

        {/* Layer & Filter Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
            <button
              onClick={() => setMapLayer('gis')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                mapLayer === 'gis' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              GIS Vector
            </button>
            <button
              onClick={() => setMapLayer('satellite')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                mapLayer === 'satellite' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Satellite
            </button>
            <button
              onClick={() => setMapLayer('heatmap')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                mapLayer === 'heatmap' ? 'bg-white text-rose-600 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Thermal Radar
            </button>
          </div>

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
        {/* Interactive Map Visual (2 cols) */}
        <div className="lg:col-span-2 bg-[#0a232f] rounded-[22px] p-4 shadow-md border border-slate-800 relative overflow-hidden min-h-[460px] flex flex-col justify-between">
          {/* Layer background effects */}
          {mapLayer === 'satellite' && (
            <div className="absolute inset-0 bg-[radial-gradient(#1e3a47_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />
          )}
          {mapLayer === 'heatmap' && (
            <div className="absolute inset-0 bg-radial from-rose-900/30 via-amber-900/20 to-transparent pointer-events-none" />
          )}

          {/* SVG Road Network Mesh Grid */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-25">
            <defs>
              <pattern id="roadGrid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#22d3ee" strokeWidth="0.8" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#roadGrid)" />
            {/* Major Arteries */}
            <path
              d="M 50 100 Q 250 150 450 120 T 750 300"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2.5"
              strokeDasharray="4 2"
            />
            <path
              d="M 120 400 Q 300 250 600 280 T 800 120"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2"
            />
            <path
              d="M 300 50 Q 380 260 420 480"
              fill="none"
              stroke="#0ea5e9"
              strokeWidth="3"
            />
          </svg>

          {/* Map Header Overlay */}
          <div className="relative z-10 flex items-center justify-between pointer-events-auto">
            <div className="bg-[#0c3947]/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-cyan-500/30 text-white text-xs flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '20s' }} />
              <span className="font-semibold">NCT Delhi Central Grid</span>
              <span className="text-[10px] text-cyan-300">28.6139° N, 77.2090° E</span>
            </div>

            {/* Map Controls */}
            <div className="flex items-center gap-1.5 bg-[#0c3947]/90 backdrop-blur-md p-1 rounded-xl border border-cyan-500/30">
              <button
                onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.1))}
                className="p-1 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.1))}
                className="p-1 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                className="p-1 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                title="Reset Center"
              >
                <Crosshair className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Interactive City Sectors & Pins Canvas */}
          <div
            className="relative flex-1 my-4 transition-transform duration-300"
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
          >
            {/* Sector Labels */}
            {citySectors.map((sector) => (
              <div
                key={sector.name}
                style={{ left: `${sector.x}%`, top: `${sector.y}%` }}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              >
                <div className="text-[10px] font-bold text-cyan-400/60 uppercase tracking-widest whitespace-nowrap">
                  {sector.name}
                </div>
              </div>
            ))}

            {/* Interactive Pins */}
            {visibleIssues.map((issue, idx) => {
              // Derive mock coordinates based on id
              const posX = ((issue.id * 37) % 70) + 15
              const posY = ((issue.id * 53) % 65) + 18
              const isSelected = selectedIssue?.id === issue.id
              const pinColor = getPinColor(issue.category, issue.priority)

              return (
                <div
                  key={issue.id}
                  style={{ left: `${posX}%`, top: `${posY}%` }}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group"
                  onClick={() => setSelectedIssue(issue)}
                >
                  {/* Pulse effect for High Priority */}
                  {issue.priority === 'High' && (
                    <span
                      className="absolute -inset-2 rounded-full animate-ping opacity-75"
                      style={{ backgroundColor: pinColor }}
                    />
                  )}

                  {/* Marker Pin */}
                  <div
                    className={`relative w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg transition-transform ${
                      isSelected ? 'scale-125 ring-3 ring-white' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: pinColor }}
                  >
                    <MapPin className="w-4 h-4 fill-white" />
                  </div>

                  {/* Floating tooltip */}
                  <div className="hidden group-hover:block absolute bottom-9 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-[10px] font-semibold py-1 px-2.5 rounded-lg shadow-xl whitespace-nowrap z-30 pointer-events-none">
                    {issue.title} ({issue.priority})
                  </div>
                </div>
              )
            })}
          </div>

          {/* Map Footer Legend */}
          <div className="relative z-10 flex items-center justify-between text-xs text-slate-300 bg-[#0c3947]/80 backdrop-blur-md px-4 py-2 rounded-xl border border-cyan-500/20 flex-wrap gap-2">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-[11px]">High Hazard ({visibleIssues.filter((i) => i.priority === 'High').length})</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-[11px]">Medium ({visibleIssues.filter((i) => i.priority === 'Medium').length})</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-[11px]">Low ({visibleIssues.filter((i) => i.priority === 'Low').length})</span>
              </span>
            </div>
            <div className="text-[11px] text-cyan-300">
              Click any pin to inspect defect telemetry
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
                    Target Incident #{selectedIssue.id > 1000 ? String(selectedIssue.id).slice(-4) : selectedIssue.id}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5 leading-snug">
                    {selectedIssue.title}
                  </h3>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    selectedIssue.priority === 'High'
                      ? 'bg-rose-50 text-rose-600 border border-rose-200'
                      : selectedIssue.priority === 'Medium'
                      ? 'bg-amber-50 text-amber-600 border border-amber-200'
                      : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                  }`}
                >
                  {selectedIssue.priority}
                </span>
              </div>

              {/* Geo info pills */}
              <div className="space-y-2 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">Location Coordinates</span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-cyan-600" />
                    {selectedIssue.location}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">Defect Type</span>
                    <span className="font-bold text-slate-800 mt-0.5 block">
                      {selectedIssue.category}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">Current Status</span>
                    <span className="font-bold text-cyan-700 mt-0.5 block">
                      {selectedIssue.status}
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
                    {selectedIssue.details}
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
                      const next =
                        selectedIssue.status === 'Resolved'
                          ? 'In Progress'
                          : 'Resolved'
                      onUpdateStatus(selectedIssue.id, next)
                    }}
                    className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-emerald-200"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{selectedIssue.status === 'Resolved' ? 'Reopen' : 'Mark Fixed'}</span>
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
              Select an incident marker on the map to review details.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
