import React, { useState } from 'react'
import {
  Building2,
  Mail,
  Phone,
  ArrowUpRight,
  Download,
  CheckCircle2,
  Clock,
  User,
  X,
  ExternalLink,
} from 'lucide-react'

export default function DepartmentsTab({
  departments,
  issues,
  onNavigateToDeptIssues,
  onDownloadDeptReport,
}) {
  const [contactModalDept, setContactModalDept] = useState(null)

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Municipal Departments & Civic Bodies
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational performance, officer contacts, and SLA resolution tracking
          </p>
        </div>

        <button
          onClick={() => onDownloadDeptReport('all')}
          className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Export All Dept Audits</span>
        </button>
      </div>

      {/* Department Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {departments.map((dept) => {
          const deptIssues = issues.filter(
            (i) => i.department && i.department.toLowerCase().includes(dept.shortCode.toLowerCase())
          )
          const resolvedCount = deptIssues.filter((i) => (i.status || '').toLowerCase() === 'resolved').length
          const totalCount = deptIssues.length
          const complianceRate = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 100

          return (
            <div
              key={dept.id}
              className="bg-white rounded-[20px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col justify-between transition-all hover:shadow-md"
            >
              <div>
                <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center font-bold text-xs">
                      {dept.shortCode}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 leading-tight">
                        {dept.name}
                      </h3>
                      <span className="text-[11px] text-slate-400">Head: {dept.officer}</span>
                    </div>
                  </div>
                </div>

                {/* Metrics */}
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">Active Work Orders</span>
                    <span className="text-base font-bold text-slate-800 mt-0.5 block">
                      {deptIssues.filter((i) => i.status !== 'Resolved').length}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">Resolved Total</span>
                    <span className="text-base font-bold text-emerald-600 mt-0.5 block">
                      {resolvedCount}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">Avg Response Time</span>
                    <span className="font-bold text-slate-800 mt-0.5 block">
                      {dept.avgResponseHours || 18} Hours
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">SLA Compliance</span>
                    <span className="font-bold text-cyan-700 mt-0.5 block">
                      {complianceRate}%
                    </span>
                  </div>
                </div>

                {/* Officer Quick Info */}
                <div className="mt-3 p-2.5 bg-slate-50 rounded-xl space-y-1 text-xs text-slate-600">
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{dept.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{dept.phone}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                <button
                  onClick={() => onNavigateToDeptIssues(dept.name)}
                  className="flex-1 py-2 px-3 bg-[#0c6b82] hover:bg-[#0a5c70] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>View Tickets</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setContactModalDept(dept)}
                  className="py-2 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Contact
                </button>

                <button
                  onClick={() => onDownloadDeptReport(dept.name)}
                  className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl transition-colors cursor-pointer"
                  title="Download Dept Audit Sheet"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Contact Officer Modal */}
      {contactModalDept && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Department Official</h3>
              <button
                onClick={() => setContactModalDept(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs sm:text-sm">
              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="text-slate-400 block text-[10px]">Official Head of Department</span>
                <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                  {contactModalDept.officer}
                </span>
                <span className="text-xs text-slate-500">{contactModalDept.name}</span>
              </div>

              <div className="space-y-2">
                <a
                  href={`mailto:${contactModalDept.email}`}
                  className="w-full py-2.5 px-3 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <Mail className="w-4 h-4 text-cyan-600" />
                  <span>Send Official Email</span>
                </a>

                <a
                  href={`tel:${contactModalDept.phone}`}
                  className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <Phone className="w-4 h-4 text-slate-600" />
                  <span>Call Hotline: {contactModalDept.phone}</span>
                </a>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setContactModalDept(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
