// src/pages/Notifications.jsx
import { memo } from 'react';
import NotificationManagement from '../components/features/NotificationManagement';

/**
 * Notifications Page
 * Sử dụng NotificationManagement component để tránh code trùng lặp
 * Optimized with React.memo to prevent unnecessary rerenders
 */
function Notifications() {

  return (
    <div className="p-4 space-y-4 bg-transparent">
      <NotificationManagement />
    </div>
  );
}

export default memo(Notifications);
