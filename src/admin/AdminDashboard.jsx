import React, { useState, useEffect, useMemo } from 'react'
import {
  Home,
  AlertCircle,
  MapPin,
  ClipboardList,
  Building2,
  TrendingUp,
  FileText,
  Bell,
  Settings,
  LogOut,
  Calendar,
  CheckCircle2,
  Clock,
  RefreshCw,
  FolderGit2,
  ChevronDown,
  X,
  Menu,
  Check,
} from 'lucide-react'

// Period datasets for dynamic stats switching
const DATA_BY_PERIOD = {
  'Last 30 Days': {
    stats: {
      total: 1432,
      totalTrend: '12%',
      pending: 428,
      pendingTrend: '5%',
      inProgress: 612,
      inProgressTrend: '8%',
      resolved: 392,
      resolvedTrend: '20%',
    },
    categories: [
      { name: 'Pothole', percentage: 42, color: '#0284c7' },
      { name: 'Broken Road', percentage: 18, color: '#f97316' },
      { name: 'Open Drain', percentage: 12, color: '#ef4444' },
      { name: 'Street Light', percentage: 10, color: '#6366f1' },
      { name: 'Footpath', percentage: 8, color: '#a855f7' },
      { name: 'Water Logging', percentage: 6, color: '#fb923c' },
      { name: 'Others', percentage: 4, color: '#c084fc' },
    ],
    priorities: [
      { name: 'High', count: 450, color: '#ef4444', percentWidth: 50 },
      { name: 'Medium', count: 640, color: '#f59e0b', percentWidth: 78 },
      { name: 'Low', count: 392, color: '#10b981', percentWidth: 52 },
    ],
    reports: [
      {
        id: 1,
        title: 'Large pothole on MG Road',
        location: 'MG Road',
        category: 'Pothole',
        priority: 'High',
        status: 'In Progress',
        reportedOn: '12 Oct 2024',
        department: 'Public Works Department (PWD)',
        details: 'Deep pothole roughly 2 feet wide on the central lane causing vehicle congestion and rim damage.',
      },
      {
        id: 2,
        title: 'Broken footpath',
        location: 'Lajpat Nagar',
        category: 'Footpath',
        priority: 'Medium',
        status: 'Pending',
        reportedOn: '12 Oct 2024',
        department: 'Municipal Corporation (South Zone)',
        details: 'Several interlocking concrete tiles fractured and missing near the main market crossing.',
      },
      {
        id: 3,
        title: 'Open drain cover',
        location: 'Karol Bagh',
        category: 'Open Drain',
        priority: 'High',
        status: 'Verified',
        reportedOn: '11 Oct 2024',
        department: 'Water & Sewage Utility Authority',
        details: 'Cast iron stormwater grate shifted off collar; hazardous for night pedestrians and two-wheelers.',
      },
      {
        id: 4,
        title: 'Damaged street light',
        location: 'Connaught Place',
        category: 'Street Light',
        priority: 'Low',
        status: 'Resolved',
        reportedOn: '10 Oct 2024',
        department: 'Department of Urban Power & Lighting',
        details: 'Internal lamp driver malfunction. Replaced with high-efficiency 90W LED fixture.',
      },
      {
        id: 5,
        title: 'Water logging near underpass',
        location: 'Saket Metro',
        category: 'Water Logging',
        priority: 'High',
        status: 'In Progress',
        reportedOn: '09 Oct 2024',
        department: 'Drainage & Stormwater Division',
        details: 'Debris blocking drainage sump resulting in 6 inches of standing stormwater.',
      },
      {
        id: 6,
        title: 'Broken road divider',
        location: 'Nehru Place',
        category: 'Broken Road',
        priority: 'Medium',
        status: 'Pending',
        reportedOn: '08 Oct 2024',
        department: 'Road Safety & Traffic Engineering',
        details: 'Reinforced concrete curb knocked down by turning vehicle, obstructing inner lane.',
      },
    ],
  },
  'Last 7 Days': {
    stats: {
      total: 384,
      totalTrend: '9%',
      pending: 112,
      pendingTrend: '3%',
      inProgress: 164,
      inProgressTrend: '11%',
      resolved: 108,
      resolvedTrend: '16%',
    },
    categories: [
      { name: 'Pothole', percentage: 45, color: '#0284c7' },
      { name: 'Broken Road', percentage: 17, color: '#f97316' },
      { name: 'Open Drain', percentage: 11, color: '#ef4444' },
      { name: 'Street Light', percentage: 12, color: '#6366f1' },
      { name: 'Footpath', percentage: 7, color: '#a855f7' },
      { name: 'Water Logging', percentage: 5, color: '#fb923c' },
      { name: 'Others', percentage: 3, color: '#c084fc' },
    ],
    priorities: [
      { name: 'High', count: 120, color: '#ef4444', percentWidth: 42 },
      { name: 'Medium', count: 174, color: '#f59e0b', percentWidth: 70 },
      { name: 'Low', count: 90, color: '#10b981', percentWidth: 45 },
    ],
    reports: [
      {
        id: 1,
        title: 'Large pothole on MG Road',
        location: 'MG Road',
        category: 'Pothole',
        priority: 'High',
        status: 'In Progress',
        reportedOn: '12 Oct 2024',
        department: 'Public Works Department (PWD)',
        details: 'Deep pothole roughly 2 feet wide on central lane.',
      },
      {
        id: 2,
        title: 'Broken footpath',
        location: 'Lajpat Nagar',
        category: 'Footpath',
        priority: 'Medium',
        status: 'Pending',
        reportedOn: '12 Oct 2024',
        department: 'Municipal Corporation (South Zone)',
        details: 'Tiles fractured near the main market crossing.',
      },
      {
        id: 3,
        title: 'Open drain cover',
        location: 'Karol Bagh',
        category: 'Open Drain',
        priority: 'High',
        status: 'Verified',
        reportedOn: '11 Oct 2024',
        department: 'Water & Sewage Utility Authority',
        details: 'Cast iron cover dislodged after downpour.',
      },
      {
        id: 4,
        title: 'Damaged street light',
        location: 'Connaught Place',
        category: 'Street Light',
        priority: 'Low',
        status: 'Resolved',
        reportedOn: '10 Oct 2024',
        department: 'Department of Urban Power & Lighting',
        details: 'LED bulb replaced on pole #42.',
      },
    ],
  },
  'Last 24 Hours': {
    stats: {
      total: 64,
      totalTrend: '4%',
      pending: 29,
      pendingTrend: '12%',
      inProgress: 23,
      inProgressTrend: '5%',
      resolved: 12,
      resolvedTrend: '8%',
    },
    categories: [
      { name: 'Pothole', percentage: 40, color: '#0284c7' },
      { name: 'Broken Road', percentage: 20, color: '#f97316' },
      { name: 'Open Drain', percentage: 15, color: '#ef4444' },
      { name: 'Street Light', percentage: 10, color: '#6366f1' },
      { name: 'Footpath', percentage: 7, color: '#a855f7' },
      { name: 'Water Logging', percentage: 5, color: '#fb923c' },
      { name: 'Others', percentage: 3, color: '#c084fc' },
    ],
    priorities: [
      { name: 'High', count: 22, color: '#ef4444', percentWidth: 55 },
      { name: 'Medium', count: 30, color: '#f59e0b', percentWidth: 80 },
      { name: 'Low', count: 12, color: '#10b981', percentWidth: 35 },
    ],
    reports: [
      {
        id: 1,
        title: 'Large pothole on MG Road',
        location: 'MG Road',
        category: 'Pothole',
        priority: 'High',
        status: 'In Progress',
        reportedOn: 'Today, 09:30 AM',
        department: 'Public Works Department (PWD)',
        details: 'Emergency asphalt crew dispatched to site.',
      },
      {
        id: 2,
        title: 'Broken footpath',
        location: 'Lajpat Nagar',
        category: 'Footpath',
        priority: 'Medium',
        status: 'Pending',
        reportedOn: 'Today, 08:15 AM',
        department: 'Municipal Corporation',
        details: 'Pedestrian hazard flagged by neighborhood watch.',
      },
    ],
  },
  'Last 90 Days': {
    stats: {
      total: 4120,
      totalTrend: '16%',
      pending: 1180,
      pendingTrend: '4%',
      inProgress: 1690,
      inProgressTrend: '11%',
      resolved: 1250,
      resolvedTrend: '24%',
    },
    categories: [
      { name: 'Pothole', percentage: 41, color: '#0284c7' },
      { name: 'Broken Road', percentage: 19, color: '#f97316' },
      { name: 'Open Drain', percentage: 13, color: '#ef4444' },
      { name: 'Street Light', percentage: 11, color: '#6366f1' },
      { name: 'Footpath', percentage: 8, color: '#a855f7' },
      { name: 'Water Logging', percentage: 5, color: '#fb923c' },
      { name: 'Others', percentage: 3, color: '#c084fc' },
    ],
    priorities: [
      { name: 'High', count: 1290, color: '#ef4444', percentWidth: 52 },
      { name: 'Medium', count: 1840, color: '#f59e0b', percentWidth: 76 },
      { name: 'Low', count: 990, color: '#10b981', percentWidth: 48 },
    ],
    reports: [
      {
        id: 1,
        title: 'Large pothole on MG Road',
        location: 'MG Road',
        category: 'Pothole',
        priority: 'High',
        status: 'In Progress',
        reportedOn: '12 Oct 2024',
        department: 'Public Works Department (PWD)',
        details: 'Deep pothole reported by commuter app.',
      },
      {
        id: 2,
        title: 'Broken footpath',
        location: 'Lajpat Nagar',
        category: 'Footpath',
        priority: 'Medium',
        status: 'Pending',
        reportedOn: '12 Oct 2024',
        department: 'Municipal Corporation',
        details: 'Fractured paving tiles pending contractor review.',
      },
      {
        id: 3,
        title: 'Open drain cover',
        location: 'Karol Bagh',
        category: 'Open Drain',
        priority: 'High',
        status: 'Verified',
        reportedOn: '11 Oct 2024',
        department: 'Water & Sewage Board',
        details: 'Temporary barrier placed before cover restoration.',
      },
      {
        id: 4,
        title: 'Damaged street light',
        location: 'Connaught Place',
        category: 'Street Light',
        priority: 'Low',
        status: 'Resolved',
        reportedOn: '10 Oct 2024',
        department: 'Department of Urban Power & Lighting',
        details: 'Smart sensor LED lamp successfully installed.',
      },
    ],
  },
}

// Hook for smooth numerical interpolation
function useAnimatedCount(targetValue, duration = 650) {
  const [displayValue, setDisplayValue] = useState(targetValue)

  useEffect(() => {
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

// KPI Summary Card
function StatCard({ iconRenderer, label, value, trend, trendColor }) {
  const animatedValue = useAnimatedCount(value)

  return (
    <div className="bg-white rounded-[18px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col justify-between transition-all duration-300 hover:shadow-md">
      <div className="flex items-center gap-3">
        {iconRenderer}
        <span className="text-[13px] font-medium text-slate-500">{label}</span>
      </div>

      <div className="mt-3">
        <div className="text-[29px] font-bold text-slate-800 tracking-tight leading-none">
          {animatedValue.toLocaleString()}
        </div>
        <div className="mt-2.5 flex items-center">
          <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded ${trendColor}`}>
            <span className="mr-0.5">↑</span> {trend}
          </span>
        </div>
      </div>
    </div>
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
    </div>
  )
}

export default function AdminDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('Last 30 Days')
  const [periodDropdownOpen, setPeriodDropdownOpen] = useState(false)
  const [activeNav, setActiveNav] = useState('Dashboard')
  const [hoveredCategory, setHoveredCategory] = useState(null)
  const [categoryFilter, setCategoryFilter] = useState(null)
  const [priorityFilter, setPriorityFilter] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [selectedReportForView, setSelectedReportForView] = useState(null)

  // Current dataset state
  const [currentData, setCurrentData] = useState(DATA_BY_PERIOD['Last 30 Days'])

  // Switch time period dynamically
  const handlePeriodChange = (period) => {
    setSelectedPeriod(period)
    setCurrentData(JSON.parse(JSON.stringify(DATA_BY_PERIOD[period])))
    setCategoryFilter(null)
    setPriorityFilter(null)
    setPeriodDropdownOpen(false)
  }

  // Status update function that shifts stats dynamically
  const updateReportStatus = (reportId, nextStatus) => {
    setCurrentData((prev) => {
      const target = prev.reports.find((r) => r.id === reportId)
      if (!target || target.status === nextStatus) return prev

      const prevStatus = target.status
      const statsCopy = { ...prev.stats }

      if (prevStatus === 'Pending') statsCopy.pending = Math.max(0, statsCopy.pending - 1)
      if (prevStatus === 'In Progress') statsCopy.inProgress = Math.max(0, statsCopy.inProgress - 1)
      if (prevStatus === 'Resolved') statsCopy.resolved = Math.max(0, statsCopy.resolved - 1)

      if (nextStatus === 'Pending') statsCopy.pending += 1
      if (nextStatus === 'In Progress') statsCopy.inProgress += 1
      if (nextStatus === 'Resolved') statsCopy.resolved += 1

      const updatedList = prev.reports.map((r) =>
        r.id === reportId ? { ...r, status: nextStatus } : r
      )

      return {
        ...prev,
        stats: statsCopy,
        reports: updatedList,
      }
    })

    if (selectedReportForView && selectedReportForView.id === reportId) {
      setSelectedReportForView((prev) => ({ ...prev, status: nextStatus }))
    }
  }

  // Filtered reports calculation
  const filteredReports = useMemo(() => {
    return currentData.reports.filter((r) => {
      if (categoryFilter && r.category !== categoryFilter) return false
      if (priorityFilter && r.priority !== priorityFilter) return false
      return true
    })
  }, [currentData.reports, categoryFilter, priorityFilter])

  // Sidebar navigation entries matching reference image
  const navItems = [
    { name: 'Dashboard', icon: Home },
    { name: 'All Issues', icon: AlertCircle },
    { name: 'Map View', icon: MapPin },
    { name: 'Assignments', icon: ClipboardList },
    { name: 'Departments', icon: Building2 },
    { name: 'Analytics', icon: TrendingUp },
    { name: 'Reports', icon: FileText },
    { name: 'Notifications', icon: Bell },
    { name: 'Settings', icon: Settings },
  ]

  return (
    <div className="flex h-screen w-full bg-[#f2f7f9] text-slate-800 font-sans overflow-hidden">
      {/* Mobile Sidebar backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar matching the dark teal/cyan styling */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-[242px] bg-[#0c3947] text-slate-200 flex flex-col justify-between py-5 px-3.5 transition-transform duration-300 ease-in-out shrink-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Logo brand item */}
          <div className="flex items-center gap-3 px-2 mb-6 mt-1">
            <div className="w-8 h-8 rounded-full border border-cyan-400/50 flex items-center justify-center text-cyan-300 bg-[#0a2e3a]">
              <svg
                className="w-4 h-4 text-cyan-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                <path d="M2 12h20" />
              </svg>
            </div>
            <span className="font-semibold text-white text-[16px] tracking-normal">
              Urban Intelligence
            </span>
          </div>

          {/* Navigation links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeNav === item.name

              return (
                <button
                  key={item.name}
                  onClick={() => {
                    setActiveNav(item.name)
                    setMobileMenuOpen(false)
                  }}
                  className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-[13.5px] font-medium transition-colors text-left ${
                    isActive
                      ? 'bg-gradient-to-r from-[#0c6b82] to-[#0a5c70] text-white shadow-[0_2px_8px_rgba(12,107,130,0.4)]'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-[17px] h-[17px] ${isActive ? 'text-white' : 'text-slate-300'}`} />
                  <span>{item.name}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Logout at bottom */}
        <div className="pt-3">
          <button
            onClick={() => alert('Logout clicked')}
            className="w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-[13.5px] font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
          >
            <LogOut className="w-[17px] h-[17px] text-slate-300" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content View */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto min-w-0">
        {/* Top page title bar */}
        <div className="px-6 sm:px-8 pt-5 pb-1">
          <h2 className="text-xl font-bold text-[#0c3947] tracking-tight">
            Government Dashboard - Overview
          </h2>
        </div>

        {/* Header with Title and Filter Dropdown */}
        <header className="px-6 sm:px-8 pt-2 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
              <p className="text-xs sm:text-[13px] text-slate-500 mt-0.5">
                Real-time overview of road issues and actions
              </p>
            </div>
          </div>

          {/* Right action control: Clean Timeframe Dropdown matching screenshot */}
          <div className="relative self-end sm:self-auto">
            <button
              onClick={() => setPeriodDropdownOpen(!periodDropdownOpen)}
              className="bg-white border border-slate-200 rounded-xl px-3.5 py-1.5 text-xs sm:text-sm font-medium text-slate-700 shadow-xs flex items-center gap-2 hover:bg-slate-50 transition-colors"
            >
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>{selectedPeriod}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {periodDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-44 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-30">
                {Object.keys(DATA_BY_PERIOD).map((period) => (
                  <button
                    key={period}
                    onClick={() => handlePeriodChange(period)}
                    className={`w-full text-left px-3.5 py-2 text-xs sm:text-sm flex items-center justify-between hover:bg-slate-50 ${
                      selectedPeriod === period ? 'text-cyan-800 font-semibold bg-cyan-50/60' : 'text-slate-600'
                    }`}
                  >
                    <span>{period}</span>
                    {selectedPeriod === period && <Check className="w-3.5 h-3.5 text-cyan-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        {/* Dashboard Content Cards */}
        <main className="px-6 sm:px-8 pb-10 space-y-5">
          {/* Top 4 KPI Cards */}
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
                    className="text-xs text-cyan-600 hover:text-cyan-800 font-semibold flex items-center gap-1"
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
                        className={`flex items-center justify-between text-xs py-1 px-2 rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-cyan-50 font-bold'
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
                          <span className={`${isSelected ? 'text-cyan-900' : 'text-slate-600 font-medium'}`}>
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
                    className="text-xs text-cyan-600 hover:text-cyan-800 font-semibold flex items-center gap-1"
                  >
                    Clear Filter ({priorityFilter}) ✕
                  </button>
                )}
              </div>

              <div className="space-y-5 my-auto py-2">
                {currentData.priorities.map((item) => {
                  const isSelected = priorityFilter === item.name

                  return (
                    <div
                      key={item.name}
                      onClick={() => setPriorityFilter(isSelected ? null : item.name)}
                      className={`cursor-pointer p-1.5 rounded-xl transition-all ${
                        isSelected ? 'bg-slate-50 ring-1 ring-slate-300' : 'hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className="w-14 text-xs sm:text-[13px] font-medium text-slate-600">
                          {item.name}
                        </span>

                        {/* Progress Bar Container: clean bar with count only on right */}
                        <div className="flex-1 bg-slate-100 rounded-lg h-7 relative flex items-center overflow-hidden">
                          <div
                            className="h-full rounded-lg transition-all duration-700 ease-out"
                            style={{
                              backgroundColor: item.color,
                              width: `${item.percentWidth}%`,
                            }}
                          />

                          {/* Number on right side only */}
                          <span className="absolute right-3 text-xs font-bold text-slate-700">
                            {item.count.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="pt-2 text-[11px] text-slate-400 text-right">
                Filter table by clicking priority levels
              </div>
            </div>
          </div>

          {/* Bottom Table: Recent Reports */}
          <div className="bg-white rounded-[20px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100">
            <div className="flex items-center justify-between pb-4">
              <div>
                <h3 className="text-[15px] font-bold text-slate-800">Recent Reports</h3>
                {(categoryFilter || priorityFilter) && (
                  <p className="text-xs text-cyan-600 mt-0.5">
                    Active Filters:{' '}
                    {categoryFilter && <span className="font-semibold mr-2">{categoryFilter}</span>}
                    {priorityFilter && <span className="font-semibold">{priorityFilter}</span>}
                  </p>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
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
                      <td colSpan="8" className="text-center py-7 text-slate-400 text-xs">
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
                        <td className="py-3.5 px-3.5 font-medium text-slate-800">{report.title}</td>
                        <td className="py-3.5 px-3.5 text-slate-600">{report.location}</td>
                        <td className="py-3.5 px-3.5 text-slate-600">{report.category}</td>

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
                                ? 'bg-slate-100 text-slate-700'
                                : report.status === 'Pending'
                                ? 'bg-rose-50 text-rose-600'
                                : report.status === 'Verified'
                                ? 'bg-cyan-50 text-cyan-700'
                                : 'bg-emerald-50 text-emerald-700'
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
                            onClick={() => setSelectedReportForView(report)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-1 rounded-lg text-xs font-medium transition-colors"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Detail Dialog Modal */}
      {selectedReportForView && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200/80">
            <div className="flex items-start justify-between pb-3.5 border-b border-slate-100">
              <div>
                <span className="text-xs font-semibold text-cyan-700 uppercase tracking-wider">
                  Incident #{selectedReportForView.id}
                </span>
                <h3 className="text-lg font-bold text-slate-800 mt-0.5">
                  {selectedReportForView.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedReportForView(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl">
                <div>
                  <span className="text-slate-400 block text-[11px]">Location</span>
                  <span className="font-semibold text-slate-700 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-cyan-600" />
                    {selectedReportForView.location}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Category</span>
                  <span className="font-semibold text-slate-700 mt-0.5 block">
                    {selectedReportForView.category}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Priority</span>
                  <span
                    className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                      selectedReportForView.priority === 'High'
                        ? 'bg-rose-50 text-rose-600 border border-rose-200'
                        : selectedReportForView.priority === 'Medium'
                        ? 'bg-amber-50 text-amber-600 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                    }`}
                  >
                    {selectedReportForView.priority}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Reported Date</span>
                  <span className="font-semibold text-slate-700 mt-0.5 block">
                    {selectedReportForView.reportedOn}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px] mb-1">Assigned Department</span>
                <p className="text-slate-700 font-medium bg-white border border-slate-200 rounded-lg p-2.5">
                  {selectedReportForView.department || 'Urban Infrastructure Taskforce'}
                </p>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px] mb-1">Issue Details</span>
                <p className="text-slate-600 bg-slate-50 p-3 rounded-lg leading-relaxed">
                  {selectedReportForView.details}
                </p>
              </div>

              {/* Status Update with real-time dynamic stats feedback */}
              <div className="pt-2">
                <span className="text-slate-600 block text-xs font-semibold mb-2">
                  Update Status (Dynamically updates KPI cards):
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {['Pending', 'In Progress', 'Resolved'].map((st) => (
                    <button
                      key={st}
                      onClick={() => updateReportStatus(selectedReportForView.id, st)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                        selectedReportForView.status === st
                          ? 'bg-cyan-700 text-white border-cyan-700 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedReportForView(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
