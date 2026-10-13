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
    status: 'Dispatched',
    assignedIssueId: 1,
    vehicleNumber: 'DL-1GB-4021',
  },
  {
    id: 'crew-2',
    name: 'Stormwater Grate & Drainage Squad A',
    specialty: 'Open Grates & Suction Pumping',
    leader: 'Suresh Chand',
    members: 4,
    status: 'On Site',
    assignedIssueId: 3,
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

// Initial notifications feed
const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    title: 'High Hazard Pothole Flagged',
    message: 'AI camera detected severe 2.4ft road crater on MG Road Central Lane.',
    time: '8 minutes ago',
    type: 'urgent',
    unread: true,
    issueId: 1,
  },
  {
    id: 2,
    title: 'Dislodged Stormwater Grate',
    message: 'Open drain hazardous condition reported near Karol Bagh market crossing.',
    time: '24 minutes ago',
    type: 'warning',
    unread: true,
    issueId: 3,
  },
  {
    id: 3,
    title: 'Street Lighting Fixture Restored',
    message: 'Work order #4 closed by Urban Power Unit. High efficiency LED operational.',
    time: '1 hour ago',
    type: 'success',
    unread: false,
    issueId: 4,
  },
  {
    id: 4,
    title: 'Field Crew Dispatched',
    message: 'Rapid Asphalt Patch Crew #1 en route to MG Road with bituminous hot mix.',
    time: '2 hours ago',
    type: 'info',
    unread: false,
    issueId: 1,
  },
]

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
        location: 'MG Road Corridor',
        category: 'Pothole',
        priority: 'High',
        status: 'In Progress',
        reportedOn: '12 Oct 2024',
        department: 'Public Works Department (PWD)',
        details: 'Deep pothole roughly 2 feet wide on the central lane causing vehicle congestion and rim damage.',
        assignedCrew: 'Rapid Asphalt Patch Crew #1',
        aiConfidence: 97.4,
      },
      {
        id: 2,
        title: 'Broken footpath',
        location: 'Lajpat Nagar Central',
        category: 'Footpath',
        priority: 'Medium',
        status: 'Pending',
        reportedOn: '12 Oct 2024',
        department: 'Municipal Corporation (South Zone)',
        details: 'Several interlocking concrete tiles fractured and missing near the main market crossing.',
        assignedCrew: null,
        aiConfidence: 91.2,
      },
      {
        id: 3,
        title: 'Open drain cover',
        location: 'Karol Bagh West',
        category: 'Open Drain',
        priority: 'High',
        status: 'In Progress',
        reportedOn: '11 Oct 2024',
        department: 'Water & Sewage Utility Authority',
        details: 'Cast iron stormwater grate shifted off collar; hazardous for night pedestrians and two-wheelers.',
        assignedCrew: 'Stormwater Grate & Drainage Squad A',
        aiConfidence: 98.6,
      },
      {
        id: 4,
        title: 'Damaged street light',
        location: 'Connaught Place Circle',
        category: 'Street Light',
        priority: 'Low',
        status: 'Resolved',
        reportedOn: '10 Oct 2024',
        department: 'Department of Urban Power & Lighting',
        details: 'Internal lamp driver malfunction. Replaced with high-efficiency 90W LED fixture.',
        assignedCrew: 'Urban Lighting High-Boom Unit 4',
        aiConfidence: 94.0,
      },
      {
        id: 5,
        title: 'Water logging near underpass',
        location: 'Saket Metro Underpass',
        category: 'Water Logging',
        priority: 'High',
        status: 'In Progress',
        reportedOn: '09 Oct 2024',
        department: 'Drainage & Stormwater Division',
        details: 'Debris blocking drainage sump resulting in 6 inches of standing stormwater.',
        assignedCrew: null,
        aiConfidence: 96.1,
      },
      {
        id: 6,
        title: 'Broken road divider',
        location: 'Nehru Place Hub',
        category: 'Broken Road',
        priority: 'Medium',
        status: 'Pending',
        reportedOn: '08 Oct 2024',
        department: 'Road Safety & Traffic Engineering',
        details: 'Reinforced concrete curb knocked down by turning vehicle, obstructing inner lane.',
        assignedCrew: null,
        aiConfidence: 89.8,
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
        location: 'MG Road Corridor',
        category: 'Pothole',
        priority: 'High',
        status: 'In Progress',
        reportedOn: '12 Oct 2024',
        department: 'Public Works Department (PWD)',
        details: 'Deep pothole roughly 2 feet wide on central lane.',
        assignedCrew: 'Rapid Asphalt Patch Crew #1',
        aiConfidence: 97.4,
      },
      {
        id: 2,
        title: 'Broken footpath',
        location: 'Lajpat Nagar Central',
        category: 'Footpath',
        priority: 'Medium',
        status: 'Pending',
        reportedOn: '12 Oct 2024',
        department: 'Municipal Corporation (South Zone)',
        details: 'Tiles fractured near the main market crossing.',
        assignedCrew: null,
        aiConfidence: 91.2,
      },
      {
        id: 3,
        title: 'Open drain cover',
        location: 'Karol Bagh West',
        category: 'Open Drain',
        priority: 'High',
        status: 'In Progress',
        reportedOn: '11 Oct 2024',
        department: 'Water & Sewage Utility Authority',
        details: 'Cast iron cover dislodged after downpour.',
        assignedCrew: 'Stormwater Grate & Drainage Squad A',
        aiConfidence: 98.6,
      },
      {
        id: 4,
        title: 'Damaged street light',
        location: 'Connaught Place Circle',
        category: 'Street Light',
        priority: 'Low',
        status: 'Resolved',
        reportedOn: '10 Oct 2024',
        department: 'Department of Urban Power & Lighting',
        details: 'LED bulb replaced on pole #42.',
        assignedCrew: 'Urban Lighting High-Boom Unit 4',
        aiConfidence: 94.0,
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
        location: 'MG Road Corridor',
        category: 'Pothole',
        priority: 'High',
        status: 'In Progress',
        reportedOn: 'Today, 09:30 AM',
        department: 'Public Works Department (PWD)',
        details: 'Emergency asphalt crew dispatched to site.',
        assignedCrew: 'Rapid Asphalt Patch Crew #1',
        aiConfidence: 97.4,
      },
      {
        id: 2,
        title: 'Broken footpath',
        location: 'Lajpat Nagar Central',
        category: 'Footpath',
        priority: 'Medium',
        status: 'Pending',
        reportedOn: 'Today, 08:15 AM',
        department: 'Municipal Corporation (South Zone)',
        details: 'Pedestrian hazard flagged by neighborhood watch.',
        assignedCrew: null,
        aiConfidence: 91.2,
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
        location: 'MG Road Corridor',
        category: 'Pothole',
        priority: 'High',
        status: 'In Progress',
        reportedOn: '12 Oct 2024',
        department: 'Public Works Department (PWD)',
        details: 'Deep pothole reported by commuter app.',
        assignedCrew: 'Rapid Asphalt Patch Crew #1',
        aiConfidence: 97.4,
      },
      {
        id: 2,
        title: 'Broken footpath',
        location: 'Lajpat Nagar Central',
        category: 'Footpath',
        priority: 'Medium',
        status: 'Pending',
        reportedOn: '12 Oct 2024',
        department: 'Municipal Corporation (South Zone)',
        details: 'Fractured paving tiles pending contractor review.',
        assignedCrew: null,
        aiConfidence: 91.2,
      },
      {
        id: 3,
        title: 'Open drain cover',
        location: 'Karol Bagh West',
        category: 'Open Drain',
        priority: 'High',
        status: 'In Progress',
        reportedOn: '11 Oct 2024',
        department: 'Water & Sewage Utility Authority',
        details: 'Temporary barrier placed before cover restoration.',
        assignedCrew: 'Stormwater Grate & Drainage Squad A',
        aiConfidence: 98.6,
      },
      {
        id: 4,
        title: 'Damaged street light',
        location: 'Connaught Place Circle',
        category: 'Street Light',
        priority: 'Low',
        status: 'Resolved',
        reportedOn: '10 Oct 2024',
        department: 'Department of Urban Power & Lighting',
        details: 'Smart sensor LED lamp successfully installed.',
        assignedCrew: 'Urban Lighting High-Boom Unit 4',
        aiConfidence: 94.0,
      },
    ],
  },
}

export default function AdminDashboard({ onExit } = {}) {
  const navigate = useNavigate()
  const { logout } = useAuth()
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
  const [currentData, setCurrentData] = useState(DATA_BY_PERIOD['Last 30 Days'])
  const [crews, setCrews] = useState(INITIAL_CREWS)
  const [departments, setDepartments] = useState(INITIAL_DEPARTMENTS)
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS)
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

  // Switch time period dynamically
  const handlePeriodChange = (period) => {
    setSelectedPeriod(period)
    setCurrentData(JSON.parse(JSON.stringify(DATA_BY_PERIOD[period])))
    setCategoryFilter(null)
    setPriorityFilter(null)
    setStatusFilter(null)
    setPeriodDropdownOpen(false)
    showToast(`Timeframe updated to ${period}`, 'info')
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

    showToast(`Incident #${reportId > 1000 ? String(reportId).slice(-4) : reportId} updated to ${nextStatus}`, 'success')
  }

  // Add new issue
  const handleAddIssue = (newIssue) => {
    setCurrentData((prev) => {
      const updatedReports = [newIssue, ...prev.reports]
      const updatedStats = {
        ...prev.stats,
        total: prev.stats.total + 1,
        pending: prev.stats.pending + 1,
      }
      return {
        ...prev,
        stats: updatedStats,
        reports: updatedReports,
      }
    })

    // Also push a live notification
    setNotifications((prev) => [
      {
        id: Date.now(),
        title: `New Defect Logged: ${newIssue.title}`,
        message: `${newIssue.priority} priority incident filed at ${newIssue.location}.`,
        time: 'Just now',
        type: newIssue.priority === 'High' ? 'urgent' : 'warning',
        unread: true,
        issueId: newIssue.id,
      },
      ...prev,
    ])

    showToast(`Logged new incident: "${newIssue.title}"`, 'success')
  }

  // Delete issue
  const handleDeleteIssue = (issueId) => {
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

    showToast(`Incident #${issueId > 1000 ? String(issueId).slice(-4) : issueId} deleted`, 'info')
  }

  // Assign crew directly to issue
  const handleAssignCrew = (issueId, crewName) => {
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

  // Refresh Telemetry button
  const handleRefreshData = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setIsRefreshing(false)
      showToast('Live telemetry & AI feeds successfully synchronized', 'success')
    }, 700)
  }

  // Notification handlers
  const handleMarkAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
    showToast('All notifications marked as read', 'success')
  }

  const handleToggleReadNotification = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: !n.unread } : n))
    )
  }

  const handleDeleteNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    showToast('Notification dismissed', 'info')
  }

  const handleClearAllNotifications = () => {
    setNotifications([])
    showToast('Cleared all notifications', 'info')
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
    { name: 'Reports', icon: FileText },
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
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13.5px] font-medium transition-colors text-left cursor-pointer ${
                    isActive
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

          {/* Right action control: Clean Timeframe Dropdown */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => setNewIssueModalOpen(true)}
              className="bg-[#0c6b82] hover:bg-[#0a5c70] text-white rounded-xl px-3.5 py-1.5 text-xs sm:text-sm font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden xs:inline">Report Issue</span>
            </button>

            <div className="relative">
              <button
                onClick={() => setPeriodDropdownOpen(!periodDropdownOpen)}
                className="bg-white border border-slate-200 rounded-xl px-3.5 py-1.5 text-xs sm:text-sm font-medium text-slate-700 shadow-xs flex items-center gap-2 hover:bg-slate-50 transition-colors cursor-pointer"
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
                      className={`w-full text-left px-3.5 py-2 text-xs sm:text-sm flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                        selectedPeriod === period
                          ? 'text-cyan-800 font-semibold bg-cyan-50/60'
                          : 'text-slate-600'
                      }`}
                    >
                      <span>{period}</span>
                      {selectedPeriod === period && <Check className="w-3.5 h-3.5 text-cyan-600" />}
                    </button>
                  ))}
                </div>
              )}
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
