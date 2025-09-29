// src/components/Layout.jsx
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  const location = useLocation();
  console.log('Layout rendered at path:', location.pathname);

  return (
    <div className="flex h-full w-full bg-gray-100 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto p-0 lg:p-8 w-full h-full">
        <Outlet />
      </main>
    </div>
  );
}