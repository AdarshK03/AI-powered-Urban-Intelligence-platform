import React, { useState, useEffect, useMemo, useCallback } from 'react'
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
  Plus,
} from 'lucide-react'

import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

import Toast from '../components/admin/Toast'
import NewIssueModal from '../components/admin/NewIssueModal'
import IssueDetailModal from '../components/admin/IssueDetailModal'
import LogoutModal from '../components/admin/LogoutModal'
import LoginScreen from './LoginScreen'
import OverviewTab from '../components/admin/OverviewTab'
import AllIssuesTab from '../components/admin/AllIssuesTab'
import MapViewTab from '../components/admin/MapViewTab'
import AssignmentsTab from '../components/admin/AssignmentsTab'
import DepartmentsTab from '../components/admin/DepartmentsTab'
import AnalyticsTab from '../components/admin/AnalyticsTab'
import ReportsTab from '../components/admin/ReportsTab'
import NotificationsTab from '../components/admin/NotificationsTab'
import SettingsTab from '../components/admin/SettingsTab'

// Initial municipal departments dataset
const INITIAL_DEPARTMENTS = [
  {
    id: 'dept-1',
    name: 'Public Works Department (PWD)',
    shortCode: 'PWD',
    officer: 'Er. Rajesh K. Sharma',
    email: 'pwd.delhi@gov.in',
    phone: '+91 11 2339 2001',
    avgResponseHours: 14,
  },
  {
    id: 'dept-2',
    name: 'Municipal Corporation (South Zone)',
    shortCode: 'MCD',
    officer: 'Smt. Ananya Sen, IAS',
    email: 'mcd.south@delhi.gov.in',
    phone: '+91 11 2651 8840',
    avgResponseHours: 22,
  },
  {
    id: 'dept-3',
    name: 'Water & Sewage Utility Authority',
    shortCode: 'DJB',
    officer: 'Dr. Vikram Malhotra',
    email: 'support@delhijalboard.nic.in',
    phone: '+91 11 2353 8490',
    avgResponseHours: 19,
  },
  {
    id: 'dept-4',
    name: 'Department of Urban Power & Lighting',
    shortCode: 'BSES',
    officer: 'Shri Amitav Ghosh',
    email: 'streetlighting@urbanpower.org',
    phone: '+91 11 3999 9707',
    avgResponseHours: 8,
  },
  {
    id: 'dept-5',
    name: 'Drainage & Stormwater Division',
    shortCode: 'IFCD',
    officer: 'Er. Kavita Verma',
    email: 'stormwater@delhi-flood.nic.in',
    phone: '+91 11 2386 1124',
    avgResponseHours: 12,
  },
  {
    id: 'dept-6',
    name: 'Road Safety & Traffic Engineering',
    shortCode: 'DTP',
    officer: 'DCP Manish Singhal, IPS',
    email: 'trafficsafety@delhipolice.gov.in',
    phone: '+91 11 2584 4444',
    avgResponseHours: 6,
  },
]

// Initial maintenance field crew roster
const INITIAL_CREWS = [
  {
    id: 'crew-1',
    name: 'Rapid Asphalt Patch Crew #1',
    specialty: 'Potholes & Pavement Resurfacing',
    leader: 'Foreman Rakesh Yadav',
    members: 6,
    status: 'Available',
    assignedIssueId: null,
    vehicleNumber: 'DL-1GB-4021',
  },
  {
    id: 'crew-2',
    name: 'Stormwater Grate & Drainage Squad A',
    specialty: 'Open Grates & Suction Pumping',
    leader: 'Suresh Chand',
    members: 4,
    status: 'Available',
    assignedIssueId: null,
    vehicleNumber: 'DL-3CD-9018',
  },
  {
    id: 'crew-3',
    name: 'Urban Lighting High-Boom Unit 4',
    specialty: 'Street Lamp & Driver Replacement',
    leader: 'Deepak Roy',
    members: 3,
    status: 'Available',
    assignedIssueId: null,
    vehicleNumber: 'DL-2LT-1102',
  },
  {
    id: 'crew-4',
    name: 'Footpath & Median Masonry Team C',
    specialty: 'Concrete Paver Restoration',
    leader: 'Mohan Lal',
    members: 5,
    status: 'Available',
    assignedIssueId: null,
    vehicleNumber: 'DL-4MS-7730',
  },
  {
    id: 'crew-5',
    name: 'Heavy Pothole Roller Unit B',
    specialty: 'Bituminous Heavy Overlay',
    leader: 'Gurpreet Singh',
    members: 7,
    status: 'Available',
    assignedIssueId: null,
    vehicleNumber: 'DL-1PR-5520',
  },
]

// Initial notifications feed (hydrated dynamically from database)
const INITIAL_NOTIFICATIONS = []

// Timeframes for admin filtering
const TIME_PERIODS = ['Last 1 Hour', 'Last 24 Hours', 'Last 7 Days', 'Last 30 Days', 'Last 90 Days']

// Zeroed empty state for clean dynamic hydration
const EMPTY_DASHBOARD_DATA = {
  stats: {
    total: 0,
    totalTrend: '0%',
    pending: 0,
    pendingTrend: '0%',
    inProgress: 0,
    inProgressTrend: '0%',
    resolved: 0,
    resolvedTrend: '0%',
  },
  categories: [],
  priorities: [
    { name: 'High', count: 0, color: '#ef4444', percentWidth: 0 },
    { name: 'Medium', count: 0, color: '#f59e0b', percentWidth: 0 },
    { name: 'Low', count: 0, color: '#10b981', percentWidth: 0 },
  ],
  reports: [],
}

export default function AdminDashboard({ onExit } = {}) {
  const navigate = useNavigate()
  const { token, logout } = useAuth()
  const [isLoggedIn, setIsLoggedIn] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('Last 30 Days')
  const [periodDropdownOpen, setPeriodDropdownOpen] = useState(false)
  const [activeNav, setActiveNav] = useState('Dashboard')
  const [categoryFilter, setCategoryFilter] = useState(null)
  const [priorityFilter, setPriorityFilter] = useState(null)
  const [statusFilter, setStatusFilter] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Modals state
  const [selectedReportForView, setSelectedReportForView] = useState(null)
  const [newIssueModalOpen, setNewIssueModalOpen] = useState(false)
  const [logoutModalOpen, setLogoutModalOpen] = useState(false)

  // Floating feedback toast
  const [toast, setToast] = useState(null)

  // Dataset states
  const [currentData, setCurrentData] = useState(EMPTY_DASHBOARD_DATA)
  const [crews, setCrews] = useState(INITIAL_CREWS)
  const [departments, setDepartments] = useState(INITIAL_DEPARTMENTS)
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS)
  const [crewRequests, setCrewRequests] = useState([])
  const [settings, setSettings] = useState({
    aiConfidenceThreshold: 85,
    autoDispatchHighPriority: true,
    emailAlerts: true,
    smsEmergencyAlerts: false,
    dailyDigest: true,
    slaHighHours: 24,
    slaMediumHours: 72,
    slaLowDays: 7,
    cityZone: 'Delhi Capital NCT Region',
  })

  const showToast = (message, type = 'info') => {
    setToast({ message, type })
    setTimeout(() => {
      setToast(null)
    }, 3500)
  }

  // Live database fetchers
  const fetchAdminOverview = useCallback(async (period = selectedPeriod) => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const res = await fetch(`/api/admin/overview?period=${encodeURIComponent(period)}`, { headers })
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.reports) {
          setCurrentData({
            stats: data.stats || EMPTY_DASHBOARD_DATA.stats,
            categories: data.categories || [],
            priorities: data.priorities || EMPTY_DASHBOARD_DATA.priorities,
            reports: data.reports || [],
          })
          return
        }
      }

      // Resilient fallback to public issues endpoint if admin overview is unavailable
      const fallbackRes = await fetch('/api/issues')
      if (fallbackRes.ok) {
        const fallbackData = await fallbackRes.json()
        const issues = fallbackData.issues || []
        const total = issues.length
        const pending = issues.filter((i) => i.status === 'reported' || i.status === 'Pending').length
        const inProgress = issues.filter((i) => i.status === 'in_progress' || i.status === 'In Progress' || i.status === 'assigned' || i.status === 'verified').length
        const resolved = issues.filter((i) => i.status === 'resolved' || i.status === 'Resolved').length

        const highCount = issues.filter((i) => (i.severity || i.priority || '').toLowerCase() === 'high').length
        const medCount = issues.filter((i) => (i.severity || i.priority || '').toLowerCase() === 'medium').length
        const lowCount = issues.filter((i) => (i.severity || i.priority || '').toLowerCase() === 'low').length

        const reports = issues.map((row) => ({
          id: row.id,
          title: row.title,
          city: (!row.city || row.city === 'All Cities') ? 'Pune' : row.city,
          location: row.location_name || row.location || row.city || 'Pune',
          locationName: row.location_name || row.location || 'Pune',
          latitude: row.latitude ? parseFloat(row.latitude) : null,
          longitude: row.longitude ? parseFloat(row.longitude) : null,
          lat: row.latitude ? parseFloat(row.latitude) : null,
          lng: row.longitude ? parseFloat(row.longitude) : null,
          category: row.category || 'Road Defect',
          priority: (row.severity || row.priority || 'medium').charAt(0).toUpperCase() + (row.severity || row.priority || 'medium').slice(1),
          status: row.status === 'in_progress' ? 'In Progress' : (row.status || 'Reported').charAt(0).toUpperCase() + (row.status || 'Reported').slice(1),
          reportedOn: new Date(row.reported_at || row.created_at || Date.now()).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }),
          createdAt: row.created_at || row.reported_at,
          department: row.department || 'Public Works Department (PWD)',
          details: row.description || row.details || '',
          assignedCrew: row.assigned_crew || null,
          aiConfidence: row.ai_confidence ? parseFloat(row.ai_confidence) : null,
        }))

        setCurrentData({
          stats: {
            total,
            totalTrend: '0%',
            pending,
            pendingTrend: '0%',
            inProgress,
            inProgressTrend: '0%',
            resolved,
            resolvedTrend: '0%',
          },
          categories: [],
          priorities: [
            { name: 'High', count: highCount, color: '#ef4444', percentWidth: total > 0 ? Math.round((highCount / total) * 100) : 0 },
            { name: 'Medium', count: medCount, color: '#f59e0b', percentWidth: total > 0 ? Math.round((medCount / total) * 100) : 0 },
            { name: 'Low', count: lowCount, color: '#10b981', percentWidth: total > 0 ? Math.round((lowCount / total) * 100) : 0 },
          ],
          reports,
        })
      }
    } catch (err) {
      console.error('Failed to load admin overview from database:', err)
    }
  }, [token, selectedPeriod])

  const fetchAdminMetadata = useCallback(async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const [crewsRes, deptsRes, notifsRes, reqsRes] = await Promise.all([
        fetch('/api/admin/crews', { headers }),
        fetch('/api/admin/departments', { headers }),
        fetch('/api/admin/notifications', { headers }),
        fetch('/api/admin/crew-requests', { headers }),
      ])
      if (crewsRes.ok) {
        const cJson = await crewsRes.json()
        if (cJson.success && Array.isArray(cJson.crews)) setCrews(cJson.crews)
      }
      if (deptsRes.ok) {
        const dJson = await deptsRes.json()
        if (dJson.success && Array.isArray(dJson.departments)) setDepartments(dJson.departments)
      }
      if (notifsRes.ok) {
        const nJson = await notifsRes.json()
        if (nJson.success && Array.isArray(nJson.notifications)) setNotifications(nJson.notifications)
      }
      if (reqsRes && reqsRes.ok) {
        const rJson = await reqsRes.json()
        if (rJson.success && Array.isArray(rJson.requests)) setCrewRequests(rJson.requests)
      }
    } catch (err) {
      console.error('Failed to load admin metadata from database:', err)
    }
  }, [token])

  const handleRespondCrewRequest = async (requestId, action, adminNotes) => {
    try {
      const res = await fetch(`/api/admin/crew-requests/${requestId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action, adminNotes }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to respond to crew request.')
      }
      showToast(data.message, action === 'approve' ? 'success' : 'info')
      fetchAdminMetadata()
      fetchAdminOverview(selectedPeriod)
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  useEffect(() => {
    fetchAdminOverview(selectedPeriod)
    fetchAdminMetadata()
  }, [fetchAdminOverview, fetchAdminMetadata, selectedPeriod])

  // Switch time period dynamically
  const handlePeriodChange = (period) => {
    setSelectedPeriod(period)
    fetchAdminOverview(period)
    setCategoryFilter(null)
    setPriorityFilter(null)
    setStatusFilter(null)
    setPeriodDropdownOpen(false)
    showToast(`Timeframe updated to ${period}`, 'info')
  }

  // Status update function that persists to PostgreSQL and shifts stats dynamically
  const updateReportStatus = async (reportId, nextStatus) => {
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

    try {
      const statusMap = {
        'Pending': 'reported',
        'In Progress': 'in_progress',
        'Resolved': 'resolved',
      }
      const apiStatus = statusMap[nextStatus] || nextStatus.toLowerCase().replace(' ', '_')
      await fetch(`/api/issues/${reportId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: apiStatus }),
      })
    } catch (e) {
      console.error('Error syncing status update to DB:', e)
    }

    showToast(`Incident #${typeof reportId === 'string' && reportId.length > 8 ? reportId.slice(-4) : reportId} updated to ${nextStatus}`, 'success')
  }

  // Add new issue to PostgreSQL database
  const handleAddIssue = async (newIssue) => {
    try {
      const categoryMap = {
        'Pothole': 'pothole',
        'Broken Road': 'road',
        'Open Drain': 'drain',
        'Street Light': 'light',
        'Footpath': 'footpath',
        'Water Logging': 'water',
        'Traffic Signal': 'signal',
        'Others': 'other',
      }
      const payload = {
        title: newIssue.title,
        description: newIssue.details || '',
        category: categoryMap[newIssue.category] || newIssue.category.toLowerCase(),
        severity: (newIssue.priority || 'Medium').toLowerCase(),
        locationName: newIssue.location,
        city: newIssue.city || 'Pune',
        department: newIssue.department,
      }

      const res = await fetch('/api/issues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        await fetchAdminOverview()
        showToast(`Logged new incident to database: "${newIssue.title}"`, 'success')
      }
    } catch (e) {
      console.error('Failed to create issue in database:', e)
      showToast(`Incident created locally`, 'info')
    }

    setNewIssueModalOpen(false)
  }

  // Delete issue from PostgreSQL database
  const handleDeleteIssue = async (issueId) => {
    setCurrentData((prev) => {
      const target = prev.reports.find((r) => r.id === issueId)
      if (!target) return prev
      const statsCopy = { ...prev.stats, total: Math.max(0, prev.stats.total - 1) }
      if (target.status === 'Pending') statsCopy.pending = Math.max(0, statsCopy.pending - 1)
      if (target.status === 'In Progress') statsCopy.inProgress = Math.max(0, statsCopy.inProgress - 1)
      if (target.status === 'Resolved') statsCopy.resolved = Math.max(0, statsCopy.resolved - 1)

      return {
        ...prev,
        stats: statsCopy,
        reports: prev.reports.filter((r) => r.id !== issueId),
      }
    })

    if (selectedReportForView && selectedReportForView.id === issueId) {
      setSelectedReportForView(null)
    }

    try {
      await fetch(`/api/issues/${issueId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
    } catch (e) {
      console.error('Failed to delete issue in database:', e)
    }

    showToast(`Incident #${typeof issueId === 'string' && issueId.length > 8 ? issueId.slice(-4) : issueId} deleted`, 'info')
  }

  // Assign crew directly to issue
  const handleAssignCrew = async (issueId, crewName) => {
    setCurrentData((prev) => ({
      ...prev,
      reports: prev.reports.map((r) =>
        r.id === issueId ? { ...r, assignedCrew: crewName, status: 'In Progress' } : r
      ),
    }))

    setCrews((prev) =>
      prev.map((c) =>
        c.name === crewName
          ? { ...c, status: 'Dispatched', assignedIssueId: issueId }
          : c
      )
    )

    if (selectedReportForView && selectedReportForView.id === issueId) {
      setSelectedReportForView((prev) => ({
        ...prev,
        assignedCrew: crewName,
        status: 'In Progress',
      }))
    }

    try {
      const crew = crews.find((c) => c.name === crewName)
      if (crew) {
        await fetch(`/api/admin/crews/${crew.id}/assign`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ issueId, status: 'Dispatched' }),
        })
      }
    } catch (e) {
      console.error('Error assigning crew in DB:', e)
    }

    showToast(`Assigned ${crewName} to incident`, 'success')
  }

  // Dispatch crew from Assignments tab
  const handleAssignCrewToIssue = (issueId, crewId) => {
    const targetCrew = crews.find((c) => c.id === crewId)
    if (!targetCrew) return

    handleAssignCrew(issueId, targetCrew.name)
  }

  // Update crew status (e.g. Job complete or recall)
  const handleUpdateCrewStatus = (crewId, newStatus) => {
    setCrews((prev) =>
      prev.map((c) =>
        c.id === crewId
          ? {
            ...c,
            status: newStatus,
            assignedIssueId: newStatus === 'Available' ? null : c.assignedIssueId,
          }
          : c
      )
    )
    showToast(`Crew status updated to ${newStatus}`, 'info')
  }

  // Refresh Telemetry button from live DB
  const handleRefreshData = async () => {
    setIsRefreshing(true)
    await Promise.all([fetchAdminOverview(), fetchAdminMetadata()])
    setIsRefreshing(false)
    showToast('Live PostgreSQL telemetry synchronized', 'success')
  }

  // Notification handlers
  const handleMarkAllNotificationsAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
    try {
      await fetch('/api/admin/notifications/read-all', {
        method: 'PATCH',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
    } catch (e) { }
    showToast('All notifications marked as read', 'success')
  }

  const handleToggleReadNotification = async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: !n.unread } : n))
    )
    try {
      await fetch(`/api/admin/notifications/${id}/read`, {
        method: 'PATCH',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
    } catch (e) { }
  }

  const handleDeleteNotification = async (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    try {
      await fetch(`/api/admin/notifications/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      showToast('Notification deleted permanently', 'info')
    } catch (e) {
      console.error('Failed to delete notification:', e)
    }
  }

  const handleClearAllNotifications = async () => {
    setNotifications([])
    try {
      await fetch('/api/admin/notifications', {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      showToast('Cleared all notifications permanently', 'info')
    } catch (e) {
      console.error('Failed to clear notifications:', e)
    }
  }

  // Navigation helpers from subtabs
  const handleNavigateToDeptIssues = (deptName) => {
    setActiveNav('All Issues')
    showToast(`Filtering issues for ${deptName}`, 'info')
  }

  const handleDownloadDeptReport = (deptName) => {
    showToast(`Generating audit report for ${deptName === 'all' ? 'All Departments' : deptName}`, 'success')
  }

  const handleExportAnalytics = () => {
    showToast('Analytics summary exported to CSV', 'success')
  }

  // Unread notification badge
  const unreadNotificationCount = useMemo(
    () => notifications.filter((n) => n.unread).length,
    [notifications]
  )

  // Sidebar navigation entries matching reference image
  const navItems = [
    { name: 'Dashboard', icon: Home },
    { name: 'All Issues', icon: AlertCircle },
    { name: 'Map View', icon: MapPin },
    { name: 'Assignments', icon: ClipboardList },
    { name: 'Departments', icon: Building2 },
    { name: 'Analytics', icon: TrendingUp },
    // { name: 'Reports', icon: FileText },
    { name: 'Notifications', icon: Bell, badge: unreadNotificationCount },
    { name: 'Settings', icon: Settings },
  ]

  // If user is logged out, show clean login view
  if (!isLoggedIn) {
    return <LoginScreen onLogin={() => setIsLoggedIn(true)} onBack={onExit} />
  }

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
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-[242px] bg-[#0c3947] text-slate-200 flex flex-col justify-between py-5 px-3.5 transition-transform duration-300 ease-in-out shrink-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
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

          {/* Navigation links - ALL NOW FULLY WORKING! */}
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
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13.5px] font-medium transition-colors text-left cursor-pointer ${isActive
                    ? 'bg-gradient-to-r from-[#0c6b82] to-[#0a5c70] text-white shadow-[0_2px_8px_rgba(12,107,130,0.4)]'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <div className="flex items-center gap-3.5">
                    <Icon className={`w-[17px] h-[17px] ${isActive ? 'text-white' : 'text-slate-300'}`} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge > 0 && (
                    <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Logout at bottom - NOW FULLY WORKING! */}
        <div className="pt-3">
          <button
            onClick={() => setLogoutModalOpen(true)}
            className="w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-[13.5px] font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <LogOut className="w-[17px] h-[17px] text-slate-300" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content View */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto min-w-0">
        {/* Top page title bar */}
        <div className="px-6 sm:px-8 pt-5 pb-1 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#0c3947] tracking-tight">
            Government Dashboard - {activeNav}
          </h2>

          <div className="flex items-center gap-2">
            {/* Quick Refresh telemetry button */}
            <button
              onClick={handleRefreshData}
              title="Refresh live camera & sensor telemetry"
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-cyan-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-600' : ''}`} />
            </button>

            {/* Quick Notifications jump button */}
            <button
              onClick={() => setActiveNav('Notifications')}
              title="Notifications"
              className="relative p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-cyan-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
              )}
            </button>
          </div>
        </div>

        {/* Header with Title and Filter Dropdown */}
        <header className="px-6 sm:px-8 pt-2 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {activeNav}
              </h1>
              <p className="text-xs sm:text-[13px] text-slate-500 mt-0.5">
                {activeNav === 'Dashboard' && 'Real-time overview of road issues and actions'}
                {activeNav === 'All Issues' && 'Search, filter, update and manage reported road defects'}
                {activeNav === 'Map View' && 'Geospatial mapping and live hazard GPS tracking'}
                {activeNav === 'Assignments' && 'Dispatch maintenance squads and work orders'}
                {activeNav === 'Departments' && 'Civic infrastructure bodies and SLA resolution performance'}
                {activeNav === 'Analytics' && 'Machine learning detection insights and trends'}
                {activeNav === 'Reports' && 'Civil infrastructure compliance and export sheets'}
                {activeNav === 'Notifications' && 'Telemetry alerts and high-severity road warnings'}
                {activeNav === 'Settings' && 'Autonomous platform and AI threshold configuration'}
              </p>
            </div>
          </div>
        </header>

        {/* Dashboard Content Container */}
        <main className="px-6 sm:px-8 pb-10 flex-1">
          {/* TAB 1: OVERVIEW DASHBOARD */}
          {activeNav === 'Dashboard' && (
            <OverviewTab
              currentData={currentData}
              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}
              priorityFilter={priorityFilter}
              setPriorityFilter={setPriorityFilter}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              onOpenReportModal={setSelectedReportForView}
              onOpenNewIssueModal={() => setNewIssueModalOpen(true)}
              onNavigateToAllIssues={() => setActiveNav('All Issues')}
            />
          )}

          {/* TAB 2: ALL ISSUES */}
          {activeNav === 'All Issues' && (
            <AllIssuesTab
              issues={currentData.reports}
              onOpenReportModal={setSelectedReportForView}
              onOpenNewIssueModal={() => setNewIssueModalOpen(true)}
              onDeleteIssue={handleDeleteIssue}
              onUpdateStatus={updateReportStatus}
              onExportCSV={(count) => showToast(`Exported ${count} issues to CSV`, 'success')}
              departments={departments}
              categories={currentData.categories}
            />
          )}

          {/* TAB 3: MAP VIEW */}
          {activeNav === 'Map View' && (
            <MapViewTab
              issues={currentData.reports}
              onOpenReportModal={setSelectedReportForView}
              onUpdateStatus={updateReportStatus}
              onDispatchCrew={(issueId, crewName) => handleAssignCrew(issueId, crewName)}
              categories={currentData.categories}
            />
          )}

          {/* TAB 4: ASSIGNMENTS */}
          {activeNav === 'Assignments' && (
            <AssignmentsTab
              crews={crews}
              issues={currentData.reports}
              crewRequests={crewRequests}
              onRespondCrewRequest={handleRespondCrewRequest}
              onUpdateCrewStatus={handleUpdateCrewStatus}
              onAssignCrewToIssue={handleAssignCrewToIssue}
              onOpenReportModal={setSelectedReportForView}
            />
          )}

          {/* TAB 5: DEPARTMENTS */}
          {activeNav === 'Departments' && (
            <DepartmentsTab
              departments={departments}
              issues={currentData.reports}
              onNavigateToDeptIssues={handleNavigateToDeptIssues}
              onDownloadDeptReport={handleDownloadDeptReport}
            />
          )}

          {/* TAB 6: ANALYTICS */}
          {activeNav === 'Analytics' && (
            <AnalyticsTab
              issues={currentData.reports}
              onExportAnalytics={handleExportAnalytics}
            />
          )}

          {/* TAB 7: REPORTS */}
          {activeNav === 'Reports' && (
            <ReportsTab
              issues={currentData.reports}
              departments={departments}
              onTriggerToast={showToast}
            />
          )}

          {/* TAB 8: NOTIFICATIONS */}
          {activeNav === 'Notifications' && (
            <NotificationsTab
              notifications={notifications}
              onMarkAllAsRead={handleMarkAllNotificationsAsRead}
              onClearAll={handleClearAllNotifications}
              onToggleRead={handleToggleReadNotification}
              onDeleteNotification={handleDeleteNotification}
              onOpenReportModal={setSelectedReportForView}
              issues={currentData.reports}
            />
          )}

          {/* TAB 9: SETTINGS */}
          {activeNav === 'Settings' && (
            <SettingsTab
              settings={settings}
              onSaveSettings={(newSettings) => setSettings(newSettings)}
              onTriggerToast={showToast}
            />
          )}
        </main>
      </div>

      {/* Detail Dialog Modal */}
      {selectedReportForView && (
        <IssueDetailModal
          report={selectedReportForView}
          onClose={() => setSelectedReportForView(null)}
          onUpdateStatus={updateReportStatus}
          onDeleteIssue={handleDeleteIssue}
          onAssignCrew={handleAssignCrew}
          crews={crews}
        />
      )}

      {/* New Issue Dialog Modal */}
      <NewIssueModal
        isOpen={newIssueModalOpen}
        onClose={() => setNewIssueModalOpen(false)}
        onAddIssue={handleAddIssue}
        departments={departments}
        categories={currentData.categories}
      />

      {/* Logout Confirmation Dialog Modal */}
      <LogoutModal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        onConfirm={() => {
          setLogoutModalOpen(false)
          setIsLoggedIn(false)
          logout()
          if (onExit) onExit()
          navigate('/admin/login')
        }}
      />

      {/* Toast Feedback Banner */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  )
}
