import Colors from '../constants/colors';

export { Colors };

export const colors = {
  primary: {
    bg: 'bg-[#112552]',
    bgHover: 'hover:bg-[#1e406b]',
    bgDisabled: 'bg-[#a4a4aa]',
    text: 'text-[#e0a02e]',
    textHover: 'hover:text-[#eecd7e]',
    border: 'border-[#1e406b]',
    borderHover: 'hover:border-[#c37b1e]',
    light: 'bg-[#1e406b]/12',
    badge: 'bg-[#1e406b]/15 text-[#dfe1e3]',
  },
  success: {
    bg: 'bg-[#8f5f23]',
    bgHover: 'hover:bg-[#b48242]',
    text: 'text-[#eecd7e]',
    textHover: 'hover:text-[#f8ecd6]',
    border: 'border-[#8f5f23]',
    light: 'bg-[#8f5f23]/12',
    badge: 'bg-[#8f5f23]/15 text-[#eecd7e]',
  },
  warning: {
    bg: 'bg-[#c37b1e]',
    bgHover: 'hover:bg-[#e0a02e]',
    text: 'text-[#eecd7e]',
    textHover: 'hover:text-[#f8ecd6]',
    border: 'border-[#c37b1e]',
    light: 'bg-[#c37b1e]/12',
    badge: 'bg-[#c37b1e]/15 text-[#eecd7e]',
  },
  danger: {
    bg: 'bg-[#b48242]',
    bgHover: 'hover:bg-[#8f5f23]',
    text: 'text-[#b48242]',
    textHover: 'hover:text-[#e0a02e]',
    border: 'border-[#b48242]',
    light: 'bg-[#b48242]/12',
    badge: 'bg-[#b48242]/15 text-[#eecd7e]',
  },
  secondary: {
    bg: 'bg-[#4c4b50]',
    bgHover: 'hover:bg-[#636267]',
    text: 'text-[#dfe1e3]',
    textHover: 'hover:text-white',
    border: 'border-[#7a797c]',
    light: 'bg-[#7a797c]/12',
    badge: 'bg-[#7a797c]/15 text-[#dfe1e3]',
  },
  info: {
    bg: 'bg-[#1e406b]',
    bgHover: 'hover:bg-[#112552]',
    text: 'text-[#dfe1e3]',
    textHover: 'hover:text-[#f8f9fa]',
    border: 'border-[#1e406b]',
    light: 'bg-[#1e406b]/12',
    badge: 'bg-[#1e406b]/15 text-[#dfe1e3]',
  },
};

export const buttonStyles = {
  primary: 'btn-gradient-primary',
  success: 'btn-gradient-success',
  warning: 'btn-gradient-warning',
  danger: 'btn-gradient-error',
  secondary: 'btn-gradient-secondary',
};

export const badgeStyles = {
  primary: `${colors.primary.badge} rounded-full px-2 py-1 text-xs font-semibold`,
  success: `${colors.success.badge} rounded-full px-2 py-1 text-xs font-semibold`,
  warning: `${colors.warning.badge} rounded-full px-2 py-1 text-xs font-semibold`,
  danger: `${colors.danger.badge} rounded-full px-2 py-1 text-xs font-semibold`,
  info: `${colors.info.badge} rounded-full px-2 py-1 text-xs font-semibold`,
  secondary: `${colors.secondary.badge} rounded-full px-2 py-1 text-xs font-semibold`,
};

export const statusColors = {
  received: { bg: 'bg-[#c37b1e]/12', text: 'text-[#eecd7e]', label: 'Đã tiếp nhận' },
  in_progress: { bg: 'bg-[#1e406b]/15', text: 'text-[#dfe1e3]', label: 'Đang xử lý' },
  ready_for_pickup: { bg: 'bg-[#1e406b]/15', text: 'text-[#dfe1e3]', label: 'Sẵn sàng bàn giao' },
  completed: { bg: 'bg-[#8f5f23]/15', text: 'text-[#eecd7e]', label: 'Hoàn thành' },
  cancelled: { bg: 'bg-[#7a797c]/15', text: 'text-[#dfe1e3]', label: 'Đã hủy' },
};

export const actionColors = {
  view: 'text-[#e0a02e] hover:text-[#eecd7e] hover:bg-[#1e406b]/12',
  edit: 'text-[#eecd7e] hover:text-[#f8ecd6] hover:bg-[#c37b1e]/12',
  delete: 'text-[#b48242] hover:text-[#e0a02e] hover:bg-[#b48242]/12',
};
