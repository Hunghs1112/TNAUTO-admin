// src/components/features/NotificationManagement.jsx
import { useState, useEffect } from 'react';
import GenericTable from '../table/Table';
import { notificationsAPI, pushNotificationsAPI } from '../../services/api';
import { formatDate, truncateText } from '../../utils/format';
import { buttonStyles } from '../../styles/colors';
import { Send, Filter, Bell } from 'lucide-react';
import firebaseNotificationService from '../../services/firebaseNotificationService';
import ImageUploader from '../image/ImageUploader';
import NotificationSendModal from './NotificationSendModal';
import NotificationFilters from './NotificationFilters';

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'message', label: 'Thông báo', render: (val) => truncateText(val, 50) },
  { 
    key: 'recipient_type', 
    label: 'Người nhận',
    render: (val, row) => (
      <span className="text-sm">
        {val === 'customer' ? 'KH' : 'NV'} #{row.recipient_id}
      </span>
    )
  },
  { 
    key: 'is_read', 
    label: 'Trạng thái', 
    render: (val) => (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
        val ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
      }`}>
        {val ? 'Đã đọc' : 'Chưa đọc'}
      </span>
    )
  },
  { key: 'created_at', label: 'Ngày tạo', render: (val) => formatDate(val) },
];

const LIMIT = 10;

/**
 * Notification Management Component
 * Tách từ Notifications.jsx để tái sử dụng
 */
export default function NotificationManagement() {
  const [allData, setAllData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState({
    recipient_type: '',
    is_read: '',
    recipient_id: ''
  });

  // Lists for dropdowns
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    fetchData();
    setupFirebaseNotifications();
    loadCustomersAndEmployees();
  }, []);

  const loadCustomersAndEmployees = async () => {
    try {
      const customersRes = await notificationsAPI.getCustomers();
      setCustomers(customersRes.data.data || customersRes.data || []);

      const employeesRes = await notificationsAPI.getEmployees();
      setEmployees(employeesRes.data.data || employeesRes.data || []);
    } catch (err) {
      console.error('Error loading customers/employees:', err);
    }
  };

  const setupFirebaseNotifications = () => {
    firebaseNotificationService.setupMessageListener((payload) => {
      console.log('📩 New notification received:', payload);
      fetchData();
      showNotificationToast(payload.notification);
    });
  };

  const showNotificationToast = (notification) => {
    if (!notification) return;

    const toast = document.createElement('div');
    toast.className = 'notification-toast';
    toast.innerHTML = `
      <div class="notification-toast-content">
        <div class="notification-toast-icon">🔔</div>
        <div class="notification-toast-text">
          <div class="notification-toast-title">${notification.title}</div>
          <div class="notification-toast-body">${notification.body}</div>
        </div>
        <button class="notification-toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;

    if (!document.getElementById('notification-toast-styles')) {
      const style = document.createElement('style');
      style.id = 'notification-toast-styles';
      style.textContent = `
        .notification-toast {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 9999;
          animation: slideInRight 0.3s ease-out;
        }
        .notification-toast-content {
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          padding: 16px;
          display: flex;
          align-items: start;
          gap: 12px;
          min-width: 320px;
          max-width: 400px;
          border-left: 4px solid #3b82f6;
        }
        .notification-toast-icon {
          font-size: 24px;
          flex-shrink: 0;
        }
        .notification-toast-text {
          flex: 1;
        }
        .notification-toast-title {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 4px;
        }
        .notification-toast-body {
          font-size: 14px;
          color: #6b7280;
        }
        .notification-toast-close {
          background: none;
          border: none;
          font-size: 24px;
          color: #9ca3af;
          cursor: pointer;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .notification-toast-close:hover {
          color: #374151;
        }
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOutRight {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 5000);
  };

  const fetchData = async () => {
    try {
      const params = {};
      if (filters.recipient_type) params.recipient_type = filters.recipient_type;
      if (filters.is_read !== '') params.is_read = filters.is_read;
      if (filters.recipient_id) params.recipient_id = filters.recipient_id;

      const res = await notificationsAPI.getAll(params);
      const data = res.data.data || [];
      data.sort((a, b) => a.is_read - b.is_read);
      setAllData(data);
      setCurrentPage(1);
    } catch (err) {
      console.error('Fetch notifications error:', err);
      setAllData([]);
      setCurrentPage(1);
    }
  };

  const paginatedData = () => {
    const startIndex = (currentPage - 1) * LIMIT;
    return allData.slice(startIndex, startIndex + LIMIT);
  };

  const totalPages = Math.ceil(allData.length / LIMIT);

  const handleMarkRead = async (id) => {
    try {
      await notificationsAPI.markRead(id);
      fetchData();
    } catch (err) {
      console.error('Mark read error:', err);
      alert('Lỗi: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xác nhận xóa thông báo này?')) return;
    
    try {
      await notificationsAPI.delete(id);
      fetchData();
    } catch (err) {
      console.error('Delete error:', err);
      alert('Lỗi: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleMarkAllRead = async () => {
    if (!filters.recipient_id || !filters.recipient_type) {
      alert('Vui lòng chọn User ID và User Type trong bộ lọc để đánh dấu tất cả đã đọc');
      return;
    }

    if (!window.confirm(`Đánh dấu tất cả thông báo của ${filters.recipient_type} #${filters.recipient_id} là đã đọc?`)) return;

    try {
      const res = await notificationsAPI.markAllAsRead({
        user_id: parseInt(filters.recipient_id),
        user_type: filters.recipient_type
      });
      alert(`Đã đánh dấu ${res.data.marked_count || res.data.updated_count || 0} thông báo là đã đọc`);
      fetchData();
    } catch (err) {
      console.error('Mark all read error:', err);
      alert('Lỗi: ' + (err.response?.data?.message || err.message));
    }
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleApplyFilters = () => {
    fetchData();
  };

  const handleClearFilters = () => {
    setFilters({
      recipient_type: '',
      is_read: '',
      recipient_id: ''
    });
    setTimeout(() => {
      fetchData();
    }, 100);
  };

  return (
    <div className="p-4 space-y-4 bg-transparent">
      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setShowSendModal(true)}
          className={buttonStyles.primary}
        >
          <Send size={18} />
          Gửi thông báo
        </button>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={buttonStyles.secondary}
        >
          <Filter size={18} />
          {showFilters ? 'Ẩn bộ lọc' : 'Hiện bộ lọc'}
        </button>
        {filters.recipient_id && filters.recipient_type && (
          <button
            onClick={handleMarkAllRead}
            className={buttonStyles.success}
          >
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <NotificationFilters
          filters={filters}
          onFiltersChange={setFilters}
          onApply={handleApplyFilters}
          onClear={handleClearFilters}
        />
      )}

      {/* Table */}
      <GenericTable
        data={paginatedData()}
        columns={columns}
        onEdit={fetchData}
        onDelete={handleDelete}
        title="Thông báo"
        api={notificationsAPI}
        customActions={(item) => (
          !item.is_read && (
            <button 
              onClick={() => handleMarkRead(item.id)} 
              className="text-green-600 hover:text-green-700 font-medium text-sm hover:underline"
            >
              Đánh dấu đã đọc
            </button>
          )
        )}
        showPagination={true}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={allData.length}
        limit={LIMIT}
        onPageChange={handlePageChange}
      />

      {/* Send Notification Modal */}
      {showSendModal && (
        <NotificationSendModal
          isOpen={showSendModal}
          customers={customers}
          employees={employees}
          onClose={() => setShowSendModal(false)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}

