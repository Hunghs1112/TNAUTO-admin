const STATUS_LABELS = {
  pending: 'Cho xu ly',
  received: 'Da tiep nhan',
  in_progress: 'Dang xu ly',
  ready_for_pickup: 'San sang ban giao',
  completed: 'Hoan thanh',
  cancelled: 'Da huy',
};

const ADMIN_STATUS_OPTIONS = [
  { value: 'received', label: 'Da tiep nhan' },
  { value: 'in_progress', label: 'Dang xu ly' },
  { value: 'ready_for_pickup', label: 'San sang ban giao' },
  { value: 'completed', label: 'Hoan thanh' },
  { value: 'cancelled', label: 'Da huy' },
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
    return 'Khong xac dinh';
  }

  if (isOrderWaitingForClaim(order)) {
    return 'Cho nhan';
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
    return `Nhan vien #${order.employee_id}`;
  }

  if (isOrderWaitingForClaim(order)) {
    return 'Cho nhan vien nhan';
  }

  return 'Chua giao';
}

export function getServiceOrderFlowHint(order) {
  if (!order) {
    return '';
  }

  if (isOrderWaitingForClaim(order)) {
    return 'Don nay dang mo cho toan bo nhan vien tren app tu nhan. Admin van co the giao thu cong ngay tai day.';
  }

  if (order.status === 'in_progress' && order.employee_id) {
    return 'Don dang co nhan vien phu trach xu ly.';
  }

  if (order.status === 'ready_for_pickup') {
    return 'Don da xu ly xong va dang cho ban giao cho khach.';
  }

  if (order.status === 'completed') {
    return 'Don da hoan thanh toan bo quy trinh.';
  }

  if (order.status === 'cancelled') {
    return 'Don da bi huy va khong con nam trong luong xu ly.';
  }

  return '';
}

export function getServiceOrderAssignmentHint(order) {
  if (!order) {
    return '';
  }

  if (isServiceOrderClosed(order)) {
    return 'Don da ket thuc nen khong the giao hoac chuyen nhan vien.';
  }

  if (isOrderWaitingForClaim(order)) {
    return 'Admin co the giao thu cong tai day. Sau khi giao, don se khong con hien trong danh sach cho nhan tren app.';
  }

  if (order.employee_id && canAdminAssignServiceOrder(order)) {
    return 'Co the chuyen don sang nhan vien khac khi can dieu phoi lai.';
  }

  if (canAdminAssignServiceOrder(order)) {
    return 'Don dang mo va co the giao cho nhan vien phu trach.';
  }

  return '';
}

export function getServiceOrderAssignSuccessMessage(result, fallbackToReassign = false) {
  const action = result?.action;
  const source = result?.source;
  const message = result?.message;

  if (action === 'already_assigned_to_same_employee') {
    return message || 'Don da o dung nhan vien nay roi.';
  }

  if (action === 'reassigned' || source === 'web_reassign' || fallbackToReassign) {
    return message || 'Da chuyen nguoi xu ly thanh cong.';
  }

  if (action === 'assigned' || source === 'web_assign') {
    return message || 'Da giao viec thanh cong.';
  }

  return message || 'Da cap nhat nhan vien phu trach thanh cong.';
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
      return { ...option, label: 'Cho nhan vien nhan' };
    }

    return option;
  }).filter((option) => allowedStatuses.has(option.value));
}
