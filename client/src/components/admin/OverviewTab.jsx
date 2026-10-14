import React, { useState } from 'react'
import {
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  Filter,
  Eye,
  ArrowUpRight,
  RefreshCw,
  FolderGit2,
} from 'lucide-react'

// Hook for smooth numerical interpolation
function useAnimatedCount(targetValue, duration = 650) {
  const [displayValue, setDisplayValue] = useState(targetValue)

  React.useEffect(() => {
    let startTimestamp = null
    const startValue = displayValue

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp
      const progress = Math.min((timestamp - startTimestamp) / duration, 1)
      const easedProgress = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(startValue + (targetValue - startValue) * easedProgress)
      setDisplayValue(current)

      if (progress < 1) {
        window.requestAnimationFrame(step)
      }
    }

    const animId = window.requestAnimationFrame(step)
    return () => window.cancelAnimationFrame(animId)
  }, [targetValue, duration])

  return displayValue
}

// KPI Summary Card with click-to-filter support
function StatCard({ iconRenderer, label, value, trend, trendColor, isSelected, onClick }) {
  const animatedValue = useAnimatedCount(value)

  return (
    <button
      onClick={onClick}
      className={`text-left w-full bg-white rounded-[18px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border transition-all duration-300 hover:shadow-md cursor-pointer ${
        isSelected ? 'border-cyan-600 ring-2 ring-cyan-600/20 bg-cyan-50/20' : 'border-slate-100'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {iconRenderer}
          <span className="text-[13px] font-medium text-slate-500">{label}</span>
        </div>
        {isSelected && (
          <span className="text-[10px] font-bold text-cyan-700 bg-cyan-100 px-2 py-0.5 rounded-full">
            Filtered
          </span>
        )}
      </div>

      <div className="mt-3">
        <div className="text-[29px] font-bold text-slate-800 tracking-tight leading-none">
          {animatedValue.toLocaleString()}
        </div>
        <div className="mt-2.5 flex items-center justify-between">
          <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded ${trendColor}`}>
            <span className="mr-0.5">↑</span> {trend}
          </span>
          <span className="text-[11px] text-slate-400 group-hover:text-slate-600">Filter list →</span>
        </div>
      </div>
    </button>
  )
}

// Donut Chart Component
function DonutChart({ categories, hoveredCategory, setHoveredCategory, activeFilter, setActiveFilter }) {
  const size = 185
  const strokeWidth = 26
  const radius = (size - strokeWidth) / 2
  const center = size / 2
  const circumference = 2 * Math.PI * radius

  let accumulatedPercent = 0

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke="#f1f5f9"
          strokeWidth={strokeWidth}
        />
        {categories.map((cat) => {
          const strokeDasharray = `${(cat.percentage / 100) * circumference} ${circumference}`
          const strokeDashoffset = -((accumulatedPercent / 100) * circumference)
          accumulatedPercent += cat.percentage

          const isHovered = hoveredCategory === cat.name
          const isFiltered = activeFilter === cat.name

          return (
            <circle
              key={cat.name}
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke={cat.color}
              strokeWidth={isHovered || isFiltered ? strokeWidth + 4 : strokeWidth}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="butt"
              className="transition-all duration-300 cursor-pointer"
              onMouseEnter={() => setHoveredCategory(cat.name)}
              onMouseLeave={() => setHoveredCategory(null)}
              onClick={() => setActiveFilter(activeFilter === cat.name ? null : cat.name)}
            />
          )
        })}
      </svg>
      {/* Centered label inside donut */}
      <div className="absolute text-center pointer-events-none">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
          Total
        </span>
        <span className="text-xl font-bold text-slate-800">100%</span>
      </div>
    </div>
  )
}

export default function OverviewTab({
  currentData,
  categoryFilter,
  setCategoryFilter,
  priorityFilter,
  setPriorityFilter,
  statusFilter,
  setStatusFilter,
  onOpenReportModal,
  onOpenNewIssueModal,
  onNavigateToAllIssues,
}) {
  const [hoveredCategory, setHoveredCategory] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Filter reports
  const filteredReports = currentData.reports.filter((r) => {
    if (categoryFilter && r.category !== categoryFilter) return false
    if (priorityFilter && r.priority !== priorityFilter) return false
    if (statusFilter && r.status !== statusFilter) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      return (
        r.title.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        (r.department && r.department.toLowerCase().includes(q))
      )
    }
    return true
  })

  return (
    <div className="space-y-5">
      {/* Top 4 KPI Cards - fully interactive! */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Reports */}
        <StatCard
          iconRenderer={
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 fill-blue-500" viewBox="0 0 24 24">
                <path d="M4 4h7a2 2 0 0 1 2 2v1h-7a2 2 0 0 0-2 2v9H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm4 4h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2zm4 3a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-6zm0 4a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-6z" />
              </svg>
            </div>
          }
          label="Total Reports"
          value={currentData.stats.total}
          trend={currentData.stats.totalTrend}
          trendColor="text-emerald-600 bg-emerald-50"
          isSelected={!statusFilter}
          onClick={() => setStatusFilter(null)}
        />

        {/* Pending */}
        <StatCard
          iconRenderer={
            <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
              <div className="w-6 h-6 rounded-full border-2 border-amber-400 bg-amber-100/50 flex items-center justify-center text-[10px] font-bold text-amber-600">
                !
              </div>
            </div>
          }
          label="Pending"
          value={currentData.stats.pending}
          trend={currentData.stats.pendingTrend}
          trendColor="text-rose-500 bg-rose-50"
          isSelected={statusFilter === 'Pending'}
          onClick={() => setStatusFilter(statusFilter === 'Pending' ? null : 'Pending')}
        />

        {/* In Progress */}
        <StatCard
          iconRenderer={
            <div className="w-8 h-8 rounded-full bg-cyan-50 text-cyan-500 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-cyan-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm-1-4.5a1.5 1.5 0 0 1-1.5-1.5V7a1.5 1.5 0 0 1 3 0v3.5A1.5 1.5 0 0 1 12 12z" />
              </svg>
            </div>
          }
          label="In Progress"
          value={currentData.stats.inProgress}
          trend={currentData.stats.inProgressTrend}
          trendColor="text-cyan-600 bg-cyan-50"
          isSelected={statusFilter === 'In Progress'}
          onClick={() => setStatusFilter(statusFilter === 'In Progress' ? null : 'In Progress')}
        />

        {/* Resolved */}
        <StatCard
          iconRenderer={
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 fill-emerald-100" />
            </div>
          }
          label="Resolved"
          value={currentData.stats.resolved}
          trend={currentData.stats.resolvedTrend}
          trendColor="text-emerald-600 bg-emerald-50"
          isSelected={statusFilter === 'Resolved'}
          onClick={() => setStatusFilter(statusFilter === 'Resolved' ? null : 'Resolved')}
        />
      </div>

      {/* Middle Two Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Issues by Category */}
        <div className="bg-white rounded-[20px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-bold text-slate-800">Issues by Category</h3>
            {categoryFilter && (
              <button
                onClick={() => setCategoryFilter(null)}
                className="text-xs text-cyan-600 hover:text-cyan-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                Clear Filter ({categoryFilter}) ✕
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 my-auto">
            {/* Donut chart */}
            <div className="shrink-0">
              <DonutChart
                categories={currentData.categories}
                hoveredCategory={hoveredCategory}
                setHoveredCategory={setHoveredCategory}
                activeFilter={categoryFilter}
                setActiveFilter={setCategoryFilter}
              />
            </div>

            {/* Legend List */}
            <div className="w-full sm:w-[220px] space-y-1.5">
              {currentData.categories.map((cat) => {
                const isSelected = categoryFilter === cat.name
                const isHovered = hoveredCategory === cat.name

                return (
                  <div
                    key={cat.name}
                    onClick={() => setCategoryFilter(isSelected ? null : cat.name)}
                    onMouseEnter={() => setHoveredCategory(cat.name)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    className={`flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-cyan-50 font-bold ring-1 ring-cyan-200'
                        : isHovered
                        ? 'bg-slate-50'
                        : 'hover:bg-slate-50/70'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className={`${isSelected ? 'text-cyan-900 font-bold' : 'text-slate-600 font-medium'}`}>
                        {cat.name}
                      </span>
                    </div>
                    <span className="font-semibold text-slate-800">{cat.percentage}%</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Priority-wise Issues */}
        <div className="bg-white rounded-[20px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-bold text-slate-800">Priority-wise Issues</h3>
            {priorityFilter && (
              <button
                onClick={() => setPriorityFilter(null)}
                className="text-xs text-cyan-600 hover:text-cyan-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                Clear Filter ({priorityFilter}) ✕
              </button>
            )}
          </div>

          <div className="space-y-4 my-auto py-2">
            {currentData.priorities.map((item) => {
              const isSelected = priorityFilter === item.name

              return (
                <div
                  key={item.name}
                  onClick={() => setPriorityFilter(isSelected ? null : item.name)}
                  className={`cursor-pointer p-2 rounded-xl transition-all ${
                    isSelected ? 'bg-cyan-50/70 ring-1 ring-cyan-300' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="w-16 text-xs sm:text-[13px] font-semibold text-slate-700">
                      {item.name}
                    </span>

                    {/* Progress Bar */}
                    <div className="flex-1 bg-slate-100 rounded-lg h-7 relative flex items-center overflow-hidden">
                      <div
                        className="h-full rounded-lg transition-all duration-700 ease-out"
                        style={{
                          backgroundColor: item.color,
                          width: `${item.percentWidth}%`,
                        }}
                      />
                      <span className="absolute right-3 text-xs font-bold text-slate-700">
                        {item.count.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Click priority to filter table</span>
            <span className="text-cyan-700 font-medium">Automatic Real-Time AI Triage</span>
          </div>
        </div>
      </div>

      {/* Bottom Table: Recent Reports */}
      <div className="bg-white rounded-[20px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-[15px] font-bold text-slate-800">Recent Reports</h3>
            {(categoryFilter || priorityFilter || statusFilter) && (
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs text-slate-500">Active Filters:</span>
                {categoryFilter && (
                  <span className="bg-cyan-50 text-cyan-800 text-xs px-2 py-0.5 rounded-md font-semibold flex items-center gap-1">
                    {categoryFilter}
                    <button onClick={() => setCategoryFilter(null)}>✕</button>
                  </span>
                )}
                {priorityFilter && (
                  <span className="bg-cyan-50 text-cyan-800 text-xs px-2 py-0.5 rounded-md font-semibold flex items-center gap-1">
                    {priorityFilter}
                    <button onClick={() => setPriorityFilter(null)}>✕</button>
                  </span>
                )}
                {statusFilter && (
                  <span className="bg-cyan-50 text-cyan-800 text-xs px-2 py-0.5 rounded-md font-semibold flex items-center gap-1">
                    {statusFilter}
                    <button onClick={() => setStatusFilter(null)}>✕</button>
                  </span>
                )}
                <button
                  onClick={() => {
                    setCategoryFilter(null)
                    setPriorityFilter(null)
                    setStatusFilter(null)
                  }}
                  className="text-xs text-rose-600 hover:underline font-semibold"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>

          {/* Search bar & Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <input
                type="text"
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-1 focus:ring-cyan-600"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>

            <button
              onClick={onOpenNewIssueModal}
              className="bg-[#0c6b82] hover:bg-[#0a5c70] text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Report Issue</span>
            </button>

            <button
              onClick={onNavigateToAllIssues}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-left text-xs sm:text-[13px]">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold text-[11px]">
                <th className="pb-3 px-3.5 font-semibold">#</th>
                <th className="pb-3 px-3.5 font-semibold">Title</th>
                <th className="pb-3 px-3.5 font-semibold">Location</th>
                <th className="pb-3 px-3.5 font-semibold">Category</th>
                <th className="pb-3 px-3.5 font-semibold">Priority</th>
                <th className="pb-3 px-3.5 font-semibold">Status</th>
                <th className="pb-3 px-3.5 font-semibold">Reported On</th>
                <th className="pb-3 px-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/70">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-slate-400 text-xs">
                    No records found matching filters.
                  </td>
                </tr>
              ) : (
                filteredReports.map((report, idx) => (
                  <tr
                    key={report.id}
                    className="hover:bg-slate-50/60 transition-colors text-slate-700"
                  >
                    <td className="py-3.5 px-3.5 font-medium text-slate-400">{idx + 1}</td>
                    <td className="py-3.5 px-3.5 font-medium text-slate-800">
                      <div className="font-semibold">{report.title}</div>
                      {report.department && (
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">{report.department}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-3.5 text-slate-600">
                      <div className="font-medium text-slate-800">{report.location}</div>
                      <div className="text-[11px] text-cyan-700 font-semibold flex items-center gap-1 mt-0.5">
                        <span>📍 {(!report.city || report.city === 'All Cities') ? 'Pune' : report.city}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3.5 text-slate-600">
                      <span className="font-medium">{report.category}</span>
                    </td>

                    {/* Priority Badge */}
                    <td className="py-3.5 px-3.5">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          report.priority === 'High'
                            ? 'bg-rose-50 text-rose-600 border border-rose-200'
                            : report.priority === 'Medium'
                            ? 'bg-amber-50 text-amber-600 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        }`}
                      >
                        {report.priority}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-3.5">
                      <span
                        className={`inline-block px-3 py-0.5 rounded-full text-xs font-semibold ${
                          report.status === 'In Progress'
                            ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                            : report.status === 'Pending'
                            ? 'bg-amber-50 text-amber-600 border border-amber-200'
                            : report.status === 'Verified'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {report.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-3.5 text-slate-500 whitespace-nowrap">
                      {report.reportedOn}
                    </td>

                    {/* Action View Button */}
                    <td className="py-3.5 px-3.5 text-right">
                      <button
                        onClick={() => onOpenReportModal(report)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3 text-slate-500" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
