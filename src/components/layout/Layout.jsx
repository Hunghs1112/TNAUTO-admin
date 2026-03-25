import { memo } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import GlobalLoadingOverlay from '../features/GlobalLoadingOverlay';

function Layout() {
  return (
    <div className="flex h-screen flex-col overflow-hidden lg:flex-row">
      <Sidebar />
      <main className="flex-1 overflow-auto pt-20 lg:pt-0">
        <div className="mx-auto flex min-h-full w-full max-w-[1600px] flex-col gap-6 p-4 lg:p-6">
          <Outlet />
        </div>
        <GlobalLoadingOverlay />
      </main>
    </div>
  );
}

export default memo(Layout);
