const STATUS_LABELS = {
  pending: 'Chờ xử lý',
  received: 'Đã tiếp nhận',
  in_progress: 'Đang xử lý',
  ready_for_pickup: 'Sẵn sàng bàn giao',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

const ADMIN_STATUS_OPTIONS = [
  { value: 'received', label: 'Đã tiếp nhận' },
  { value: 'in_progress', label: 'Đang xử lý' },
  { value: 'ready_for_pickup', label: 'Sẵn sàng bàn giao' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'cancelled', label: 'Đã hủy' },
];

export function isOrderWaitingForClaim(order) {
  return Boolean(order && order.status === 'received' && !order.employee_id);
}

export function getServiceOrderStatusLabel(order) {
  if (!order?.status) {
    return 'Không xác định';
  }

  if (isOrderWaitingForClaim(order)) {
    return 'Chờ nhận';
  }

  return STATUS_LABELS[order.status] || order.status;
}

export function getServiceOrderAssigneeLabel(order) {
  if (!order) {
    return '-';
  }

  if (order.employee_name) {
    return order.employee_name;
  }

  if (order.employee?.name) {
    return order.employee.name;
  }

  if (order.employee_id) {
    return `Nhân viên #${order.employee_id}`;
  }

  if (isOrderWaitingForClaim(order)) {
    return 'Chờ nhân viên nhận';
  }

  return 'Chưa giao';
}

export function getServiceOrderFlowHint(order) {
  if (!order) {
    return '';
  }

  if (isOrderWaitingForClaim(order)) {
    return 'Đơn này đang mở cho toàn bộ nhân viên trên app tự nhận. Admin vẫn có thể giao thủ công ngay tại đây.';
  }

  if (order.status === 'in_progress' && order.employee_id) {
    return 'Đơn đang có nhân viên phụ trách xử lý.';
  }

  if (order.status === 'ready_for_pickup') {
    return 'Đơn đã xử lý xong và đang chờ bàn giao cho khách.';
  }

  if (order.status === 'completed') {
    return 'Đơn đã hoàn thành toàn bộ quy trình.';
  }

  if (order.status === 'cancelled') {
    return 'Đơn đã bị hủy và không còn nằm trong luồng xử lý.';
  }

  return '';
}

export function getAdminServiceOrderStatusOptions(order) {
  const waitingForClaim = isOrderWaitingForClaim(order);
  const visibleStatuses = waitingForClaim
    ? ['received', 'cancelled']
    : ['received', 'in_progress', 'ready_for_pickup', 'completed', 'cancelled'];

  const allowedStatuses = new Set(visibleStatuses);

  if (order?.status) {
    allowedStatuses.add(order.status);
  }

  return ADMIN_STATUS_OPTIONS.map((option) => {
    if (option.value === 'received' && waitingForClaim) {
      return { ...option, label: 'Chờ nhân viên nhận' };
    }

    return option;
  }).filter((option) => allowedStatuses.has(option.value));
}

