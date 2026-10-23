import React, { useState, useRef, useEffect } from 'react';
import { LogoMark } from '../../assets/Icons';
import { Bell, LogOut, CheckCircle2, Clock, AlertTriangle, Shield, Wrench, MapPin } from 'lucide-react';
import CrewStatusBadge from './CrewStatusBadge';
import CrewNotificationDropdown from './CrewNotificationDropdown';

export default function CrewHeader({
  crew,
  leader,
  notifications = [],
  onToggleStatus,
  onSelectTaskNotification,
  onLogout,
  isTogglingStatus = false,
}) {
  const [notifOpen, setNotifOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notifOpen]);

  const unreadCount = notifications.filter((n) => n.isPendingAcceptance).length;
  const isAvailable =
    (crew?.status || '').toLowerCase() === 'available' ||
    (crew?.status || '').toLowerCase() === 'active';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Branding & Leader Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold shadow-sm shrink-0">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                {crew?.name || 'Field Crew Portal'}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                <MapPin className="w-3 h-3 text-teal-600" />
                {crew?.city || leader?.city || 'Pune'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
              <span>Leader: <strong className="text-slate-700">{leader?.name || 'Leader'}</strong></span>
              <span>•</span>
              <span>Vehicle: <strong className="font-mono text-slate-700">{crew?.vehicleNumber || 'MH-12-GOV-01'}</strong></span>
            </p>
          </div>
        </div>

        {/* Right: Working Status Toggle + Notification Bell + Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Status Toggle Button (Active vs Busy) */}
          <div className="flex items-center gap-2">
            <CrewStatusBadge status={crew?.status || 'Available'} className="hidden md:inline-flex" />
            <button
              type="button"
              onClick={() => onToggleStatus(isAvailable ? 'Busy' : 'Available')}
              disabled={isTogglingStatus}
              title={`Switch working status to ${isAvailable ? 'Busy' : 'Active'}`}
              className={`cursor-pointer px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-2xs flex items-center gap-1.5 ${isAvailable
                  ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700'
                } disabled:opacity-50`}
            >
              <span>{isAvailable ? 'Set as Busy' : 'Set as Active'}</span>
            </button>
          </div>

          {/* Notifications Dropdown Container */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setNotifOpen((prev) => !prev)}
              aria-label={`Task notifications (${notifications.length})`}
              aria-expanded={notifOpen}
              className="relative p-2 rounded-xl text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            <CrewNotificationDropdown
              notifications={notifications}
              isOpen={notifOpen}
              onClose={() => setNotifOpen(false)}
              onSelectNotification={onSelectTaskNotification}
            />
          </div>

          {/* Logout Button */}
          <button
            type="button"
            onClick={onLogout}
            title="Log out of Crew Portal"
            className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
