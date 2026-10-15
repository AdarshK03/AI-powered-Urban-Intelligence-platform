import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CrewHeader from '../components/crew/CrewHeader';
import CrewMembersRoster from '../components/crew/CrewMembersRoster';
import AddMemberModal from '../components/crew/AddMemberModal';
import AssignedTaskCard from '../components/crew/AssignedTaskCard';
import CrewMapTab from '../components/crew/CrewMapTab';
import {
  ClipboardList,
  Users,
  Map,
  Send,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

export default function CrewDashboard() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  // Active top navigation tab
  const [activeTab, setActiveTab] = useState('tasks'); // 'tasks' | 'members' | 'map' | 'requests'

  // Data states (All purely dynamic backed by PostgreSQL API)
  const [crew, setCrew] = useState(null);
  const [leader, setLeader] = useState(user || null);
  const [members, setMembers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [cityIssues, setCityIssues] = useState([]);
  const [myRequests, setMyRequests] = useState([]);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);
  const [highlightTaskId, setHighlightTaskId] = useState(null);
  const [toast, setToast] = useState(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [isRespondingTask, setIsRespondingTask] = useState(false);
  const [isRemovingMember, setIsRemovingMember] = useState(false);

  const authHeaders = useMemo(() => {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token || localStorage.getItem('uip_token')}`,
    };
  }, [token]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // 1. Fetch live crew profile
  const fetchCrewProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/crew/me', { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setCrew(data.crew);
          if (data.leader) setLeader(data.leader);
        }
      }
    } catch (err) {
      console.error('Failed to fetch crew profile:', err);
    }
  }, [authHeaders]);

  // 2. Fetch crew members
  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch('/api/crew/members', { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.members)) {
          setMembers(data.members);
        }
      }
    } catch (err) {
      console.error('Failed to fetch members:', err);
    }
  }, [authHeaders]);

  // 3. Fetch notifications (title-only task assignments)
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/crew/notifications', { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.notifications)) {
          setNotifications(data.notifications);
        }
      }
    } catch (err) {
      console.error('Failed to fetch crew notifications:', err);
    }
  }, [authHeaders]);

  // 4. Fetch assigned tasks
  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/crew/tasks', { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.tasks)) {
          setTasks(data.tasks);
        }
      }
    } catch (err) {
      console.error('Failed to fetch crew tasks:', err);
    }
  }, [authHeaders]);

  // 5. Fetch city issues for map
  const fetchCityIssues = useCallback(async (targetCity) => {
    try {
      const cityToQuery = targetCity || user?.city || 'Pune';
      const res = await fetch(`/api/issues?city=${encodeURIComponent(cityToQuery)}`, {
        headers: authHeaders,
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.issues)) {
          setCityIssues(data.issues);
        }
      }
    } catch (err) {
      console.error('Failed to fetch city issues for crew map:', err);
    }
  }, [authHeaders, user?.city]);

  // 6. Fetch task assignment requests made by this crew leader
  const fetchMyRequests = useCallback(async () => {
    try {
      const res = await fetch('/api/crew/my-requests', { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.requests)) {
          setMyRequests(data.requests);
        }
      }
    } catch (err) {
      console.error('Failed to fetch my task requests:', err);
    }
  }, [authHeaders]);

  // Initial load runs once on mount or when token/user changes
  useEffect(() => {
    let active = true;
    async function loadAll() {
      setIsLoading(true);
      try {
        const headers = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || localStorage.getItem('uip_token')}`,
        };
        const cityToQuery = user?.city || 'Pune';
        const [meRes, membersRes, notifsRes, tasksRes, issuesRes, requestsRes] = await Promise.all([
          fetch('/api/crew/me', { headers }),
          fetch('/api/crew/members', { headers }),
          fetch('/api/crew/notifications', { headers }),
          fetch('/api/crew/tasks', { headers }),
          fetch(`/api/issues?city=${encodeURIComponent(cityToQuery)}`, { headers }),
          fetch('/api/crew/my-requests', { headers }),
        ]);

        if (!active) return;

        if (meRes.ok) {
          const d = await meRes.json();
          if (d.success) {
            setCrew(d.crew);
            if (d.leader) setLeader(d.leader);
          }
        }
        if (membersRes.ok) {
          const d = await membersRes.json();
          if (d.success && Array.isArray(d.members)) setMembers(d.members);
        }
        if (notifsRes.ok) {
          const d = await notifsRes.json();
          if (d.success && Array.isArray(d.notifications)) setNotifications(d.notifications);
        }
        if (tasksRes.ok) {
          const d = await tasksRes.json();
          if (d.success && Array.isArray(d.tasks)) setTasks(d.tasks);
        }
        if (issuesRes.ok) {
          const d = await issuesRes.json();
          if (d.success && Array.isArray(d.issues)) setCityIssues(d.issues);
        }
        if (requestsRes.ok) {
          const d = await requestsRes.json();
          if (d.success && Array.isArray(d.requests)) setMyRequests(d.requests);
        }
      } catch (err) {
        console.error('Error loading crew dashboard data:', err);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadAll();

    return () => {
      active = false;
    };
  }, [token, user?.city]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      fetchCrewProfile(),
      fetchMembers(),
      fetchNotifications(),
      fetchTasks(),
      fetchCityIssues(),
      fetchMyRequests(),
    ]);
    setIsRefreshing(false);
    showToast('Platform data refreshed from database.', 'info');
  };

  // Action: Toggle Active / Busy
  const handleToggleStatus = async (newStatus) => {
    try {
      setIsTogglingStatus(true);
      const res = await fetch('/api/crew/status', {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setCrew((prev) => (prev ? { ...prev, status: data.status } : prev));
        showToast(`Working status set to ${data.status}.`, 'success');
      } else {
        showToast(data.message || 'Could not update status.', 'error');
      }
    } catch (err) {
      showToast('Network error updating status.', 'error');
    } finally {
      setIsTogglingStatus(false);
    }
  };

  // Action: Add member
  const handleAddMember = async (memberData) => {
    const res = await fetch('/api/crew/members', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(memberData),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to add member.');
    }
    setMembers((prev) => [...prev, data.member]);
    setCrew((prev) => (prev ? { ...prev, membersCount: prev.membersCount + 1 } : prev));
    showToast(`${data.member.name} added to crew roster!`, 'success');
  };

  // Action: Remove member
  const handleRemoveMember = async (memberId) => {
    try {
      setIsRemovingMember(true);
      const res = await fetch(`/api/crew/members/${encodeURIComponent(memberId)}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      const data = await res.json();
      if (data.success) {
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
        setCrew((prev) =>
          prev ? { ...prev, membersCount: Math.max(0, prev.membersCount - 1) } : prev
        );
        showToast(data.message || 'Member removed from roster.', 'info');
      } else {
        showToast(data.message || 'Could not remove member.', 'error');
      }
    } catch (err) {
      showToast('Network error removing member.', 'error');
    } finally {
      setIsRemovingMember(false);
    }
  };

  // Action: Accept / Reject task assignment
  const handleRespondToTask = async (taskId, action, reason = '') => {
    try {
      setIsRespondingTask(true);
      const res = await fetch(`/api/crew/tasks/${encodeURIComponent(taskId)}/respond`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ action, reason }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, action === 'accept' ? 'success' : 'info');
        // Refresh tasks and status
        await Promise.all([fetchTasks(), fetchCrewProfile(), fetchNotifications()]);
      } else {
        showToast(data.message || 'Failed to process task decision.', 'error');
      }
    } catch (err) {
      showToast('Error responding to work order.', 'error');
    } finally {
      setIsRespondingTask(false);
    }
  };

  // Action: Request to work on an unassigned defect on map
  const handleRequestTask = async (issueId, notes) => {
    const res = await fetch('/api/crew/request-task', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ issueId, notes }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to submit assignment request.');
    }
    showToast(data.message, 'success');
    await fetchMyRequests();
  };

  // Divert directly from notification to task panel
  const handleSelectTaskNotification = (issueId) => {
    setActiveTab('tasks');
    setHighlightTaskId(issueId);
    setTimeout(() => {
      const el = document.getElementById(`task-${issueId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 200);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login?portal=crew');
  };

  const pendingAssignmentsCount = notifications.filter((n) => n.isPendingAcceptance).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      {/* Toast Alert */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl text-xs font-bold border flex items-center gap-2 animate-in slide-in-from-bottom duration-200 ${
            toast.type === 'error'
              ? 'bg-rose-600 text-white border-rose-700'
              : toast.type === 'info'
              ? 'bg-slate-900 text-white border-slate-800'
              : 'bg-emerald-600 text-white border-emerald-700'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header */}
      <CrewHeader
        crew={crew}
        leader={leader}
        notifications={notifications}
        onToggleStatus={handleToggleStatus}
        onSelectTaskNotification={handleSelectTaskNotification}
        onLogout={handleLogout}
        isTogglingStatus={isTogglingStatus}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Navigation Tabs Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs">
          <nav
            aria-label="Crew Operations Tabs"
            className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1"
          >
            <button
              type="button"
              onClick={() => {
                setActiveTab('tasks');
                setHighlightTaskId(null);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'tasks'
                  ? 'bg-teal-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>Assigned Work Orders</span>
              {pendingAssignmentsCount > 0 && (
                <span className="bg-amber-400 text-slate-900 px-1.5 py-0.2 rounded-full text-[10px] font-black">
                  {pendingAssignmentsCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('members')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'members'
                  ? 'bg-teal-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Crew Members</span>
              <span className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded-full text-[10px]">
                {members.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('map')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'map'
                  ? 'bg-teal-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Map className="w-4 h-4" />
              <span>City Hazard Map</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('requests')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'requests'
                  ? 'bg-teal-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>My Task Requests</span>
              {myRequests.length > 0 && (
                <span className="bg-teal-50 text-teal-800 border border-teal-200 px-1.5 py-0.2 rounded-full text-[10px]">
                  {myRequests.length}
                </span>
              )}
            </button>
          </nav>

          {/* Quick Telemetry & Refresh */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>PostgreSQL Live Synced</span>
            </span>
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              title="Refresh telemetry"
              className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tab 1: Assigned Work Orders */}
        {activeTab === 'tasks' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Municipal Task Assignments ({tasks.length})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tasks assigned to your crew by the municipal control room. Review and accept or decline.
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-2 text-teal-600" />
                <p className="text-xs font-semibold text-slate-600">Loading work orders from registry...</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center">
                <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center mx-auto mb-3">
                  <ClipboardList className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">No active work orders assigned</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  When municipal administrators dispatch tasks to your crew, they will appear here with instant review options.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('map')}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
                >
                  <Map className="w-4 h-4" />
                  <span>Browse Map & Request a Task</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {tasks.map((task) => (
                  <AssignedTaskCard
                    key={task.id}
                    task={task}
                    onRespond={handleRespondToTask}
                    isResponding={isRespondingTask}
                    highlight={task.id === highlightTaskId}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Crew Members Management */}
        {activeTab === 'members' && (
          <CrewMembersRoster
            members={members}
            onOpenAddModal={() => setAddMemberModalOpen(true)}
            onRemoveMember={handleRemoveMember}
            isRemoving={isRemovingMember}
          />
        )}

        {/* Tab 3: City Hazard Map */}
        {activeTab === 'map' && (
          <CrewMapTab
            issues={cityIssues}
            crewCity={crew?.city || user?.city || 'Pune'}
            crewName={crew?.name}
            myRequests={myRequests}
            onRequestTask={handleRequestTask}
          />
        )}

        {/* Tab 4: My Task Requests */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  My Assignment Requests ({myRequests.length})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tasks your team requested on the city map pending administrative approval
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('map')}
                className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Map className="w-4 h-4" />
                <span>Explore Map</span>
              </button>
            </div>

            {myRequests.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <Send className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">No task requests submitted yet</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Browse defects on the City Hazard Map and use the "Request to Work on This Task" button to initiate assignment requests.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myRequests.map((req) => (
                  <div
                    key={req.id}
                    className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        {req.referenceNumber}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          req.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : req.status === 'rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {req.status === 'pending' ? 'Pending Admin Review' : req.status}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      {req.title}
                    </h4>

                    <div className="text-xs text-slate-500 flex items-center gap-1.5">
                      <span>{req.locationName || req.city}</span>
                      <span>•</span>
                      <span className="font-semibold text-slate-700 capitalize">{req.category}</span>
                    </div>

                    {req.notes && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic">
                        "{req.notes}"
                      </p>
                    )}

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Requested on: {new Date(req.createdAt).toLocaleDateString()}</span>
                      <span className="text-teal-700 font-semibold">{req.city} Zone</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Add Crew Member Modal */}
      <AddMemberModal
        isOpen={addMemberModalOpen}
        onClose={() => setAddMemberModalOpen(false)}
        onAddMember={handleAddMember}
      />
    </div>
  );
}
