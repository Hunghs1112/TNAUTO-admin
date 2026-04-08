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

const CLOSED_ORDER_STATUSES = new Set(['completed', 'cancelled']);
const ADMIN_ASSIGNABLE_ORDER_STATUSES = new Set(['received', 'in_progress', 'ready_for_pickup']);

export function isOrderWaitingForClaim(order) {
  return Boolean(order && order.status === 'received' && !order.employee_id);
}

export function isServiceOrderClosed(order) {
  return Boolean(order?.status && CLOSED_ORDER_STATUSES.has(order.status));
}

export function canAdminAssignServiceOrder(order) {
  return Boolean(order?.status && ADMIN_ASSIGNABLE_ORDER_STATUSES.has(order.status));
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

export function getServiceOrderAssignmentHint(order) {
  if (!order) {
    return '';
  }

  if (isServiceOrderClosed(order)) {
    return 'Đơn đã kết thúc nên không thể giao hoặc chuyển nhân viên.';
  }

  if (isOrderWaitingForClaim(order)) {
    return 'Admin có thể giao thủ công tại đây. Sau khi giao, đơn sẽ không còn hiện trong danh sách chờ nhận trên app.';
  }

  if (order.employee_id && canAdminAssignServiceOrder(order)) {
    return 'Có thể chuyển đơn sang nhân viên khác khi cần điều phối lại.';
  }

  if (canAdminAssignServiceOrder(order)) {
    return 'Đơn đang mở và có thể giao cho nhân viên phụ trách.';
  }

  return '';
}

export function getServiceOrderAssignSuccessMessage(result, fallbackToReassign = false) {
  const action = result?.action;
  const source = result?.source;
  const message = result?.message;

  if (action === 'already_assigned_to_same_employee') {
    return message || 'Đơn đã ở đúng nhân viên này rồi.';
  }

  if (action === 'reassigned' || source === 'web_reassign' || fallbackToReassign) {
    return message || 'Đã chuyển người xử lý thành công.';
  }

  if (action === 'assigned' || source === 'web_assign') {
    return message || 'Đã giao việc thành công.';
  }

  return message || 'Đã cập nhật nhân viên phụ trách thành công.';
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
