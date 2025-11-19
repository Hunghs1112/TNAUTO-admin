// src/pages/Notifications.jsx
import { useState, useEffect, memo, useCallback } from 'react';
import NotificationManagement from '../components/features/NotificationManagement';
import { buttonStyles } from '../styles/colors';
import { Bell } from 'lucide-react';
import firebaseNotificationService from '../services/firebaseNotificationService';

/**
 * Notifications Page
 * Sử dụng NotificationManagement component để tránh code trùng lặp
 * Optimized with React.memo to prevent unnecessary rerenders
 */
function Notifications() {
  const [permissionStatus, setPermissionStatus] = useState(
    firebaseNotificationService.getPermissionStatus()
  );

  useEffect(() => {
    // Check permission status periodically
    const interval = setInterval(() => {
      setPermissionStatus(firebaseNotificationService.getPermissionStatus());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleEnableNotifications = useCallback(async () => {
    const token = await firebaseNotificationService.requestPermissionAndGetToken();
    if (token) {
      await firebaseNotificationService.registerTokenWithBackend(token);
      alert('✅ Đã bật thông báo push thành công!');
      setPermissionStatus('granted');
    } else {
      alert('❌ Không thể bật thông báo. Vui lòng kiểm tra quyền trình duyệt.');
    }
  }, []);

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

      {/* Notification Management Component */}
      <NotificationManagement />
    </div>
  );
}

export default memo(Notifications);
