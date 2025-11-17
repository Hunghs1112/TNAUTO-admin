// src/pages/Notifications.jsx
import { useState, useEffect } from 'react';
import GenericTable from '../components/table/Table';
import { notificationsAPI, pushNotificationsAPI } from '../services/api';
import { formatDate, truncateText } from '../utils/format';
import { buttonStyles } from '../styles/colors';
import { Send, Filter, Bell } from 'lucide-react';
import firebaseNotificationService from '../services/firebaseNotificationService';
import ImageUploader from '../components/image/ImageUploader';

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

export default function Notifications() {
  const [allData, setAllData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Send modal state
  const [sendForm, setSendForm] = useState({
    recipient_id: '',
    recipient_type: 'customer',
    message: '',
    image_url: '',
    send_push: false
  });

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
      // Load customers
      const customersRes = await notificationsAPI.getCustomers();
      setCustomers(customersRes.data.data || customersRes.data || []);

      // Load employees
      const employeesRes = await notificationsAPI.getEmployees();
      setEmployees(employeesRes.data.data || employeesRes.data || []);
    } catch (err) {
      console.error('Error loading customers/employees:', err);
    }
  };

  const setupFirebaseNotifications = () => {
    // Setup Firebase listener for realtime notifications
    firebaseNotificationService.setupMessageListener((payload) => {
      console.log('📩 New notification received:', payload);
      
      // Refresh notification list when new notification arrives
      fetchData();
      
      // Show in-page notification toast
      showNotificationToast(payload.notification);
    });
  };

  const showNotificationToast = (notification) => {
    if (!notification) return;

    // Create toast element
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

    // Add styles if not exists
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

    // Add to page
    document.body.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
      toast.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 5000);
  };

  const fetchData = async () => {
    try {
      // Build query params based on filters
      const params = {};
      if (filters.recipient_type) params.recipient_type = filters.recipient_type;
      if (filters.is_read !== '') params.is_read = filters.is_read;
      if (filters.recipient_id) params.recipient_id = filters.recipient_id;

      const res = await notificationsAPI.getAll(params);
      console.log('Fetched notifications response:', res.data);
      const data = res.data.data || [];
      // Sort: unread first (is_read = false), then read at the end
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
      console.log('Marked read for notification', id);
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
      console.log('Deleted notification', id);
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
      // Spec returns { marked_count }
      alert(`Đã đánh dấu ${res.data.marked_count || res.data.updated_count || 0} thông báo là đã đọc`);
      fetchData();
    } catch (err) {
      console.error('Mark all read error:', err);
      alert('Lỗi: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleSendNotification = async () => {
    if (!sendForm.recipient_id || !sendForm.message) {
      alert('Vui lòng chọn người nhận và nhập nội dung thông báo');
      return;
    }

    try {
      // Gửi notification vào database
      const res = await notificationsAPI.send({
        recipient_id: parseInt(sendForm.recipient_id),
        recipient_type: sendForm.recipient_type,
        message: sendForm.message,
        image_url: sendForm.image_url || undefined,
        title: 'Thông báo mới'
      });

      const notificationId = res.data.notification_id;

      // Nếu chọn gửi push notification realtime
      if (sendForm.send_push) {
        try {
          const pushRes = await pushNotificationsAPI.sendToUser({
            user_id: parseInt(sendForm.recipient_id),
            user_type: sendForm.recipient_type,
            title: 'Thông báo mới',
            body: sendForm.message,
            ...(sendForm.image_url && { image_url: sendForm.image_url }),
            data: {
              type: 'custom_notification',
              notification_id: String(notificationId)
            }
          });

          const results = pushRes.data.results;
          alert(
            `✅ Đã gửi thông báo thành công!\n` +
            `📝 Notification ID: ${notificationId}\n` +
            `📱 Push notification: Thành công ${results?.successCount || 0}, Thất bại ${results?.failureCount || 0}`
          );
        } catch (pushErr) {
          console.error('Push notification error:', pushErr);
          alert(
            `✅ Đã lưu thông báo vào database (ID: ${notificationId})\n` +
            `⚠️ Nhưng gửi push notification thất bại: ${pushErr.response?.data?.message || pushErr.message}`
          );
        }
      } else {
        alert(`✅ Đã gửi thông báo thành công! ID: ${notificationId}`);
      }

      setShowSendModal(false);
      setSendForm({
        recipient_id: '',
        recipient_type: 'customer',
        message: '',
        image_url: '',
        send_push: false
      });
      fetchData();
    } catch (err) {
      console.error('Send notification error:', err);
      alert('❌ Lỗi khi gửi: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleRefresh = () => fetchData();

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

  const handleEnableNotifications = async () => {
    const token = await firebaseNotificationService.requestPermissionAndGetToken();
    if (token) {
      await firebaseNotificationService.registerTokenWithBackend(token);
      alert('✅ Đã bật thông báo push thành công!');
    } else {
      alert('❌ Không thể bật thông báo. Vui lòng kiểm tra quyền trình duyệt.');
    }
  };

  const permissionStatus = firebaseNotificationService.getPermissionStatus();

  return (
    <div className="p-4 space-y-4 bg-transparent">
      {/* Firebase notification alert */}
      {permissionStatus !== 'granted' && permissionStatus !== 'not-supported' && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3 transition-colors duration-300">
          <Bell className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" size={20} />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Bật thông báo push realtime</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
              Cho phép nhận thông báo push để cập nhật realtime ngay cả khi đóng trình duyệt
            </p>
            <button
              onClick={handleEnableNotifications}
              className={buttonStyles.primary}
            >
              Bật thông báo
            </button>
          </div>
        </div>
      )}

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
        <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4 space-y-3 border border-gray-200 dark:border-slate-700 transition-colors duration-300">
          <h3 className="font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
            <Filter size={18} />
            Bộ lọc
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">User Type</label>
              <select
                value={filters.recipient_type}
                onChange={(e) => setFilters({ ...filters, recipient_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 transition-colors duration-300"
              >
                <option value="">Tất cả</option>
                <option value="customer">Khách hàng</option>
                <option value="employee">Nhân viên</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái</label>
              <select
                value={filters.is_read}
                onChange={(e) => setFilters({ ...filters, is_read: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 transition-colors duration-300"
              >
                <option value="">Tất cả</option>
                <option value="0">Chưa đọc</option>
                <option value="1">Đã đọc</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">User ID</label>
              <input
                type="number"
                value={filters.recipient_id}
                onChange={(e) => setFilters({ ...filters, recipient_id: e.target.value })}
                placeholder="Nhập User ID"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-300"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleApplyFilters} className={buttonStyles.primary}>
              Áp dụng
            </button>
            <button onClick={handleClearFilters} className={buttonStyles.secondary}>
              Xóa bộ lọc
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <GenericTable
        data={paginatedData()}
        columns={columns}
        onEdit={handleRefresh}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center z-50 p-4 transition-colors duration-300">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-slate-700 transition-colors duration-300">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                  <Send size={24} className="text-blue-600 dark:text-blue-400" />
                  Gửi thông báo tùy chỉnh
                </h2>
                <button
                  onClick={() => setShowSendModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Recipient Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={sendForm.recipient_type}
                    onChange={(e) => setSendForm({ ...sendForm, recipient_type: e.target.value, recipient_id: '' })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 transition-colors duration-300"
                  >
                    <option value="customer">Khách hàng</option>
                    <option value="employee">Nhân viên</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Chọn người nhận <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={sendForm.recipient_id}
                    onChange={(e) => setSendForm({ ...sendForm, recipient_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 transition-colors duration-300"
                  >
                    <option value="">-- Chọn {sendForm.recipient_type === 'customer' ? 'khách hàng' : 'nhân viên'} --</option>
                    {sendForm.recipient_type === 'customer' 
                      ? customers.map(customer => (
                          <option key={customer.id} value={customer.id}>
                            #{customer.id} - {customer.name} - {customer.phone}
                          </option>
                        ))
                      : employees.map(employee => (
                          <option key={employee.id} value={employee.id}>
                            #{employee.id} - {employee.name} - {employee.phone}
                          </option>
                        ))
                    }
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={sendForm.message}
                    onChange={(e) => setSendForm({ ...sendForm, message: e.target.value })}
                    placeholder="Nhập nội dung thông báo..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Hình ảnh (Optional)
                  </label>
                  <ImageUploader
                    onUploadSuccess={(url) => setSendForm({ ...sendForm, image_url: url })}
                    multiple={false}
                    maxFiles={1}
                    uploadMode="both"
                    allowFileUpload={true}
                    allowLinkUpload={true}
                  />
                  {sendForm.image_url && (
                    <div className="mt-2 p-2 bg-gray-50 dark:bg-slate-700 rounded-lg transition-colors duration-300">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Current image URL:</p>
                      <p className="text-sm text-blue-600 dark:text-blue-400 break-all">{sendForm.image_url}</p>
                      <button
                        onClick={() => setSendForm({ ...sendForm, image_url: '' })}
                        className="mt-1 text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors duration-200"
                      >
                        Clear image
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="send-push-checkbox"
                    checked={sendForm.send_push}
                    onChange={(e) => setSendForm({ ...sendForm, send_push: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 dark:border-slate-600 rounded focus:ring-blue-500 bg-white dark:bg-slate-700 transition-colors duration-300"
                  />
                  <label htmlFor="send-push-checkbox" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Gửi cả Push Notification (realtime)
                  </label>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
                  <button
                    onClick={handleSendNotification}
                    className={buttonStyles.primary}
                  >
                    <Send size={18} />
                    Gửi thông báo
                  </button>
                  <button
                    onClick={() => setShowSendModal(false)}
                    className={buttonStyles.secondary}
                  >
                    Hủy
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
