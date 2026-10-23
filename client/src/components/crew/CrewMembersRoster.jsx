import React, { useState } from 'react';
import { Plus, User, Trash2, Shield, Calendar, AlertCircle, Search, Wrench, CheckCircle2 } from 'lucide-react';

export default function CrewMembersRoster({
  members = [],
  onOpenAddModal,
  onRemoveMember,
  isRemoving = false,
}) {
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const confirmDelete = async () => {
    if (!memberToDelete) return;
    await onRemoveMember(memberToDelete.id);
    setMemberToDelete(null);
  };

  const filteredMembers = members.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = (m.name || '').toLowerCase();
    const role = (m.role || '').toLowerCase();
    return name.includes(q) || role.includes(q);
  });

  return (
    <div className="space-y-5">
      {/* Top Banner and Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-teal-50 text-teal-700">
              <Wrench className="w-5 h-5" />
            </span>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Crew Personnel Roster ({members.length})
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage field operators, asphalt technicians, equipment operators, and emergency road crews
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer self-start sm:self-auto active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Crew Member</span>
        </button>
      </div>

      {/* Search Bar if members exist */}
      {members.length > 0 && (
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search roster by member name or role..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 shadow-2xs"
          />
        </div>
      )}

      {/* Roster Grid */}
      {members.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <User className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No crew members added yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
            Register your active squad technicians, heavy equipment drivers, and road maintenance personnel.
          </p>
          <button
            type="button"
            onClick={onOpenAddModal}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add First Member</span>
          </button>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-xs">
          No crew members matching "{searchQuery}".
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member) => (
            <div
              key={member.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all duration-200 relative group"
            >
              <div className="flex items-start gap-3.5">
                {/* Photo / Avatar */}
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 text-white overflow-hidden shrink-0 flex items-center justify-center shadow-sm">
                  {member.photoUrl ? (
                    <img
                      src={member.photoUrl}
                      alt={member.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className="text-base font-black">
                      {(member.name || 'M').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-slate-900 truncate">
                    {member.name}
                  </h4>
                  <span className="inline-block mt-1 text-[11px] font-semibold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200/80">
                    {member.role || 'Field Operator'}
                  </span>
                  <p className="text-xs text-slate-500 mt-2 flex items-center gap-2">
                    <span>Age: <strong className="text-slate-700">{member.age || '—'} yrs</strong></span>
                  </p>
                </div>
              </div>

              {/* Bottom footer & delete button */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>Enrolled: {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : 'Active'}</span>
                </span>

                <button
                  type="button"
                  onClick={() => setMemberToDelete(member)}
                  className="flex items-center gap-1 text-rose-600 hover:text-rose-700 font-semibold px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Dialog for Removal */}
      {memberToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
        >
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Remove Crew Member?</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Are you sure you want to remove <strong className="text-slate-800">{memberToDelete.name}</strong> from your active field crew roster?
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setMemberToDelete(null)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isRemoving}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer disabled:opacity-50"
              >
                {isRemoving ? 'Removing...' : 'Confirm Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
