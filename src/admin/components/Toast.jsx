import React from 'react'
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'

export default function Toast({ toast, onClose }) {
  if (!toast) return null

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />,
    info: <Info className="w-4 h-4 text-cyan-500 shrink-0" />,
  }

  const bgStyles = {
    success: 'bg-white border-emerald-200 text-slate-800 shadow-lg shadow-emerald-500/10',
    warning: 'bg-white border-amber-200 text-slate-800 shadow-lg shadow-amber-500/10',
    info: 'bg-white border-cyan-200 text-slate-800 shadow-lg shadow-cyan-500/10',
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-xs sm:text-sm font-medium ${
          bgStyles[toast.type || 'info']
        }`}
      >
        {icons[toast.type || 'info']}
        <span>{toast.message}</span>
        <button
          onClick={onClose}
          className="ml-2 text-slate-400 hover:text-slate-600 p-0.5 rounded-md transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
