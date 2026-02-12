// src/components/features/NotificationSendModal.jsx
import { useState } from 'react';
import { Send, X } from 'lucide-react';
import { notificationsAPI } from '../../services/api';
import { buttonStyles } from '../../styles/colors';
import ImageUploader from '../image/ImageUploader';

/**
 * Notification Send Modal Component
 * Tách từ Notifications.jsx để tái sử dụng
 */
export default function NotificationSendModal({ 
  isOpen, 
  customers = [], 
  employees = [], 
  onClose, 
  onSuccess 
}) {
  const [sendForm, setSendForm] = useState({
    recipient_id: '',
    recipient_type: 'customer',
    message: '',
    image_url: '',
    send_push: false
  });

  const handleSendNotification = async () => {
    if (!sendForm.recipient_id || !sendForm.message) {
      alert('Vui lòng chọn người nhận và nhập nội dung thông báo');
      return;
    }

    try {
      // Backend handles both DB and Push in a single call now.
      // recipient_type and recipient_id are required.
      const res = await notificationsAPI.send({
        recipient_id: parseInt(sendForm.recipient_id),
        recipient_type: sendForm.recipient_type,
        title: 'Thông báo mới',
        message: sendForm.message,
        data: { 
          type: 'custom_notification',
          image_url: sendForm.image_url || undefined
        }
      });

      const notificationId = res.data?.notification_id || res.data?.id;
      alert(`✅ Đã gửi thông báo thành công!${notificationId ? ` ID: ${notificationId}` : ''}`);

      onClose();
      setSendForm({
        recipient_id: '',
        recipient_type: 'customer',
        message: '',
        image_url: '',
        send_push: false
      });
      onSuccess && onSuccess();
    } catch (err) {
      console.error('Send notification error:', err);
      alert('❌ Lỗi khi gửi: ' + (err.response?.data?.message || err.message));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center z-50 p-4 transition-colors duration-300">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-slate-700 transition-colors duration-300">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <Send size={24} className="text-blue-600 dark:text-blue-400" />
              Gửi thông báo tùy chỉnh
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
            >
              <X size={24} />
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
                onClick={onClose}
                className={buttonStyles.secondary}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

