import { Outlet } from 'react-router-dom';

export default function CitizenLayout() {
  return (
    <main className="layout">
      <Outlet />
    </main>
  );
}
