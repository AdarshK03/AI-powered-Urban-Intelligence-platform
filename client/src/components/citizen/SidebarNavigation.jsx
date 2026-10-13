import { useNav } from '../../hooks/useCitizenNav';
import { LogoMark } from '../../assets/Icons';
import { NAV_ITEMS } from './navItems';
import { focusRing } from './ui';
 
// Desktop-only sidebar (hidden below the lg breakpoint, where the bottom bar is used).
export default function SidebarNavigation() {
  const { route, navigate, signOut } = useNav();
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-slate-200 bg-white p-4 lg:flex">
      <div className="flex items-center gap-3 px-2 py-2">
        <LogoMark />
        <div>
          <p className="text-sm font-bold text-slate-900">Urban Intelligence</p>
          <p className="text-[11px] text-slate-500">Citizen Portal</p>
        </div>
      </div>
 
      <nav aria-label="Sidebar navigation" className="mt-6 flex-1">
        <ul className="space-y-1">
          {NAV_ITEMS.map(({ name, label, Icon, primary }) => {
            const active = route.name === name;
            const style = primary
              ? 'mt-4 bg-teal-600 text-white hover:bg-teal-700'
              : active ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-100';
            return (
              <li key={name}>
                <button type="button" onClick={() => navigate(name)} aria-current={active ? 'page' : undefined} className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold ${style} ${focusRing}`}>
                  <Icon className="h-5 w-5" />{primary ? 'Report an Issue' : label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
 
      <p className="rounded-lg bg-amber-50 p-2.5 text-[11px] text-amber-800">Prototype with demo data. Nothing is saved or sent anywhere.</p>
      <button type="button" onClick={signOut} className={`mt-3 cursor-pointer rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-500 hover:bg-slate-100 ${focusRing}`}>Log out</button>
    </aside>
  );
}