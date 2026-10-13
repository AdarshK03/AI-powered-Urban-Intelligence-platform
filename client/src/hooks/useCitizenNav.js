import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
 
// Thin helper over react-router so citizen screens can say navigate('issue', { id }).
// Real URLs: /citizen, /citizen/report, /citizen/map, /citizen/issues/:id, ...
const PATHS = {
  home: '/citizen',
  report: '/citizen/report',
  map: '/citizen/map',
  myreports: '/citizen/my-reports',
  profile: '/citizen/profile',
};
 
function nameFromPath(pathname) {
  if (pathname.startsWith('/citizen/issues/')) return 'issue';
  const clean = pathname.replace(/\/$/, '');
  const hit = Object.entries(PATHS).find(([, p]) => p === clean);
  return hit ? hit[0] : 'home';
}
 
export function useNav() {
  const go = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
 
  const route = useMemo(() => ({ name: nameFromPath(location.pathname) }), [location.pathname]);
 
  const navigate = useCallback(
    (name, params = {}, { replace = false } = {}) => {
      let to = name === 'issue' ? `/citizen/issues/${params.id}` : (PATHS[name] ?? PATHS.home);
      if (name === 'map' && params.category) to += `?category=${encodeURIComponent(params.category)}`;
      go(to, { replace });
      window.scrollTo(0, 0);
    },
    [go],
  );
 
  // "default" key means this is the first page of the session, so there is nothing to go back to.
  const back = useCallback(() => {
    if (location.key !== 'default') go(-1);
    else go(PATHS.home);
  }, [go, location.key]);
 
  const signOut = useCallback(async () => {
    await logout();
    go('/login');
  }, [logout, go]);
 
  return { route, navigate, back, signOut };
}
 