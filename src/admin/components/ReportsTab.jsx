import React, { useState } from 'react'
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Building2,
  CheckCircle2,
  Eye,
  X,
  FileSpreadsheet,
  Clock,
} from 'lucide-react'

export default function ReportsTab({ issues, departments, onTriggerToast }) {
  const [selectedDept, setSelectedDept] = useState('All')
  const [reportPreview, setReportPreview] = useState(null)

  const reportTemplates = [
    {
      id: 'rep-1',
      title: 'Monthly Municipal Road Health & Surface Defect Audit',
      subtitle: 'Comprehensive breakdown of asphalt erosion, potholes, and road repairs.',
      period: 'October 2024',
      status: 'Ready',
      fileSize: '2.4 MB',
    },
    {
      id: 'rep-2',
      title: 'High-Hazard Pothole & Public Safety Risk Assessment',
      subtitle: 'Critical lane hazards requiring urgent civic engineering intervention.',
      period: 'Last 30 Days',
      status: 'Ready',
      fileSize: '1.8 MB',
    },
    {
      id: 'rep-3',
      title: 'Contractor SLA & Departmental Compliance Audit',
      subtitle: 'Performance benchmarks of PWD, MCD, and electrical maintenance squads.',
      period: 'Q3 2024',
      status: 'Ready',
      fileSize: '3.1 MB',
    },
    {
      id: 'rep-4',
      title: 'Citizen Road Grievance & SLA Resolution Scorecard',
      subtitle: 'Public satisfaction, verified resolutions, and pending feedback log.',
      period: 'Year to Date',
      status: 'Ready',
      fileSize: '4.2 MB',
    },
  ]

  const downloadReportFile = (title) => {
    const headers = ['Incident ID', 'Title', 'Location', 'Category', 'Priority', 'Status', 'Department', 'Date']
    const rows = issues.map((i) => [
      i.id,
      `"${i.title.replace(/"/g, '""')}"`,
      `"${i.location.replace(/"/g, '""')}"`,
      i.category,
      i.priority,
      i.status,
      `"${(i.department || '').replace(/"/g, '""')}"`,
      i.reportedOn,
    ])

    const csvContent = [
      `Urban Intelligence Platform - Official Audit Report: ${title}`,
      `Generated On: ${new Date().toLocaleString()}`,
      '',
      headers.join(','),
      ...rows.map((r) => r.join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    onTriggerToast(`Downloaded "${title}" successfully`, 'success')
  }

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Civic Audit Reports Center</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Download certified road condition audit sheets, SLA scorecards, and regulatory files
          </p>
        </div>

        <button
          onClick={() => downloadReportFile('All_Comprehensive_Audits')}
          className="px-4 py-2 bg-[#0c6b82] hover:bg-[#0a5c70] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Generate Full Audit Package</span>
        </button>
      </div>

      {/* Reports Template List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {reportTemplates.map((template) => (
          <div
            key={template.id}
            className="bg-white rounded-[20px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col justify-between transition-all hover:shadow-md"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {template.status}
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-900 mt-3">{template.title}</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{template.subtitle}</p>

              <div className="mt-4 flex items-center gap-4 text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Period: {template.period}</span>
                </span>
                <span>Size: {template.fileSize}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2">
              <button
                onClick={() => downloadReportFile(template.title)}
                className="flex-1 py-2 px-3 bg-[#0c6b82] hover:bg-[#0a5c70] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download CSV</span>
              </button>

              <button
                onClick={() => setReportPreview(template)}
                className="py-2 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span>Preview</span>
              </button>

              <button
                onClick={() => {
                  window.print()
                }}
                className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors cursor-pointer"
                title="Print Audit Report"
              >
                <Printer className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {reportPreview && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[85vh] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-cyan-700 uppercase tracking-wider block">
                    Document Preview
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">{reportPreview.title}</h3>
                </div>
                <button
                  onClick={() => setReportPreview(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-4 space-y-3 overflow-y-auto max-h-[50vh] text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Audited Entries</span>
                      <span className="font-bold text-slate-800 text-sm mt-0.5 block">{issues.length} Issues</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Compliance Score</span>
                      <span className="font-bold text-emerald-600 text-sm mt-0.5 block">94.2% Passed</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Audit Cycle</span>
                      <span className="font-bold text-slate-800 text-sm mt-0.5 block">{reportPreview.period}</span>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                      <tr>
                        <th className="p-2">ID</th>
                        <th className="p-2">Title</th>
                        <th className="p-2">Category</th>
                        <th className="p-2">Priority</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {issues.slice(0, 5).map((i) => (
                        <tr key={i.id}>
                          <td className="p-2 font-mono text-[11px]">#{i.id > 1000 ? String(i.id).slice(-4) : i.id}</td>
                          <td className="p-2 font-medium">{i.title}</td>
                          <td className="p-2">{i.category}</td>
                          <td className="p-2">{i.priority}</td>
                          <td className="p-2 font-semibold text-cyan-700">{i.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setReportPreview(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  downloadReportFile(reportPreview.title)
                  setReportPreview(null)
                }}
                className="px-4 py-2 bg-[#0c6b82] hover:bg-[#0a5c70] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Report</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
