import { useNav } from '../../hooks/useCitizenNav';
import { NAV_ITEMS } from './navItems';
import { focusRing } from './ui';
 
 
export default function BottomNavigation() {
  const { route, navigate } = useNav();
  return (
    <nav aria-label="Main navigation" className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-md border-t border-slate-200 bg-white md:max-w-2xl lg:hidden">
      <ul className="grid grid-cols-5 items-end px-1 pb-1.5 pt-1">
        {NAV_ITEMS.map(({ name, label, Icon, primary }) => {
          const active = route.name === name;
          return (
            <li key={name} className="flex justify-center">
              <button
                type="button"
                onClick={() => navigate(name)}
                aria-current={active ? 'page' : undefined}
                className={`flex cursor-pointer flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-[11px] font-medium ${active ? 'text-teal-700' : 'text-slate-500'} ${focusRing}`}
              >
                {primary ? (
                  <span className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-teal-600 text-white shadow-lg ring-4 ring-white">
                    <Icon className="h-7 w-7" />
                  </span>
                ) : (
                  <Icon className="h-6 w-6" />
                )}
                <span>{label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}