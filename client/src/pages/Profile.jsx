import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNav } from '../hooks/useCitizenNav';
import { LogOutIcon } from '../components/citizen/icons';
import { btnOutline, btnPrimary, inputCls } from '../components/citizen/ui';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const { signOut } = useNav();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [organisation, setOrganisation] = useState(user?.organisation || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    const res = await updateProfile({ name, organisation, phone });
    setSaving(false);
    if (res.success) {
      setMsg('Profile updated successfully in PostgreSQL database!');
      setIsEditing(false);
      setTimeout(() => setMsg(''), 4000);
    } else {
      setMsg(res.message || 'Failed to update profile.');
    }
  };

  const rows = [
    ['Email', user?.email],
    ['Role', user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Citizen'],
    ['Organisation', user?.organisation || 'Not provided'],
    ['Phone', user?.phone || 'Not provided'],
  ];

  return (
    <div className="px-4 pb-28 pt-6 lg:max-w-xl lg:pt-8">
      <h1 className="text-xl font-bold text-slate-900">Profile</h1>

      {msg && (
        <div className="mt-4 rounded-xl bg-teal-50 p-3 text-sm font-semibold text-teal-800">
          {msg}
        </div>
      )}

      <div className="mt-6 flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-6 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-100 text-xl font-bold text-teal-700">
          {user?.name?.charAt(0).toUpperCase() ?? 'U'}
        </span>
        <p className="mt-3 font-semibold text-slate-900">{user?.name}</p>

        {!isEditing ? (
          <>
            <dl className="mt-4 w-full space-y-2 text-left text-sm">
              {rows.map(([k, v]) => (
                <div key={k} className="flex gap-3">
                  <dt className="w-28 shrink-0 text-slate-500">{k}</dt>
                  <dd className="min-w-0 flex-1 break-words text-slate-900">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-6 w-full">
              <button
                type="button"
                onClick={() => {
                  setName(user?.name || '');
                  setOrganisation(user?.organisation || '');
                  setPhone(user?.phone || '');
                  setIsEditing(true);
                }}
                className={btnOutline}
              >
                Edit Profile Details
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSave} className="mt-4 w-full space-y-3 text-left">
            <div>
              <label className="text-xs font-semibold text-slate-700">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Organisation / Community</label>
              <input
                type="text"
                value={organisation}
                onChange={(e) => setOrganisation(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className={inputCls}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={saving} className={`${btnPrimary} flex-1`}>
                {saving ? 'Saving...' : 'Save to Database'}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className={btnOutline}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="mt-4">
        <button type="button" onClick={signOut} className={btnOutline}>
          <LogOutIcon className="h-4 w-4" /> Log out
        </button>
      </div>
    </div>
  );
}