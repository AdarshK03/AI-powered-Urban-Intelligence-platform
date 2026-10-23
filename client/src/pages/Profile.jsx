import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useIssues } from '../context/IssueContext';
import { useNav } from '../hooks/useCitizenNav';
import {
  User,
  Mail,
  Phone,
  Building,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Edit3,
  X,
  Save,
  RefreshCw,
  LogOut,
  FileText,
  ThumbsUp,
  CheckCircle,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { validateFullName } from '../utils/authValidation';

const CITY_OPTIONS = ['Pune', 'New Delhi', 'Mumbai', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata'];

export default function Profile() {
  const { user, updateProfile, refreshUser } = useAuth();
  const { issues } = useIssues();
  const { signOut } = useNav();

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [name, setName] = useState(user?.name || '');
  const [organisation, setOrganisation] = useState(user?.organisation || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [city, setCity] = useState(user?.city || 'Pune');

  // Feedback states
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [formErrors, setFormErrors] = useState({});

  // Sync state whenever user changes or refreshes
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setOrganisation(user.organisation || '');
      setPhone(user.phone || '');
      setCity(user.city || 'Pune');
    }
  }, [user]);

  // Initial load: refresh user profile from live database
  useEffect(() => {
    let mounted = true;
    async function loadLatest() {
      if (refreshUser) {
        try {
          await refreshUser();
        } catch {
          // Ignore background refresh errors
        }
      }
    }
    loadLatest();
    return () => {
      mounted = false;
    };
  }, [refreshUser]);

  // User civic stats calculation
  const civicStats = useMemo(() => {
    if (!issues || !user) {
      return { reportedCount: 0, supportedCount: 0, resolvedCount: 0 };
    }
    const myReports = issues.filter(
      (i) => (user.id && (i.reporter_id === user.id || i.reporterId === user.id)) ||
             (user.name && i.reporterName === user.name)
    );
    const supportedCount = issues.filter((i) => i.hasSupported || i.userVote).length;
    const resolvedCount = myReports.filter((i) => (i.status || '').toLowerCase() === 'resolved').length;

    return {
      reportedCount: myReports.length,
      supportedCount,
      resolvedCount,
    };
  }, [issues, user]);

  const validateForm = () => {
    const errors = {};

    // 1. Full name validation
    const nameErr = validateFullName(name);
    if (nameErr) {
      errors.name = nameErr;
    }

    // 2. Phone validation (optional, but if provided must look like a valid phone number)
    if (phone && phone.trim()) {
      const cleaned = phone.replace(/[\s\-\(\)]/g, '');
      if (!/^\+?[0-9]{7,15}$/.test(cleaned)) {
        errors.phone = 'Please enter a valid phone number (e.g. +91 98765 43210).';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const res = await updateProfile({
        name: name.trim(),
        organisation: organisation.trim(),
        phone: phone.trim(),
        city: city.trim(),
      });

      if (res && res.success) {
        setSuccessMsg('Profile and preferences updated successfully in database!');
        setIsEditing(false);
        setFormErrors({});
        setTimeout(() => setSuccessMsg(''), 4500);
      } else {
        setErrorMsg(res?.message || 'Failed to update profile.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Network error updating profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setName(user?.name || '');
    setOrganisation(user?.organisation || '');
    setPhone(user?.phone || '');
    setCity(user?.city || 'Pune');
    setFormErrors({});
    setErrorMsg('');
    setIsEditing(false);
  };

  const formattedJoinDate = useMemo(() => {
    const rawDate = user?.createdAt || user?.created_at;
    if (!rawDate) return 'Active Member';
    try {
      return new Date(rawDate).toLocaleDateString('en-IN', {
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return 'Active Member';
    }
  }, [user]);

  const userInitial = (user?.name?.charAt(0) || 'C').toUpperCase();
  const roleName = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : 'Citizen';

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-28 lg:pb-12 space-y-6 animate-in fade-in duration-200">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <span>User Profile & Account</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
              {roleName}
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your personal credentials, home municipal region, and civic activity
          </p>
        </div>
      </div>

      {/* Global Alerts */}
      {successMsg && (
        <div
          role="status"
          className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-semibold text-emerald-800 flex items-start gap-2.5 shadow-xs"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">{successMsg}</div>
          <button
            type="button"
            onClick={() => setSuccessMsg('')}
            className="text-emerald-500 hover:text-emerald-700 p-0.5 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div
          role="alert"
          className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs font-semibold text-rose-800 flex items-start gap-2.5 shadow-xs"
        >
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">{errorMsg}</div>
          <button
            type="button"
            onClick={() => setErrorMsg('')}
            className="text-rose-500 hover:text-rose-700 p-0.5 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* User Hero Banner Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0d6e82] via-[#0f766e] to-[#115e59] p-6 sm:p-8 text-white shadow-md">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Avatar Initial */}
            <div className="relative shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center text-2xl sm:text-3xl font-extrabold text-white shadow-inner">
                {userInitial}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-400 border-2 border-[#0d6e82] flex items-center justify-center text-slate-900" title="Active">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Profile Header Details */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold truncate">
                  {user?.name || 'Citizen User'}
                </h2>
                <span className="bg-white/20 backdrop-blur-xs text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-white/20">
                  📍 {user?.city || 'Pune'}
                </span>
              </div>
              <p className="text-xs text-teal-100 flex items-center gap-1.5 mt-1 truncate">
                <Mail className="w-3.5 h-3.5 shrink-0 opacity-80" />
                <span className="truncate">{user?.email || 'user@example.com'}</span>
              </p>
              <p className="text-[11px] text-teal-200 mt-1 flex items-center gap-2">
                <span>Member since: {formattedJoinDate}</span>
                <span>•</span>
                <span>Role: {roleName}</span>
              </p>
            </div>
          </div>

          {!isEditing && (
            <button
              type="button"
              onClick={() => {
                setErrorMsg('');
                setSuccessMsg('');
                setIsEditing(true);
              }}
              className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-teal-800 hover:bg-teal-50 font-bold text-xs shadow-sm transition-all cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>

        {/* Background decorative subtle circles */}
        <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute right-32 -top-12 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
      </div>

      {/* Civic Impact Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-700 border border-teal-100 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-500 block">Issues Reported</span>
            <span className="text-xl font-bold text-slate-900 leading-tight">
              {civicStats.reportedCount}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-700 border border-sky-100 flex items-center justify-center shrink-0">
            <ThumbsUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-500 block">Votes & Supports</span>
            <span className="text-xl font-bold text-slate-900 leading-tight">
              {civicStats.supportedCount}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-500 block">Resolved Hazards</span>
            <span className="text-xl font-bold text-slate-900 leading-tight">
              {civicStats.resolvedCount}
            </span>
          </div>
        </div>
      </div>

      {/* Main Profile Details Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-2xs">
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Personal & Regional Information</h3>
            <p className="text-xs text-slate-500">
              Details loaded directly from the PostgreSQL municipal database
            </p>
          </div>
          {isEditing && (
            <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
              Editing Mode
            </span>
          )}
        </div>

        {!isEditing ? (
          /* View Mode */
          <div className="space-y-6">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div className="bg-slate-50/70 rounded-xl p-3.5 border border-slate-100">
                <dt className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mb-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Full Legal Name</span>
                </dt>
                <dd className="font-bold text-slate-900 break-words">
                  {user?.name || 'Not provided'}
                </dd>
              </div>

              <div className="bg-slate-50/70 rounded-xl p-3.5 border border-slate-100">
                <dt className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mb-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Registered Email</span>
                </dt>
                <dd className="font-bold text-slate-900 break-words flex items-center gap-1.5">
                  <span>{user?.email || 'Not provided'}</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                    Verified
                  </span>
                </dd>
              </div>

              <div className="bg-slate-50/70 rounded-xl p-3.5 border border-slate-100">
                <dt className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Home City / Voting Region</span>
                </dt>
                <dd className="font-bold text-slate-900 break-words flex items-center gap-2">
                  <span>{user?.city || 'Pune'}</span>
                  <span className="text-[10px] font-medium text-slate-500">
                    (Default Civic Zone)
                  </span>
                </dd>
              </div>

              <div className="bg-slate-50/70 rounded-xl p-3.5 border border-slate-100">
                <dt className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span>Account Platform Role</span>
                </dt>
                <dd className="font-bold text-slate-900 break-words">
                  {roleName} Access
                </dd>
              </div>

              <div className="bg-slate-50/70 rounded-xl p-3.5 border border-slate-100">
                <dt className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mb-1">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  <span>Organisation / Association</span>
                </dt>
                <dd className="font-medium text-slate-800 break-words">
                  {user?.organisation || 'Citizen Participant'}
                </dd>
              </div>

              <div className="bg-slate-50/70 rounded-xl p-3.5 border border-slate-100">
                <dt className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mb-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Contact Phone Number</span>
                </dt>
                <dd className="font-medium text-slate-800 break-words">
                  {user?.phone || 'Not provided'}
                </dd>
              </div>
            </dl>

            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                Need to change your home voting zone or contact information?
              </p>
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  setSuccessMsg('');
                  setIsEditing(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>
        ) : (
          /* Edit Form Mode */
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (formErrors.name) setFormErrors((p) => ({ ...p, name: null }));
                    }}
                    required
                    placeholder="e.g. Priya Sharma"
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-colors ${
                      formErrors.name
                        ? 'border-rose-400 bg-rose-50/20 focus:ring-rose-200'
                        : 'border-slate-200 bg-white focus:border-teal-600 focus:ring-teal-100'
                    }`}
                  />
                </div>
                {formErrors.name && (
                  <p className="mt-1 text-[11px] font-medium text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{formErrors.name}</span>
                  </p>
                )}
              </div>

              {/* Home City */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Home City / Registered Region <span className="text-rose-500">*</span>
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100 cursor-pointer"
                >
                  {CITY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-slate-500">
                  Your home city determines your prioritized hazard feed and voting permissions.
                </p>
              </div>

              {/* Organisation */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Organisation / Community Association
                </label>
                <input
                  type="text"
                  value={organisation}
                  onChange={(e) => setOrganisation(e.target.value)}
                  placeholder="e.g. Shivajinagar Civic Society"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (formErrors.phone) setFormErrors((p) => ({ ...p, phone: null }));
                  }}
                  placeholder="+91 98765 43210"
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-colors ${
                    formErrors.phone
                      ? 'border-rose-400 bg-rose-50/20 focus:ring-rose-200'
                      : 'border-slate-200 bg-white focus:border-teal-600 focus:ring-teal-100'
                  }`}
                />
                {formErrors.phone && (
                  <p className="mt-1 text-[11px] font-medium text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{formErrors.phone}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Read-only system attributes */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
              <div>
                <span className="font-semibold block text-slate-700">Account Email:</span>
                <span className="font-mono text-slate-500">{user?.email} (immutable)</span>
              </div>
              <span className="text-[11px] font-medium text-slate-400">
                Contact Municipal Admin to change email address
              </span>
            </div>

            {/* Form Action Buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Account Security & Sign Out Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Session & Security</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Signed in as <strong>{user?.email}</strong>. Logging out clears active token session.
          </p>
        </div>

        <button
          type="button"
          onClick={signOut}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-rose-200 text-rose-700 bg-rose-50/50 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-rose-600" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}