import { memo, useCallback, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  Building2,
  Car,
  ChevronDown,
  FileText,
  FolderOpen,
  LogOut,
  MapPin,
  Menu,
  Package,
  Repeat,
  Settings,
  Shield,
  Store,
  Tag,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const menuItems = [
  { id: 'customers', label: 'Khách hàng', icon: Users, path: '/customers' },
  { id: 'dealers', label: 'Đại lý', icon: Store, path: '/dealers' },
  { id: 'employees', label: 'Nhân viên', icon: Users, path: '/employees' },
  { id: 'vehicles', label: 'Xe', icon: Car, path: '/vehicles' },
  { id: 'services', label: 'Dịch vụ', icon: Settings, path: '/services' },
  { id: 'service-categories', label: 'Danh mục dịch vụ', icon: FolderOpen, path: '/service-categories' },
  { id: 'categories', label: 'Danh mục sản phẩm', icon: FolderOpen, path: '/categories' },
  { id: 'products', label: 'Sản phẩm', icon: Package, path: '/products' },
  { id: 'dealer-catalog', label: 'Danh mục sản phẩm đại lý', icon: Store, path: '/dealer-catalog' },
  { id: 'service-orders', label: 'Đơn dịch vụ', icon: FileText, path: '/service-orders' },
  { id: 'notifications', label: 'Thông báo', icon: Bell, path: '/notifications' },
  { id: 'service-reminder-rules', label: 'Quy tắc nhắc dịch vụ', icon: Repeat, path: '/service-reminder-rules' },
  { id: 'warranties', label: 'Bảo hành', icon: Shield, path: '/warranties' },
  { id: 'dealer-warranties', label: 'Bảo hành đại lý', icon: Shield, path: '/dealer-warranties' },
  { id: 'offers', label: 'Ưu đãi', icon: Tag, path: '/offers' },
];

function getPageTitle(pathname) {
  const matchedItem = menuItems.find((item) => item.path === pathname);
  if (matchedItem) {
    return matchedItem.label;
  }

  if (pathname === '/') {
    return 'Khách hàng';
  }

  return 'Trang quản trị';
}

function GarageIdentity({ garage }) {
  if (!garage) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-900/50">
          {garage.avatar_url ? (
            <img src={garage.avatar_url} alt={garage.name || garage.code || 'Garage'} className="h-full w-full object-cover" />
          ) : (
            <Building2 className="h-7 w-7 text-slate-400" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold text-white">{garage.name || 'Gara hiện tại'}</div>
          <div className="mt-1 inline-flex rounded-full border border-blue-400/20 bg-blue-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-200">
            {garage.code || 'NO-CODE'}
          </div>

          {garage.address ? (
            <div className="mt-2 flex items-start gap-2 text-xs leading-5 text-slate-300">
              <MapPin size={14} className="mt-0.5 shrink-0 text-slate-500" />
              <span>{garage.address}</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { garage, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const currentPath = location.pathname;
  const pageTitle = useMemo(() => getPageTitle(currentPath), [currentPath]);
  const items = useMemo(() => menuItems, []);

  const handleNavigate = useCallback(
    (item) => {
      navigate(item.path);
      setIsMenuOpen(false);
    },
    [navigate]
  );

  const handleLogout = useCallback(() => {
    logout('manual');
    setIsMenuOpen(false);
    navigate('/login', { replace: true });
  }, [logout, navigate]);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
  }, []);

  return (
    <>
      <aside
        className="hidden h-screen w-80 shrink-0 border-r border-slate-800/50 lg:flex lg:flex-col"
        style={{ background: 'var(--gradient-sidebar)' }}
      >
        <div className="border-b border-slate-800/50 bg-slate-900/30 px-6 py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">TNAUTO Multi-Gara</p>
          <h2 className="mt-3 text-xl font-bold text-white">Bảng điều khiển gara</h2>
          <div className="mt-2 flex items-center gap-2 text-sm text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
            <span>{pageTitle}</span>
          </div>

          <div className="mt-5">
            <GarageIdentity garage={garage} />
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {items.map((item) => {
            const isActive = currentPath === item.path || (currentPath === '/' && item.path === '/customers');

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item)}
                className={`flex min-h-[48px] w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'scale-[1.01] text-white shadow-lg'
                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                }`}
                style={isActive ? { background: 'var(--gradient-primary)' } : undefined}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-800/50 p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
          >
            <LogOut className="h-5 w-5" />
            <span>Đăng xuất / đổi gara</span>
          </button>
        </div>
      </aside>

      <nav
        className="fixed left-0 right-0 top-0 z-50 border-b border-slate-800/50 shadow-lg lg:hidden"
        style={{ background: 'var(--gradient-sidebar)' }}
      >
        <div className="border-b border-slate-800/50 bg-slate-900/30 px-4 py-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-bold text-white">{pageTitle}</h1>
              <div className="mt-1 flex items-center gap-2 text-xs text-slate-300">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                <span className="truncate">{garage?.name || garage?.code || 'Phiên gara hiện tại'}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleMenu}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-white transition-colors hover:bg-slate-800/50"
              aria-label="Mở menu"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              <ChevronDown className={`h-4 w-4 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {isMenuOpen ? (
          <>
            <div className="fixed inset-0 top-[73px] z-40 bg-black/50" onClick={() => setIsMenuOpen(false)} />
            <div className="absolute left-0 right-0 top-full z-50 max-h-[calc(100vh-73px)] overflow-y-auto border-b border-slate-800/50 bg-slate-950 px-3 py-3 shadow-xl">
              <div className="mb-3">
                <GarageIdentity garage={garage} />
              </div>

              <div className="space-y-1">
                {items.map((item) => {
                  const isActive = currentPath === item.path || (currentPath === '/' && item.path === '/customers');

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNavigate(item)}
                      className={`flex min-h-[48px] w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                        isActive ? 'text-white shadow-lg' : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                      }`}
                      style={isActive ? { background: 'var(--gradient-primary)' } : undefined}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      <span className="flex-1 text-left">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="mt-3 flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
              >
                <LogOut className="h-5 w-5" />
                <span>Đăng xuất / đổi gara</span>
              </button>
            </div>
          </>
        ) : null}
      </nav>
    </>
  );
}

export default memo(Sidebar);
