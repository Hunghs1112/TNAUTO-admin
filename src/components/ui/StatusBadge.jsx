const ORDER_STATUS_CONFIG = {
  pending: {
    color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300',
    label: 'Chờ xử lý',
  },
  received: {
    color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300',
    label: 'Đã tiếp nhận',
  },
  in_progress: {
    color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
    label: 'Đang xử lý',
  },
  ready_for_pickup: {
    color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300',
    label: 'Sẵn sàng bàn giao',
  },
  completed: {
    color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
    label: 'Hoàn thành',
  },
  cancelled: {
    color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
    label: 'Đã hủy',
  },
};

const STATUS_CONFIGS = {
  order: ORDER_STATUS_CONFIG,
  notification: {
    read: {
      color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
      label: 'Đã đọc',
    },
    unread: {
      color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
      label: 'Chưa đọc',
    },
  },
  user: {
    customer: {
      color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
      label: 'Khách hàng',
    },
    employee: {
      color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
      label: 'Nhân viên',
    },
  },
  image_status: {
    received: ORDER_STATUS_CONFIG.received,
    in_progress: ORDER_STATUS_CONFIG.in_progress,
    ready_for_pickup: ORDER_STATUS_CONFIG.ready_for_pickup,
    completed: ORDER_STATUS_CONFIG.completed,
  },
  vehicle_document: {
    valid: {
      color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
      label: 'Hợp lệ',
    },
    expiring: {
      color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300',
      label: 'Sắp hết hạn',
    },
    expired: {
      color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
      label: 'Hết hạn',
    },
    null: {
      color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
      label: 'Chưa cập nhật',
    },
    '': {
      color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
      label: 'Chưa cập nhật',
    },
  },
};

export default function StatusBadge({ status, type = 'default', labelOverride = null }) {
  const configMap =
    STATUS_CONFIGS[type] || {
      [status]: {
        color: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300',
        label: status,
      },
    };

  const config = configMap[status] || {
    color: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300',
    label: status || 'Không xác định',
  };

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${config.color}`}>
      {labelOverride || config.label}
    </span>
  );
}
