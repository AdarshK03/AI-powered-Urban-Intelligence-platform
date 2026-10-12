import React, { useState, useMemo } from 'react'
import {
  Search,
  Filter,
  Plus,
  Download,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Building2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

export default function AllIssuesTab({
  issues,
  onOpenReportModal,
  onOpenNewIssueModal,
  onDeleteIssue,
  onUpdateStatus,
  onExportCSV,
  departments,
  categories,
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [deptFilter, setDeptFilter] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  // Filtered issues list
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (categoryFilter !== 'All' && issue.category !== categoryFilter) return false
      if (priorityFilter !== 'All' && issue.priority !== priorityFilter) return false
      if (statusFilter !== 'All' && issue.status !== statusFilter) return false
      if (deptFilter !== 'All' && issue.department !== deptFilter) return false

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchTitle = issue.title.toLowerCase().includes(q)
        const matchLoc = issue.location.toLowerCase().includes(q)
        const matchCat = issue.category.toLowerCase().includes(q)
        const matchDept = issue.department && issue.department.toLowerCase().includes(q)
        const matchId = String(issue.id).includes(q)
        return matchTitle || matchLoc || matchCat || matchDept || matchId
      }
      return true
    })
  }, [issues, categoryFilter, priorityFilter, statusFilter, deptFilter, searchQuery])

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredIssues.length / itemsPerPage))
  const paginatedIssues = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredIssues.slice(start, start + itemsPerPage)
  }, [filteredIssues, currentPage, itemsPerPage])

  const resetFilters = () => {
    setSearchQuery('')
    setCategoryFilter('All')
    setPriorityFilter('All')
    setStatusFilter('All')
    setDeptFilter('All')
    setCurrentPage(1)
  }

  const exportIssuesCSV = () => {
    const headers = ['ID', 'Title', 'Location', 'Category', 'Priority', 'Status', 'Department', 'Reported On']
    const rows = filteredIssues.map((i) => [
      i.id,
      `"${i.title.replace(/"/g, '""')}"`,
      `"${i.location.replace(/"/g, '""')}"`,
      i.category,
      i.priority,
      i.status,
      `"${(i.department || '').replace(/"/g, '""')}"`,
      i.reportedOn,
    ])

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `urban_issues_export_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    if (onExportCSV) onExportCSV(filteredIssues.length)
  }

  return (
    <div className="space-y-5">
      {/* Top Controls Bar */}
      <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">All Issues Database</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Showing {filteredIssues.length} total municipal road reports across city zones
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={exportIssuesCSV}
            className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenNewIssueModal}
            className="px-4 py-2 bg-[#0c6b82] hover:bg-[#0a5c70] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Log New Issue</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-1">
            <input
              type="text"
              placeholder="Search by title, road..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-600"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          {/* Category */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-600/20"
            >
              <option value="All">All Categories</option>
              {categories.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-600/20"
            >
              <option value="All">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-600/20"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Verified">Verified</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          {/* Reset Filters */}
          <div className="flex items-center gap-2">
            <button
              onClick={resetFilters}
              className="w-full px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-[20px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-[13px]">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold text-[11px]">
                <th className="pb-3 px-3.5 font-semibold">Incident #</th>
                <th className="pb-3 px-3.5 font-semibold">Defect Title</th>
                <th className="pb-3 px-3.5 font-semibold">Location</th>
                <th className="pb-3 px-3.5 font-semibold">Category</th>
                <th className="pb-3 px-3.5 font-semibold">Priority</th>
                <th className="pb-3 px-3.5 font-semibold">Status</th>
                <th className="pb-3 px-3.5 font-semibold">Department</th>
                <th className="pb-3 px-3.5 font-semibold">Reported</th>
                <th className="pb-3 px-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/70">
              {paginatedIssues.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-10 text-slate-400 text-xs">
                    <p className="font-semibold text-slate-600">No issues matching criteria</p>
                    <p className="mt-1">Try adjusting your filters or search keywords.</p>
                  </td>
                </tr>
              ) : (
                paginatedIssues.map((issue) => (
                  <tr
                    key={issue.id}
                    className="hover:bg-slate-50/70 transition-colors text-slate-700"
                  >
                    <td className="py-3.5 px-3.5 font-bold text-cyan-800">
                      #{issue.id > 1000 ? String(issue.id).slice(-4) : issue.id}
                    </td>

                    <td className="py-3.5 px-3.5 font-semibold text-slate-800 max-w-xs">
                      <div>{issue.title}</div>
                      {issue.assignedCrew && (
                        <div className="text-[10px] text-cyan-600 mt-0.5">
                          Crew: {issue.assignedCrew}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-3.5 text-slate-600 whitespace-nowrap">{issue.location}</td>

                    <td className="py-3.5 px-3.5 text-slate-600">
                      <span className="font-medium px-2 py-0.5 bg-slate-100 rounded-md text-slate-700">
                        {issue.category}
                      </span>
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-3.5">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          issue.priority === 'High'
                            ? 'bg-rose-50 text-rose-600 border border-rose-200'
                            : issue.priority === 'Medium'
                            ? 'bg-amber-50 text-amber-600 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        }`}
                      >
                        {issue.priority}
                      </span>
                    </td>

                    {/* Status with quick switcher button */}
                    <td className="py-3.5 px-3.5">
                      <button
                        onClick={() => {
                          const next =
                            issue.status === 'Pending'
                              ? 'In Progress'
                              : issue.status === 'In Progress'
                              ? 'Resolved'
                              : 'Pending'
                          onUpdateStatus(issue.id, next)
                        }}
                        title="Click to advance status"
                        className={`px-3 py-0.5 rounded-full text-xs font-semibold cursor-pointer transition-all hover:scale-105 inline-flex items-center gap-1 ${
                          issue.status === 'In Progress'
                            ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                            : issue.status === 'Pending'
                            ? 'bg-amber-50 text-amber-600 border border-amber-200'
                            : issue.status === 'Verified'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        <span>{issue.status}</span>
                      </button>
                    </td>

                    <td className="py-3.5 px-3.5 text-slate-500 text-[11px] max-w-[150px] truncate">
                      {issue.department || 'Urban Works'}
                    </td>

                    <td className="py-3.5 px-3.5 text-slate-500 whitespace-nowrap">{issue.reportedOn}</td>

                    {/* Action buttons */}
                    <td className="py-3.5 px-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onOpenReportModal(issue)}
                          className="p-1.5 bg-slate-100 hover:bg-cyan-50 hover:text-cyan-800 text-slate-600 rounded-lg transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onDeleteIssue(issue.id)}
                          className="p-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 rounded-lg transition-colors cursor-pointer"
                          title="Delete Issue"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, filteredIssues.length)} of {filteredIssues.length} entries
          </p>

          <div className="flex items-center gap-1.5">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 ${
                currentPage === 1
                  ? 'border-slate-100 text-slate-300 cursor-not-allowed'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  currentPage === i + 1
                    ? 'bg-[#0c6b82] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 ${
                currentPage === totalPages
                  ? 'border-slate-100 text-slate-300 cursor-not-allowed'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer'
              }`}
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
