// src/components/features/NotificationDetailModal.jsx
import React from 'react';
import { X } from 'lucide-react';
import { formatDate } from '../../utils/format';

// Mapping cho loại thông báo
const notificationTypeMap = {
  'warranty_reminder': 'Nhắc nhở bảo hành',
  'service_reminder': 'Nhắc nhở dịch vụ',
  'transaction': 'Giao dịch',
  'care_content': 'Nội dung chăm sóc',
  'winback': 'Winback',
  'system': 'Hệ thống',
};

// Mapping cho trạng thái
const notificationStatusMap = {
  'sent': 'Đã gửi',
  'failed': 'Thất bại',
  'scheduled': 'Đã lên lịch',
  'sending': 'Đang gửi',
  'canceled': 'Đã hủy',
};

/**
 * Notification Detail Modal Component
 * Hiển thị chi tiết thông báo (read-only)
 */
export default function NotificationDetailModal({
  isOpen,
  notification,
  recipientNameByKey = {},
  onClose
}) {
  if (!isOpen || !notification) return null;

  // Lấy tên người nhận từ recipientNameByKey
  const recipientKey = notification.recipient_type && notification.recipient_id 
    ? `${notification.recipient_type}:${notification.recipient_id}` 
    : null;
  const recipientName = recipientKey ? recipientNameByKey[recipientKey] : null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto border-2 border-gray-300 dark:border-slate-700">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b-2 border-gray-300 dark:border-slate-700 p-6 flex items-center justify-between z-10">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Chi tiết thông báo
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Đóng"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              ID
            </label>
            <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-slate-800 px-3 py-2 rounded-lg">
              {notification.id}
            </div>
          </div>

          {/* Tiêu đề */}
          {notification.title && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tiêu đề
              </label>
              <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-slate-800 px-3 py-2 rounded-lg">
                {notification.title}
              </div>
            </div>
          )}

          {/* Nội dung */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nội dung
            </label>
            <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-slate-800 px-3 py-2 rounded-lg whitespace-pre-wrap">
              {notification.body || notification.message || '—'}
            </div>
          </div>

          {/* Người nhận */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Người nhận
            </label>
            <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-slate-800 px-3 py-2 rounded-lg">
              {notification.recipient_type === 'customer' ? 'Khách hàng' : 'Nhân viên'} #{notification.recipient_id}
              {recipientName && recipientName !== '...' && (
                <span className="ml-2 text-gray-600 dark:text-gray-400">
                  - {recipientName}
                </span>
              )}
            </div>
          </div>

          {/* Loại thông báo */}
          {notification.type && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Loại thông báo
              </label>
              <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-slate-800 px-3 py-2 rounded-lg">
                {notificationTypeMap[notification.type] || notification.type}
              </div>
            </div>
          )}

          {/* Trạng thái */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Trạng thái
            </label>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                notification.is_read 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                  : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
              }`}>
                {notification.is_read ? 'Đã đọc' : 'Chưa đọc'}
              </span>
              {notification.status && (
                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  {notificationStatusMap[notification.status] || notification.status}
                </span>
              )}
            </div>
          </div>

          {/* Ảnh */}
          {notification.image_url && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Hình ảnh
              </label>
              <div className="bg-gray-50 dark:bg-slate-800 px-3 py-2 rounded-lg">
                <img 
                  src={notification.image_url} 
                  alt="Notification" 
                  className="max-w-full h-auto rounded-lg"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            </div>
          )}

          {/* Tham chiếu */}
          {(notification.ref_type || notification.ref_id) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tham chiếu
              </label>
              <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-slate-800 px-3 py-2 rounded-lg">
                {notification.ref_type && notification.ref_id 
                  ? `${notification.ref_type}: ${notification.ref_id}`
                  : notification.ref_type || notification.ref_id || '—'}
              </div>
            </div>
          )}

          {/* Thời gian */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notification.created_at && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ngày tạo
                </label>
                <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-slate-800 px-3 py-2 rounded-lg">
                  {formatDate(notification.created_at)}
                </div>
              </div>
            )}
            {notification.sent_at && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ngày gửi
                </label>
                <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-slate-800 px-3 py-2 rounded-lg">
                  {formatDate(notification.sent_at)}
                </div>
              </div>
            )}
            {notification.scheduled_at && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Lên lịch gửi
                </label>
                <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-slate-800 px-3 py-2 rounded-lg">
                  {formatDate(notification.scheduled_at)}
                </div>
              </div>
            )}
          </div>

          {/* Metadata */}
          {notification.metadata && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Metadata
              </label>
              <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-slate-800 px-3 py-2 rounded-lg">
                <pre className="whitespace-pre-wrap text-xs">
                  {typeof notification.metadata === 'string' 
                    ? notification.metadata 
                    : JSON.stringify(notification.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t-2 border-gray-300 dark:border-slate-700 p-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors font-medium"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}


