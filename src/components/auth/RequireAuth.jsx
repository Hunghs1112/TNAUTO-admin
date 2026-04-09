import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-white/20 border-t-[#e0a02e]" />
        <p className="text-sm text-slate-300">Đang khởi tạo phiên gara...</p>
      </div>
    </div>
  );
}

export default function RequireAuth() {
  const location = useLocation();
  const { authReady, isAuthenticated } = useAuth();

  if (!authReady) {
    return <FullScreenLoader />;
  }

  if (!isAuthenticated) {
    const redirectTarget = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to="/login" replace state={{ from: redirectTarget }} />;
  }

  return <Outlet />;
}
