import React, { useState } from 'react'
import {
  TrendingUp,
  Download,
  Calendar,
  Sparkles,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Activity,
  BarChart3,
  PieChart,
} from 'lucide-react'

export default function AnalyticsTab({ issues, onExportAnalytics }) {
  const [analyticsPeriod, setAnalyticsPeriod] = useState('Monthly')

  const monthlyData = [
    { month: 'May', reported: 240, resolved: 210 },
    { month: 'Jun', reported: 310, resolved: 280 },
    { month: 'Jul', reported: 450, resolved: 390 },
    { month: 'Aug', reported: 520, resolved: 490 },
    { month: 'Sep', reported: 390, resolved: 375 },
    { month: 'Oct', reported: 420, resolved: 395 },
  ]

  const maxVal = Math.max(...monthlyData.map((d) => Math.max(d.reported, d.resolved)))

  const hotspots = [
    { corridor: 'MG Road Corridor (Pillar 12 - 45)', count: 84, risk: 'Critical', color: 'text-rose-600 bg-rose-50 border-rose-200' },
    { corridor: 'Karol Bagh Market Stormwater Grids', count: 62, risk: 'High', color: 'text-rose-600 bg-rose-50 border-rose-200' },
    { corridor: 'Lajpat Nagar Ring Road Overpass', count: 48, risk: 'Moderate', color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { corridor: 'Connaught Place Outer Circle', count: 31, risk: 'Low', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  ]

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Urban Intelligence & AI Analytics
            </h2>
            <span className="bg-cyan-50 text-cyan-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-cyan-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-600" />
              <span>Vision AI 2.4</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Predictive hazard identification, resolution velocity, and municipal bottleneck analysis
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Period Toggles */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
            {['Weekly', 'Monthly', 'Yearly'].map((p) => (
              <button
                key={p}
                onClick={() => setAnalyticsPeriod(p)}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  analyticsPeriod === p ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            onClick={onExportAnalytics}
            className="px-3.5 py-2 bg-[#0c6b82] hover:bg-[#0a5c70] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Analytics</span>
          </button>
        </div>
      </div>

      {/* 4 Analytics KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-[18px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <Activity className="w-4 h-4 text-cyan-600" />
            <span>Resolution Velocity</span>
          </div>
          <div className="text-2xl font-bold text-slate-800 mt-2">+24.8%</div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">Faster than last quarter</p>
        </div>

        <div className="bg-white rounded-[18px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>AI Model Precision</span>
          </div>
          <div className="text-2xl font-bold text-slate-800 mt-2">98.4%</div>
          <p className="text-[11px] text-purple-600 font-semibold mt-1">Camera Defect Detection</p>
        </div>

        <div className="bg-white rounded-[18px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>Avg Turnaround SLA</span>
          </div>
          <div className="text-2xl font-bold text-slate-800 mt-2">26.4 hrs</div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Target is &lt; 48 hours</p>
        </div>

        <div className="bg-white rounded-[18px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Citizen Satisfaction</span>
          </div>
          <div className="text-2xl font-bold text-slate-800 mt-2">4.7 / 5.0</div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">Based on 1,840 ratings</p>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Monthly Inflow vs Resolution Bar Chart */}
        <div className="bg-white rounded-[20px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Incident Volume vs Resolution</h3>
              <p className="text-[11px] text-slate-400">Comparison of newly logged defects against fixed issues</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#0c6b82]" />
                <span>Logged</span>
              </span>
              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                <span>Resolved</span>
              </span>
            </div>
          </div>

          <div className="h-56 flex items-end justify-between gap-3 pt-6 pb-2 px-2">
            {monthlyData.map((d) => {
              const repHeight = (d.reported / maxVal) * 100
              const resHeight = (d.resolved / maxVal) * 100

              return (
                <div key={d.month} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex items-end justify-center gap-1.5 h-44">
                    <div
                      style={{ height: `${repHeight}%` }}
                      className="w-1/2 bg-[#0c6b82] rounded-t-md transition-all duration-500 relative group"
                    >
                      <span className="hidden group-hover:block absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-0.5 px-1.5 rounded">
                        {d.reported}
                      </span>
                    </div>
                    <div
                      style={{ height: `${resHeight}%` }}
                      className="w-1/2 bg-emerald-500 rounded-t-md transition-all duration-500 relative group"
                    >
                      <span className="hidden group-hover:block absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-0.5 px-1.5 rounded">
                        {d.resolved}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">{d.month}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* High Risk Hotspots ranking */}
        <div className="bg-white rounded-[20px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Critical Road Hotspots</h3>
              <p className="text-[11px] text-slate-400">High recurrence danger corridors requiring preventive repaving</p>
            </div>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>

          <div className="space-y-3 my-auto">
            {hotspots.map((h, i) => (
              <div
                key={h.corridor}
                className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                    {i + 1}
                  </span>
                  <div>
                    <span className="font-bold text-slate-800 block">{h.corridor}</span>
                    <span className="text-slate-400 text-[10px]">{h.count} logged defects this quarter</span>
                  </div>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${h.color}`}>
                  {h.risk} Risk
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2 text-[11px] text-cyan-700 font-semibold text-right">
            Automated drone surveillance schedule generated
          </div>
        </div>
      </div>
    </div>
  )
}
