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
 * Filters out local file paths from mobile apps and base64 data
 */
export const isValidImageUrl = (url) => {
  if (!url) return false;
  
  // Bỏ qua base64 data URLs
  if (url.startsWith('data:image/')) {
    return false;
  }
  
  // Chấp nhận http/https URLs
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return true;
  }
  
  // Chấp nhận relative paths (bắt đầu với /)
  if (url.startsWith('/')) {
    return true;
  }
  
  // Chấp nhận paths không bắt đầu với / (sẽ được normalize)
  if (url.includes('/') && !url.includes('\\')) {
    return true;
  }
  
  return false;
};

/**
 * Normalize image URL for web display
 * Converts Android emulator IP (10.0.2.2) to localhost if needed
 * Also handles various server configurations
 * If URL starts with /uploads, prepends with http://103.200.20.253
 */
export const normalizeImageUrl = (url) => {
  if (!url || !isValidImageUrl(url)) return null;
  
  // Nếu URL bắt đầu bằng /uploads, ghép với http://103.200.20.253
  if (url.startsWith('/uploads')) {
    const normalized = `http://103.200.20.253${url}`;
    return normalized;
  }
  
  // Convert Android emulator IP to localhost for development
  if (url.includes('10.0.2.2:3000')) {
    const normalized = url.replace('10.0.2.2:3000', 'localhost:3000');
    return normalized;
  }
  
  // If URL doesn't start with http/https, try to fix it
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    // Assume it's a relative path, prepend with current origin
    const normalized = `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}`;
    return normalized;
  }
  
  return url;
};

/**
 * Format time duration from seconds to "x ngày x giờ"
 * @param {number} value - Time in seconds
 * @returns {string} Formatted time string like "2 ngày 5 giờ" or "3 giờ"
 */
export const formatTimeDuration = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  
  const totalSeconds = Number(value);
  
  if (isNaN(totalSeconds) || totalSeconds < 0) return '-';
  
  const days = Math.floor(totalSeconds / 86400); // 86400 seconds = 1 day
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  
  const parts = [];
  if (days > 0) parts.push(`${days} ngày`);
  if (hours > 0 || parts.length === 0) parts.push(`${hours} giờ`);
  
  return parts.join(' ');
};

/**
 * Convert days and hours to total seconds
 * @param {number} days - Number of days
 * @param {number} hours - Number of hours
 * @returns {number} Total seconds
 */
export const daysHoursToSeconds = (days, hours) => {
  const daysNum = Number(days) || 0;
  const hoursNum = Number(hours) || 0;
  return (daysNum * 86400) + (hoursNum * 3600);
};

/**
 * Convert seconds to days and hours
 * @param {number} seconds - Total seconds
 * @returns {object} Object with days and hours properties
 */
export const secondsToDaysHours = (seconds) => {
  const totalSeconds = Number(seconds) || 0;
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  return { days, hours };
};

/**
 * Parse time duration from "x ngày x giờ" format to seconds
 * @param {string} timeString - Time string like "2 ngày 5 giờ" or "3 giờ"
 * @returns {number} Time in seconds, or null if invalid
 */
export const parseTimeDuration = (timeString) => {
  if (!timeString || typeof timeString !== 'string') return null;
  
  const trimmed = timeString.trim();
  if (!trimmed) return null;
  
  // Pattern: số + "ngày" hoặc "giờ"
  const dayMatch = trimmed.match(/(\d+)\s*ngày/i);
  const hourMatch = trimmed.match(/(\d+)\s*giờ/i);
  
  const days = dayMatch ? parseInt(dayMatch[1], 10) : 0;
  const hours = hourMatch ? parseInt(hourMatch[1], 10) : 0;
  
  // Convert to total seconds
  return daysHoursToSeconds(days, hours);
};

/**
 * Format warranty period from seconds to "x tháng" or "x ngày"
 * @param {number} seconds - Warranty period in seconds
 * @returns {string} Formatted string like "3 tháng" or "15 ngày"
 */
export const formatWarrantyPeriod = (seconds) => {
  if (seconds === null || seconds === undefined || seconds === '') return '-';
  
  const totalSeconds = Number(seconds);
  if (isNaN(totalSeconds) || totalSeconds < 0) return '-';
  
  // Convert to months (1 tháng = 30 ngày = 2,592,000 giây)
  const months = Math.floor(totalSeconds / 2592000);
  
  // If >= 1 month, show in months
  if (months >= 1) {
    return `${months} tháng`;
  }
  
  // Otherwise show in days
  const days = Math.floor(totalSeconds / 86400);
  if (days >= 1) {
    return `${days} ngày`;
  }
  
  // Otherwise show in hours
  const hours = Math.floor(totalSeconds / 3600);
  if (hours >= 1) {
    return `${hours} giờ`;
  }
  
  return `${Math.floor(totalSeconds / 60)} phút`;
};

/**
 * Convert months to seconds
 * @param {number} months - Number of months
 * @returns {number} Total seconds
 */
export const monthsToSeconds = (months) => {
  const monthsNum = Number(months) || 0;
  // 1 tháng = 30 ngày = 2,592,000 giây
  return monthsNum * 2592000;
};

/**
 * Convert seconds to months (rounded)
 * @param {number} seconds - Total seconds
 * @returns {number} Number of months
 */
export const secondsToMonths = (seconds) => {
  const totalSeconds = Number(seconds) || 0;
  // 1 tháng = 30 ngày = 2,592,000 giây
  return Math.floor(totalSeconds / 2592000);
};