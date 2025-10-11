// src/components/Sidebar.jsx
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Users, Settings, Package, FileText, Bell, Shield, Image, Tag, Menu, X, FolderOpen, Images, Car } from 'lucide-react';

const menuItems = [
  { id: 'customers', label: 'Khách hàng', icon: Users, path: '/customers' },
  { id: 'employees', label: 'Nhân viên', icon: Users, path: '/employees' },
  { id: 'vehicles', label: 'Quản lý xe', icon: Car, path: '/vehicles' },
  { id: 'services', label: 'Dịch vụ', icon: Settings, path: '/services' },
  { id: 'categories', label: 'Danh mục', icon: FolderOpen, path: '/categories' },
  { id: 'products', label: 'Sản phẩm', icon: Package, path: '/products' },
  { id: 'product-images', label: 'Ảnh sản phẩm', icon: Images, path: '/product-images' },
  { id: 'service-orders', label: 'Đơn hàng', icon: FileText, path: '/service-orders' },
  { id: 'notifications', label: 'Thông báo', icon: Bell, path: '/notifications' },
  { id: 'warranties', label: 'Bảo hành', icon: Shield, path: '/warranties' },
  { id: 'offers', label: 'Ưu đãi', icon: Tag, path: '/offers' },
  { id: 'service-order-images', label: 'Ảnh đơn hàng', icon: Image, path: '/service-order-images' },
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
      
      {/* Sidebar */}
      <div className={`fixed z-50 top-0 left-0 h-screen bg-gray-800 text-white transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } w-56 sm:w-64 lg:w-64 xl:w-72 2xl:w-80 overflow-y-auto shadow-lg`}>
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-700">
          <div className="text-lg sm:text-xl font-bold truncate">Quản Trị Hệ Thống</div>
          <button onClick={toggleSidebar} className="lg:hidden p-1 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 p-2 sm:p-4 h-full">
          {menuItems.map((item) => {
            const isActive = currentPath === item.path || (currentPath === '/' && item.id === 'customers');
            return (
              <div
                key={item.id}
                onClick={() => handleClick(item)}
                className={`flex items-center p-3 mb-2 rounded cursor-pointer hover:bg-gray-700 ${isActive ? 'bg-gray-700' : ''}`}
              >
                <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="text-sm truncate">{item.label}</span>
              </div>
            );
          })}
        </nav>
      </div>
      
      {/* Mobile menu button */}
      {!isOpen && (
        <button 
          className="fixed top-4 left-4 z-50 p-2 bg-gray-800 text-white rounded-lg lg:hidden shadow-lg" 
          onClick={toggleSidebar}
        >
          <Menu className="w-6 h-6" />
        </button>
      )}
    </>
  );
}