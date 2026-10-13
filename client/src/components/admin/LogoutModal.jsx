import React from 'react'
import { LogOut, X } from 'lucide-react'

export default function LogoutModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <LogOut className="w-6 h-6" />
        </div>

        <h3 className="text-base font-bold text-slate-900">Sign Out of Console?</h3>
        <p className="text-xs text-slate-500 mt-1">
          Are you sure you want to end your current session on the Urban Intelligence platform?
        </p>

        <div className="mt-5 flex items-center justify-center gap-2.5">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            Confirm Logout
          </button>
        </div>
      </div>
    </div>
  )
}
