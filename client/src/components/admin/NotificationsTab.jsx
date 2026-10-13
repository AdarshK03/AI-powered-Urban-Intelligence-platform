import React, { useState } from 'react'
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  Trash2,
  Eye,
  CheckCheck,
  RotateCcw,
} from 'lucide-react'

export default function NotificationsTab({
  notifications,
  onMarkAllAsRead,
  onClearAll,
  onToggleRead,
  onDeleteNotification,
  onOpenReportModal,
  issues,
}) {
  const [filterType, setFilterType] = useState('All')

  const filtered = notifications.filter((n) => {
    if (filterType === 'Unread' && !n.unread) return false
    if (filterType === 'Critical' && n.type !== 'urgent') return false
    return true
  })

  const unreadCount = notifications.filter((n) => n.unread).length

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Notification Center</h2>
            {unreadCount > 0 && (
              <span className="bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold px-2 py-0.5 rounded-full">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated camera triggers, hazardous defect alerts, and field crew telemetry
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onMarkAllAsRead}
            className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5 text-slate-500" />
            <span>Mark All as Read</span>
          </button>

          <button
            onClick={onClearAll}
            className="px-3.5 py-2 border border-rose-200 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2">
        {['All', 'Unread', 'Critical'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterType(tab)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              filterType === tab
                ? 'bg-[#0c6b82] text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab} Alerts
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-[20px] p-10 text-center text-slate-400 text-xs border border-slate-100">
            <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-600">No notifications in this view</p>
            <p className="mt-0.5">You're all caught up with municipal alerts.</p>
          </div>
        ) : (
          filtered.map((item) => {
            const relatedIssue = item.issueId ? issues.find((i) => i.id === item.issueId) : null

            return (
              <div
                key={item.id}
                className={`bg-white rounded-[18px] p-4.5 border transition-all duration-200 hover:shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  item.unread
                    ? 'border-cyan-300 bg-cyan-50/15'
                    : 'border-slate-100 text-slate-600'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      item.type === 'urgent'
                        ? 'bg-rose-50 text-rose-600'
                        : item.type === 'warning'
                        ? 'bg-amber-50 text-amber-600'
                        : item.type === 'success'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-cyan-50 text-cyan-600'
                    }`}
                  >
                    {item.type === 'urgent' ? (
                      <AlertTriangle className="w-4.5 h-4.5" />
                    ) : item.type === 'success' ? (
                      <CheckCircle2 className="w-4.5 h-4.5" />
                    ) : (
                      <Bell className="w-4.5 h-4.5" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4
                        className={`text-sm font-bold ${
                          item.unread ? 'text-slate-900' : 'text-slate-700'
                        }`}
                      >
                        {item.title}
                      </h4>
                      {item.unread && (
                        <span className="w-2 h-2 rounded-full bg-cyan-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{item.message}</p>
                    <span className="text-[11px] text-slate-400 mt-1 block">{item.time}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {relatedIssue && (
                    <button
                      onClick={() => onOpenReportModal(relatedIssue)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-cyan-50 hover:text-cyan-800 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>View Issue</span>
                    </button>
                  )}

                  <button
                    onClick={() => onToggleRead(item.id)}
                    className="p-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                    title={item.unread ? 'Mark as read' : 'Mark as unread'}
                  >
                    {item.unread ? <CheckCheck className="w-3.5 h-3.5" /> : <RotateCcw className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => onDeleteNotification(item.id)}
                    className="p-1.5 border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded-lg text-xs transition-colors cursor-pointer"
                    title="Dismiss Notification"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
