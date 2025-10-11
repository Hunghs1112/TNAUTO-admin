// src/utils/format.js
export const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN');
};

export const formatCurrency = (amount) => {
  if (!amount) return '0 VND';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

/**
 * Check if URL is valid for web display
 * Filters out local file paths from mobile apps
 */
export const isValidImageUrl = (url) => {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://');
};

/**
 * Normalize image URL for web display
 * Converts Android emulator IP (10.0.2.2) to localhost if needed
 */
export const normalizeImageUrl = (url) => {
  if (!url || !isValidImageUrl(url)) return null;
  
  // Convert Android emulator IP to localhost for development
  // Change this to your actual server IP/domain in production
  if (url.includes('10.0.2.2:3000')) {
    return url.replace('10.0.2.2:3000', 'localhost:3000');
  }
  
  return url;
};