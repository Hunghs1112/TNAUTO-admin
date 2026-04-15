const ORDER_STATUS_CONFIG = {
  pending: {
    color: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/35',
    label: 'Chờ duyệt',
  },
  received: {
    color: 'bg-sky-500/15 text-sky-300 ring-1 ring-sky-400/35',
    label: 'Đã tiếp nhận',
  },
  in_progress: {
    color: 'bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-400/35',
    label: 'Đang xử lý',
  },
  ready_for_pickup: {
    color: 'bg-violet-500/15 text-violet-300 ring-1 ring-violet-400/35',
    label: 'Sẵn sàng bàn giao',
  },
  completed: {
    color: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/35',
    label: 'Hoàn thành',
  },
  cancelled: {
    color: 'bg-slate-500/15 text-slate-300 ring-1 ring-slate-400/35',
    label: 'Đã hủy',
  },
};

const STATUS_CONFIGS = {
  order: ORDER_STATUS_CONFIG,
  notification: {
    read: {
      color: 'bg-[#8f5f23]/15 text-[#eecd7e] ring-1 ring-[#8f5f23]/30',
      label: 'Đã đọc',
    },
    unread: {
      color: 'bg-[#b48242]/15 text-[#e0a02e] ring-1 ring-[#b48242]/30',
      label: 'Chưa đọc',
    },
  },
  user: {
    customer: {
      color: 'bg-[#1e406b]/15 text-[#dfe1e3] ring-1 ring-[#1e406b]/30',
      label: 'Khách hàng',
    },
    employee: {
      color: 'bg-[#8f5f23]/15 text-[#eecd7e] ring-1 ring-[#8f5f23]/30',
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
      color: 'bg-[#8f5f23]/15 text-[#eecd7e] ring-1 ring-[#8f5f23]/30',
      label: 'Hợp lệ',
    },
    expiring: {
      color: 'bg-[#c37b1e]/15 text-[#eecd7e] ring-1 ring-[#e0a02e]/30',
      label: 'Sắp hết hạn',
    },
    expired: {
      color: 'bg-[#b48242]/15 text-[#e0a02e] ring-1 ring-[#b48242]/30',
      label: 'Hết hạn',
    },
    null: {
      color: 'bg-[#7a797c]/15 text-[#dfe1e3] ring-1 ring-[#7a797c]/30',
      label: 'Chưa cập nhật',
    },
    '': {
      color: 'bg-[#7a797c]/15 text-[#dfe1e3] ring-1 ring-[#7a797c]/30',
      label: 'Chưa cập nhật',
    },
  },
};

export default function StatusBadge({ status, type = 'default', labelOverride = null }) {
  const configMap =
    STATUS_CONFIGS[type] || {
      [status]: {
        color: 'bg-[#7a797c]/15 text-[#dfe1e3] ring-1 ring-[#7a797c]/30',
        label: status,
      },
    };

  const config = configMap[status] || {
    color: 'bg-[#7a797c]/15 text-[#dfe1e3] ring-1 ring-[#7a797c]/30',
    label: status || 'Không xác định',
  };

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${config.color}`}>
      {labelOverride || config.label}
    </span>
  );
}
