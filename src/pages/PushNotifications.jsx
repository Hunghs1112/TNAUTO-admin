// src/pages/PushNotifications.jsx
import { useState, useEffect } from 'react';
import { pushNotificationsAPI, notificationsAPI } from '../services/api';
import { buttonStyles } from '../styles/colors';
import { Send, Users, Radio, Target } from 'lucide-react';
import ImageUploader from '../components/image/ImageUploader';

export default function PushNotifications() {
  const [pushModal, setPushModal] = useState({
    type: 'user', // user, broadcast, topic
    user_id: '',
    user_type: 'customer',
    broadcast_user_type: 'customer',
    topic: 'customers',
    title: '',
    body: '',
    imageUrl: '',
    data: {}
  });

  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
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

  const handleSendPush = async () => {
    if (pushModal.type === 'user' && (!pushModal.user_id || !pushModal.user_type)) {
      alert('Vui lòng nhập User ID và chọn User Type');
      return;
    }

    if (!pushModal.title || !pushModal.body) {
      alert('Vui lòng nhập Title và Body');
      return;
    }

    try {
      let res;

      // Parse and stringify data values for FCM (FCM requires all string values)
      let data = {};
      if (pushModal.data) {
        const parsedData = typeof pushModal.data === 'string' ? JSON.parse(pushModal.data) : pushModal.data;
        // Convert all values to strings
        data = Object.keys(parsedData).reduce((acc, key) => {
          acc[key] = String(parsedData[key]);
          return acc;
        }, {});
      }

      if (pushModal.type === 'user') {
        res = await pushNotificationsAPI.sendToUser({
          user_id: parseInt(pushModal.user_id),
          user_type: pushModal.user_type,
          title: pushModal.title,
          body: pushModal.body,
          ...(pushModal.imageUrl && { image_url: pushModal.imageUrl }),
          data
        });
      } else if (pushModal.type === 'broadcast') {
        res = await pushNotificationsAPI.sendToAll({
          user_type: pushModal.broadcast_user_type,
          title: pushModal.title,
          body: pushModal.body,
          ...(pushModal.imageUrl && { image_url: pushModal.imageUrl }),
          data
        });
      } else if (pushModal.type === 'topic') {
        res = await pushNotificationsAPI.sendToTopic({
          topic: pushModal.topic,
          title: pushModal.title,
          body: pushModal.body,
          ...(pushModal.imageUrl && { image_url: pushModal.imageUrl }),
          data
        });
      }

      const results = res.data.results;
      alert(`Push notification đã gửi!\nThành công: ${results?.successCount || 0}\nThất bại: ${results?.failureCount || 0}`);
      
      // Reset form
      setPushModal({
        type: 'user',
        user_id: '',
        user_type: 'customer',
        broadcast_user_type: 'customer',
        topic: 'customers',
        title: '',
        body: '',
        imageUrl: '',
        data: {}
      });
    } catch (err) {
      console.error('Send push error:', err);
      alert('Lỗi khi gửi push: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-6">
          <Radio size={24} className="text-blue-600" />
          <h2 className="text-2xl font-bold">Push Notification (Realtime)</h2>
        </div>

        {/* Push type selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Loại Push</label>
          <div className="flex gap-3">
            <button
              onClick={() => setPushModal({ ...pushModal, type: 'user' })}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                pushModal.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Users size={18} className="inline mr-2" />
              Gửi cho 1 user
            </button>
            <button
              onClick={() => setPushModal({ ...pushModal, type: 'broadcast' })}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                pushModal.type === 'broadcast'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Radio size={18} className="inline mr-2" />
              Broadcast (Tất cả)
            </button>
            <button
              onClick={() => setPushModal({ ...pushModal, type: 'topic' })}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                pushModal.type === 'topic'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Target size={18} className="inline mr-2" />
              Gửi theo Topic
            </button>
          </div>
        </div>

        <div className="space-y-4 max-w-2xl">
          {/* User-specific fields */}
          {pushModal.type === 'user' && (
            <div className="p-4 bg-blue-50 rounded-lg space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={pushModal.user_type}
                  onChange={(e) => setPushModal({ ...pushModal, user_type: e.target.value, user_id: '' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="customer">Khách hàng</option>
                  <option value="employee">Nhân viên</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chọn người nhận <span className="text-red-500">*</span>
                </label>
                <select
                  value={pushModal.user_id}
                  onChange={(e) => setPushModal({ ...pushModal, user_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- Chọn {pushModal.user_type === 'customer' ? 'khách hàng' : 'nhân viên'} --</option>
                  {pushModal.user_type === 'customer' 
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
            </div>
          )}

          {/* Broadcast user type field */}
          {pushModal.type === 'broadcast' && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gửi cho <span className="text-red-500">*</span>
              </label>
              <select
                value={pushModal.broadcast_user_type}
                onChange={(e) => setPushModal({ ...pushModal, broadcast_user_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="customer">Tất cả Khách hàng</option>
                <option value="employee">Tất cả Nhân viên</option>
              </select>
            </div>
          )}

          {/* Topic field */}
          {pushModal.type === 'topic' && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Topic <span className="text-red-500">*</span>
              </label>
              <select
                value={pushModal.topic}
                onChange={(e) => setPushModal({ ...pushModal, topic: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="customers">customers - Tất cả khách hàng</option>
                <option value="employees">employees - Tất cả nhân viên</option>
                <option value="vip_customers">vip_customers - Khách hàng VIP</option>
                <option value="new_customers">new_customers - Khách hàng mới</option>
              </select>
            </div>
          )}

          {/* Notification content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={pushModal.title}
              onChange={(e) => setPushModal({ ...pushModal, title: e.target.value })}
              placeholder="🎉 Khuyến mãi đặc biệt"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Body <span className="text-red-500">*</span>
            </label>
            <textarea
              value={pushModal.body}
              onChange={(e) => setPushModal({ ...pushModal, body: e.target.value })}
              placeholder="Giảm giá 50% cho tất cả dịch vụ hôm nay!"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hình ảnh (Optional)</label>
            <ImageUploader
              onUploadSuccess={(url) => setPushModal({ ...pushModal, imageUrl: url })}
              multiple={false}
              maxFiles={1}
              uploadMode="both"
              allowFileUpload={true}
              allowLinkUpload={true}
            />
            {pushModal.imageUrl && (
              <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Current image URL:</p>
                <p className="text-sm text-blue-600 break-all">{pushModal.imageUrl}</p>
                <button
                  onClick={() => setPushModal({ ...pushModal, imageUrl: '' })}
                  className="mt-1 text-xs text-red-500 hover:text-red-700"
                >
                  Clear image
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Custom Data (JSON - Optional)
            </label>
            <textarea
              value={typeof pushModal.data === 'string' ? pushModal.data : JSON.stringify(pushModal.data, null, 2)}
              onChange={(e) => setPushModal({ ...pushModal, data: e.target.value })}
              placeholder='{"type": "promotion", "promo_id": "SUMMER2025"}'
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSendPush}
              className={`${buttonStyles.primary} flex items-center gap-2`}
            >
              <Send size={18} />
              Gửi Push Notification
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

