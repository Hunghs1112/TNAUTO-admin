// src/components/layout/Layout.jsx
import { memo } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import GlobalLoadingOverlay from '../features/GlobalLoadingOverlay';

function Layout() {
  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-50 dark:bg-slate-950 overflow-hidden">
      <Sidebar />
      {/* Mobile: Add padding top for horizontal navbar (reduced from pt-24 to pt-20 for dropdown menu) */}
      <main className="flex-1 overflow-auto p-4 lg:p-6 pt-20 lg:pt-4">
        <Outlet />
        <GlobalLoadingOverlay />
      </main>
    </div>
  );
}

export default memo(Layout);