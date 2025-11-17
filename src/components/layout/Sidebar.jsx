// src/components/layout/Sidebar.jsx
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Users, Settings, Package, FileText, Bell, Shield, Tag, Menu, X, FolderOpen, Car } from 'lucide-react';

const menuItems = [
  { id: 'customers', label: 'Khách hàng', icon: Users, path: '/customers' },
  { id: 'employees', label: 'Nhân viên', icon: Users, path: '/employees' },
  { id: 'vehicles', label: 'Quản lý xe', icon: Car, path: '/vehicles' },
  { id: 'services', label: 'Dịch vụ', icon: Settings, path: '/services' },
  { id: 'categories', label: 'Danh mục', icon: FolderOpen, path: '/categories' },
  { id: 'products', label: 'Sản phẩm', icon: Package, path: '/products' },
  { id: 'service-orders', label: 'Đơn dịch vụ', icon: FileText, path: '/service-orders' },
  { id: 'notifications', label: 'Thông báo', icon: Bell, path: '/notifications' },
  { id: 'warranties', label: 'Bảo hành', icon: Shield, path: '/warranties' },
  { id: 'offers', label: 'Ưu đãi', icon: Tag, path: '/offers' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeItem, setActiveItem] = useState('customers');
  const [isOpen, setIsOpen] = useState(false);
  const currentPath = location.pathname;

  const handleClick = (item) => {
    setActiveItem(item.id);
    navigate(item.path);
    if (window.innerWidth < 1024) setIsOpen(false);
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const closeSidebar = () => {
    if (window.innerWidth < 1024) setIsOpen(false);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={closeSidebar} />}
      
      {/* Sidebar - Professional Design with Gradient - Dark Mode Support */}
      <div className={`fixed z-50 top-0 left-0 h-screen gradient-sidebar text-white transform transition-all duration-300 ease-in-out lg:static lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } w-56 lg:w-56 overflow-y-auto shadow-xl border-r border-gray-800/50 dark:border-slate-700/50 dark-scrollbar`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800/50 dark:border-slate-700/50 flex-shrink-0 transition-colors duration-300">
          <div className="text-base font-semibold truncate text-white">
            Quản Trị Hệ Thống
          </div>
          <button 
            onClick={toggleSidebar} 
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-800/50 dark:hover:bg-slate-700/50 transition-colors duration-200"
            aria-label="Đóng menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-2 h-full flex flex-col">
          {menuItems.map((item) => {
            const isActive = currentPath === item.path || (currentPath === '/' && item.id === 'customers');
            return (
              <button
                key={item.id}
                onClick={() => handleClick(item)}
                className={`
                  group flex items-center justify-start p-3 rounded-xl cursor-pointer 
                  transition-all duration-200
                  ${isActive 
                    ? 'tab-active text-white shadow-lg transform translate-x-1' 
                    : 'text-gray-300 dark:text-gray-400 hover:bg-gray-800/50 dark:hover:bg-slate-700/50 hover:text-white hover:shadow-md hover:translate-x-1'
                  }
                `}
              >
                <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="text-sm font-medium truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
      
      {/* Mobile menu button */}
      {!isOpen && (
        <button 
          className="fixed top-4 left-4 z-50 p-2 bg-gray-800 dark:bg-slate-800 text-white rounded-lg lg:hidden shadow-lg hover:bg-gray-700 dark:hover:bg-slate-700 transition-colors duration-200" 
          onClick={toggleSidebar}
        >
          <Menu className="w-6 h-6" />
        </button>
      )}
    </>
  );
}