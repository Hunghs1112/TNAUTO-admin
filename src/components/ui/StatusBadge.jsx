// src/components/ui/StatusBadge.jsx
import React from 'react';

export default function StatusBadge({ status, type = 'default' }) {
  const getStatusConfig = () => {
    switch (type) {
      case 'order':
        return {
          'pending': { color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300', label: 'Chờ xử lý' },
          'in_progress': { color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300', label: 'Đang xử lý' },
          'completed': { color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300', label: 'Hoàn thành' },
          'cancelled': { color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300', label: 'Đã hủy' }
        };
      case 'notification':
        return {
          'read': { color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300', label: 'Đã đọc' },
          'unread': { color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300', label: 'Chưa đọc' }
        };
      case 'user':
        return {
          'customer': { color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300', label: 'Khách hàng' },
          'employee': { color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300', label: 'Nhân viên' }
        };
      case 'image_status':
        return {
          'received': { color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300', label: 'Đã nhận' },
          'in_progress': { color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300', label: 'Đang xử lý' },
          'completed': { color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300', label: 'Hoàn thành' }
        };
      default:
        return {
          [status]: { color: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300', label: status }
        };
    }
  };

  const config = getStatusConfig()[status] || { color: 'bg-gray-100 text-gray-800', label: status };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}
