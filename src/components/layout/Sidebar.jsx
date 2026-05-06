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
  Menu,
  Package,
  Repeat,
  Settings,
  Shield,
  Store,
  Tag,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import ThemeToggle from '../ui/ThemeToggle';

const menuItems = [
  { id: 'garages', label: 'Gara', icon: Building2, path: '/garages', superOnly: true },
  { id: 'garage-managers', label: 'Tài khoản quản lí', icon: UserCog, path: '/garage-managers', superOnly: true },
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-900/50">
          {garage.avatar_url ? (
            <img src={garage.avatar_url} alt={garage.name || 'Garage'} className="h-full w-full object-contain" />
          ) : (
            <Building2 className="h-6 w-6 text-slate-400" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-slate-400">Gara hiện tại</p>
          <p className="truncate text-[15px] font-semibold leading-tight text-white">{garage.name || 'Gara hiện tại'}</p>
          {garage.is_super_garage ? (
            <span className="mt-2 inline-flex rounded-full border border-amber-400/40 bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-200">
              Super Garage
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { garage, isSuperGarage, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const currentPath = location.pathname;
  const pageTitle = useMemo(() => getPageTitle(currentPath), [currentPath]);
  const items = useMemo(() => menuItems.filter((item) => !item.superOnly || isSuperGarage), [isSuperGarage]);

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
        <div className="relative border-b border-slate-800/50 bg-slate-900/30 px-6 py-6">
          <ThemeToggle className="absolute right-6 top-6" />
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">GaraOne Multi-Gara</p>
          <h2 className="mt-3 text-xl font-bold text-white">Bảng điều khiển gara</h2>
          <div className="mt-2 flex items-center gap-2 text-sm text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-[#e0a02e]" />
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
                  isActive ? 'scale-[1.01] text-white shadow-lg' : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
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
                <span className="h-1.5 w-1.5 rounded-full bg-[#e0a02e]" />
                <span className="truncate">{garage?.name || 'Phiên gara hiện tại'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
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
