// src/styles/colors.js
// Hệ thống màu sắc thống nhất cho toàn bộ ứng dụng

export const colors = {
  // Primary - Màu chính (Xanh dương)
  primary: {
    bg: 'bg-blue-500',
    bgHover: 'hover:bg-blue-600',
    bgDisabled: 'bg-blue-300',
    text: 'text-blue-600',
    textHover: 'hover:text-blue-700',
    border: 'border-blue-400',
    borderHover: 'hover:border-blue-500',
    light: 'bg-blue-50',
    badge: 'bg-blue-100 text-blue-700',
  },

  // Success - Thành công (Xanh lá)
  success: {
    bg: 'bg-green-500',
    bgHover: 'hover:bg-green-600',
    text: 'text-green-600',
    textHover: 'hover:text-green-700',
    border: 'border-green-400',
    light: 'bg-green-50',
    badge: 'bg-green-100 text-green-700',
  },

  // Warning - Cảnh báo (Vàng)
  warning: {
    bg: 'bg-amber-400',
    bgHover: 'hover:bg-amber-500',
    text: 'text-amber-600',
    textHover: 'hover:text-amber-700',
    border: 'border-amber-400',
    light: 'bg-amber-50',
    badge: 'bg-amber-100 text-amber-700',
  },

  // Danger - Nguy hiểm (Đỏ)
  danger: {
    bg: 'bg-red-500',
    bgHover: 'hover:bg-red-600',
    text: 'text-red-600',
    textHover: 'hover:text-red-700',
    border: 'border-red-400',
    light: 'bg-red-50',
    badge: 'bg-red-100 text-red-700',
  },

  // Secondary - Phụ (Xám)
  secondary: {
    bg: 'bg-gray-600',
    bgHover: 'hover:bg-gray-700',
    text: 'text-gray-600',
    textHover: 'hover:text-gray-700',
    border: 'border-gray-300',
    light: 'bg-gray-50',
    badge: 'bg-gray-100 text-gray-700',
  },

  // Info - Thông tin (Tím/Indigo)
  info: {
    bg: 'bg-indigo-500',
    bgHover: 'hover:bg-indigo-600',
    text: 'text-indigo-600',
    textHover: 'hover:text-indigo-700',
    border: 'border-indigo-400',
    light: 'bg-indigo-50',
    badge: 'bg-indigo-100 text-indigo-700',
  },
};

// Button styles - Modern Gradient Buttons
export const buttonStyles = {
  primary: `btn-gradient-primary flex items-center gap-2`,
  success: `btn-gradient-success flex items-center gap-2`,
  warning: `btn-gradient-warning flex items-center gap-2`,
  danger: `btn-gradient-error flex items-center gap-2`,
  secondary: `btn-gradient-secondary flex items-center gap-2`,
};

// Badge styles
export const badgeStyles = {
  primary: `${colors.primary.badge} px-2 py-1 rounded-full text-xs font-semibold`,
  success: `${colors.success.badge} px-2 py-1 rounded-full text-xs font-semibold`,
  warning: `${colors.warning.badge} px-2 py-1 rounded-full text-xs font-semibold`,
  danger: `${colors.danger.badge} px-2 py-1 rounded-full text-xs font-semibold`,
  info: `${colors.info.badge} px-2 py-1 rounded-full text-xs font-semibold`,
  secondary: `${colors.secondary.badge} px-2 py-1 rounded-full text-xs font-semibold`,
};

// Status badge colors (for order status)
export const statusColors = {
  received: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Đã nhận' },
  in_progress: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Đang xử lý' },
  ready_for_pickup: { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'Sẵn sàng lấy' },
  completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Hoàn thành' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Đã hủy' },
};

// Action icon colors
export const actionColors = {
  view: `${colors.primary.text} ${colors.primary.textHover} ${colors.primary.light}`,
  edit: `${colors.success.text} ${colors.success.textHover} ${colors.success.light}`,
  delete: `${colors.danger.text} ${colors.danger.textHover} ${colors.danger.light}`,
};

