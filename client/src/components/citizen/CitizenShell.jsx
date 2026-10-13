import { Outlet } from 'react-router-dom';
import { useNav } from '../../hooks/useCitizenNav';
import BottomNavigation from './BottomNavigation';
import SidebarNavigation from './SidebarNavigation';
 
const WITH_BOTTOM_NAV = ['home', 'map', 'myreports', 'profile']; // phones/tablets only
 
// Layout for every /citizen/* route: sidebar on desktop, bottom bar on mobile.
export default function CitizenShell() {
  const { route } = useNav();
  // The map fills the content area on desktop; other pages stay centred and readable.
  const contentWidth = route.name === 'map' ? '' : 'lg:mx-auto lg:max-w-5xl';
  return (
    <div className="citizen-app min-h-dvh bg-slate-100 font-sans text-slate-700 lg:flex">
      <SidebarNavigation />
      <main className="relative mx-auto min-h-dvh w-full max-w-md bg-white md:max-w-2xl md:shadow-xl lg:mx-0 lg:min-w-0 lg:max-w-none lg:flex-1 lg:bg-slate-50 lg:shadow-none">
        <div className={contentWidth}>
          <Outlet />
        </div>
        {WITH_BOTTOM_NAV.includes(route.name) && <BottomNavigation />}
      </main>
    </div>
  );
}
 