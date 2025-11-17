// src/components/layout/Layout.jsx
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import GlobalLoadingOverlay from '../features/GlobalLoadingOverlay';

export default function Layout() {
  return (
    <div className="flex h-screen w-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 overflow-hidden transition-colors duration-300">
      <Sidebar />
      <main className="flex-1 overflow-hidden p-4 lg:p-6 flex flex-col relative">
        <div className="flex-1 overflow-hidden rounded-lg">
          <Outlet />
        </div>
        {/* Loading overlay chỉ che phần main content */}
        <GlobalLoadingOverlay />
      </main>
    </div>
  );
}