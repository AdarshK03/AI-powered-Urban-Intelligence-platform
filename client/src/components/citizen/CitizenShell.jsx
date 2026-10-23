import { Outlet } from 'react-router-dom';
import { useNav } from '../../hooks/useCitizenNav';
import BottomNavigation from './BottomNavigation';
import SidebarNavigation from './SidebarNavigation';

const WITH_BOTTOM_NAV = ['home', 'map', 'myreports', 'profile']; // phones/tablets only

// Layout for every /citizen/* route: sidebar on desktop, responsive main view.
export default function CitizenShell() {
  const { route } = useNav();
  const isMapRoute = route.name === 'map';

  return (
    <div className="citizen-app min-h-dvh bg-slate-50 font-sans text-slate-800 lg:flex">
      <SidebarNavigation />
      <main className="relative min-h-dvh w-full lg:min-w-0 lg:flex-1 bg-slate-50 flex flex-col">
        <div className={`flex-1 w-full ${isMapRoute ? 'h-full flex flex-col' : 'max-w-6xl mx-auto px-2 sm:px-4 lg:px-8 py-2 sm:py-4'}`}>
          <Outlet />
        </div>
        {WITH_BOTTOM_NAV.includes(route.name) && (
          <div className="lg:hidden">
            <BottomNavigation />
          </div>
        )}
      </main>
    </div>
  );
}