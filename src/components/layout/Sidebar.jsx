// src/components/layout/Sidebar.jsx
import { useState, useCallback, useMemo, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Users, Settings, Package, FileText, Bell, Shield, Tag, FolderOpen, Car, Menu, ChevronDown, X } from 'lucide-react';

const menuItems = [
  { id: 'customers', label: 'Khách hàng', icon: Users, path: '/customers' },
  { id: 'employees', label: 'Nhân viên', icon: Users, path: '/employees' },
  { id: 'vehicles', label: 'Quản lý xe', icon: Car, path: '/vehicles' },
  { id: 'services', label: 'Dịch vụ', icon: Settings, path: '/services' },
  { id: 'service-categories', label: 'Danh mục dịch vụ', icon: FolderOpen, path: '/service-categories' },
  { id: 'categories', label: 'Danh mục sản phẩm', icon: FolderOpen, path: '/categories' },
  { id: 'products', label: 'Sản phẩm', icon: Package, path: '/products' },
  { id: 'service-orders', label: 'Đơn dịch vụ', icon: FileText, path: '/service-orders' },
  { id: 'notifications', label: 'Thông báo', icon: Bell, path: '/notifications' },
  { id: 'warranties', label: 'Bảo hành', icon: Shield, path: '/warranties' },
  { id: 'offers', label: 'Ưu đãi', icon: Tag, path: '/offers' },
];

// Helper function to get page title from path
const getPageTitle = (path) => {
  const item = menuItems.find(item => item.path === path);
  if (item) return item.label;
  if (path === '/') return 'Khách hàng';
  return 'Quản Trị Hệ Thống';
};

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const pageTitle = useMemo(() => getPageTitle(currentPath), [currentPath]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleClick = useCallback((item) => {
    navigate(item.path);
    setIsMenuOpen(false); // Đóng menu sau khi chọn
  }, [navigate]);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen(prev => !prev);
  }, []);

  // Memoize menu items to prevent recreation on each render
  const memoizedMenuItems = useMemo(() => menuItems, []);

  return (
    <>
      {/* Desktop Sidebar - Vertical */}
      <aside 
        className="hidden lg:flex flex-col w-64 h-screen text-white border-r border-slate-800/50"
        style={{ background: 'var(--gradient-sidebar)' }}
      >
        {/* Header with Title */}
        <div className="flex flex-col p-6 border-b border-slate-800/50 bg-slate-900/30">
          <h2 className="text-xl font-bold mb-1.5 text-white">Quản Trị Hệ Thống</h2>
          <div className="text-sm text-slate-300 font-medium flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
            {pageTitle}
          </div>
        </div>
        
        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {memoizedMenuItems.map((item) => {
            const isActive = currentPath === item.path || (currentPath === '/' && item.id === 'customers');
            return (
              <button
                key={item.id}
                onClick={() => handleClick(item)}
                className={`
                  w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-medium
                  transition-all duration-200 min-h-[48px]
                  ${isActive 
                    ? 'text-white shadow-lg scale-[1.02]' 
                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-white hover:scale-[1.01]'
                  }
                `}
                style={isActive ? { background: 'var(--gradient-primary)' } : {}}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-left flex-1">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Navbar - Horizontal với Dropdown Menu */}
      <nav 
        className="lg:hidden fixed top-0 left-0 right-0 z-50 border-b border-slate-800/50 shadow-lg"
        style={{ background: 'var(--gradient-sidebar)' }}
      >
        {/* Page Title Header với Menu Button */}
        <div className="px-4 py-3.5 border-b border-slate-800/50 bg-slate-900/30">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-white mb-0.5 truncate">{pageTitle}</h1>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0"></div>
                <p className="text-xs text-slate-300 font-medium truncate">Quản Trị Hệ Thống</p>
              </div>
            </div>
            
            {/* Menu Dropdown Button */}
            <button
              onClick={toggleMenu}
              className="flex items-center gap-2 px-3 py-2 text-white hover:bg-slate-800/50 rounded-lg transition-colors flex-shrink-0"
              aria-label="Menu"
            >
              {isMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <>
                  <Menu className="w-5 h-5" />
                  <ChevronDown className={`w-4 h-4 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Dropdown Menu */}
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/50 z-40 top-[73px]"
              onClick={() => setIsMenuOpen(false)}
            />
            
            {/* Menu Dropdown */}
            <div className="absolute top-full left-0 right-0 bg-slate-900 border-b-2 border-slate-800/50 shadow-xl max-h-[calc(100vh-73px)] overflow-y-auto z-50">
              <div className="p-2 space-y-1">
                {memoizedMenuItems.map((item) => {
                  const isActive = currentPath === item.path || (currentPath === '/' && item.id === 'customers');
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleClick(item)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                        transition-all duration-200 min-h-[48px]
                        ${isActive 
                          ? 'text-white shadow-lg' 
                          : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                        }
                      `}
                      style={isActive ? { background: 'var(--gradient-primary)' } : {}}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      <span className="text-left flex-1">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </nav>
    </>
  );
}

export default memo(Sidebar);