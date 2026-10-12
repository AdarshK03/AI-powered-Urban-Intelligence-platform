import React, { useState } from 'react'
import {
  Settings,
  Sparkles,
  Bell,
  Clock,
  Shield,
  Save,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react'

export default function SettingsTab({ settings, onSaveSettings, onTriggerToast }) {
  const [formData, setFormData] = useState({ ...settings })
  const [isSaved, setIsSaved] = useState(false)

  const handleToggle = (key) => {
    setFormData((prev) => ({ ...prev, [key]: !prev[key] }))
    setIsSaved(false)
  }

  const handleChange = (key, val) => {
    setFormData((prev) => ({ ...prev, [key]: val }))
    setIsSaved(false)
  }

  const handleSave = (e) => {
    e.preventDefault()
    onSaveSettings(formData)
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 3000)
    onTriggerToast('Platform configuration saved successfully', 'success')
  }

  const handleReset = () => {
    const defaults = {
      aiConfidenceThreshold: 85,
      autoDispatchHighPriority: true,
      emailAlerts: true,
      smsEmergencyAlerts: false,
      dailyDigest: true,
      slaHighHours: 24,
      slaMediumHours: 72,
      slaLowDays: 7,
      cityZone: 'Delhi Capital NCT Region',
    }
    setFormData(defaults)
    onSaveSettings(defaults)
    onTriggerToast('Reset platform settings to defaults', 'info')
  }

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">System & AI Platform Settings</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure urban hazard detection sensitivity, automated dispatch workflows, and SLA rules
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-[#0c6b82] hover:bg-[#0a5c70] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            {isSaved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isSaved ? 'Saved!' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Card 1: AI Vision Model Configuration */}
        <div className="bg-white rounded-[20px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">AI Computer Vision Model</h3>
              <p className="text-[11px] text-slate-400">Road camera & dashcam defect recognition</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-700">Confidence Threshold Filter</span>
              <span className="font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-md">
                {formData.aiConfidenceThreshold}%
              </span>
            </div>
            <input
              type="range"
              min="60"
              max="99"
              value={formData.aiConfidenceThreshold}
              onChange={(e) => handleChange('aiConfidenceThreshold', Number(e.target.value))}
              className="w-full accent-[#0c6b82] cursor-pointer"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Incidents identified with confidence above this score are auto-triaged into the active dashboard.
            </p>
          </div>

          <div className="pt-2 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-800 block">
                  Autonomous Emergency Dispatch
                </span>
                <span className="text-[11px] text-slate-400">
                  Instantly alert PWD rapid response crew when High severity pothole detected
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.autoDispatchHighPriority}
                onChange={() => handleToggle('autoDispatchHighPriority')}
                className="w-4 h-4 accent-[#0c6b82] rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-800 block">
                  Night Shift Drone Telemetry
                </span>
                <span className="text-[11px] text-slate-400">
                  Continuous street lighting & open drain inspections between 10 PM - 5 AM
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.dailyDigest}
                onChange={() => handleToggle('dailyDigest')}
                className="w-4 h-4 accent-[#0c6b82] rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Card 2: SLA & Civic Response Targets */}
        <div className="bg-white rounded-[20px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">SLA Resolution Benchmarks</h3>
              <p className="text-[11px] text-slate-400">Target hours for maintenance completion</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-rose-600 mb-1">
                High Priority (Hrs)
              </label>
              <input
                type="number"
                value={formData.slaHighHours}
                onChange={(e) => handleChange('slaHighHours', Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-cyan-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-amber-600 mb-1">
                Medium Priority (Hrs)
              </label>
              <input
                type="number"
                value={formData.slaMediumHours}
                onChange={(e) => handleChange('slaMediumHours', Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-cyan-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-emerald-600 mb-1">
                Low Priority (Days)
              </label>
              <input
                type="number"
                value={formData.slaLowDays}
                onChange={(e) => handleChange('slaLowDays', Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-cyan-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Active Municipal Region Zone
            </label>
            <select
              value={formData.cityZone}
              onChange={(e) => handleChange('cityZone', e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 font-medium focus:outline-none"
            >
              <option value="Delhi Capital NCT Region">Delhi Capital NCT Region</option>
              <option value="Mumbai Metropolitan Region">Mumbai Metropolitan Region</option>
              <option value="Bengaluru Urban City">Bengaluru Urban City</option>
              <option value="Hyderabad Municipal Zone">Hyderabad Municipal Zone</option>
            </select>
          </div>

          <div className="pt-2 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-800 block">
                  Email Dispatch Reports
                </span>
                <span className="text-[11px] text-slate-400">
                  Send morning PDF digest to department heads
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.emailAlerts}
                onChange={() => handleToggle('emailAlerts')}
                className="w-4 h-4 accent-[#0c6b82] rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-800 block">
                  SMS Emergency Broadcasts
                </span>
                <span className="text-[11px] text-slate-400">
                  Send high-risk hazard notices via SMS gateway
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.smsEmergencyAlerts}
                onChange={() => handleToggle('smsEmergencyAlerts')}
                className="w-4 h-4 accent-[#0c6b82] rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
