import { useAuth } from '../context/AuthContext';
import { useNav } from '../hooks/useCitizenNav';
import { LogOutIcon } from '../components/citizen/icons';
import { btnOutline } from '../components/citizen/ui';

// Shows the signed-in account from AuthContext (real backend login).
export default function Profile() {
  const { user } = useAuth();
  const { signOut } = useNav();
  const rows = [
    ['Email', user?.email],
    ['Role', user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : ''],
    ['Organisation', user?.organisation || 'Not provided'],
  ];
  return (
    <div className="px-4 pb-28 pt-6 lg:max-w-xl lg:pt-8">
      <h1 className="text-xl font-bold text-slate-900">Profile</h1>
      <div className="mt-6 flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-6 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-100 text-xl font-bold text-teal-700">
          {user?.name?.charAt(0).toUpperCase() ?? 'U'}
        </span>
        <p className="mt-3 font-semibold text-slate-900">{user?.name}</p>
        <dl className="mt-4 w-full space-y-2 text-left text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="flex gap-3">
              <dt className="w-28 shrink-0 text-slate-500">{k}</dt>
              <dd className="min-w-0 flex-1 break-words text-slate-900">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="mt-4">
        <button type="button" onClick={signOut} className={btnOutline}>
          <LogOutIcon className="h-4 w-4" /> Log out
        </button>
      </div>
    </div>
  );
}