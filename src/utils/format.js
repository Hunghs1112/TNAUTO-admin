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
  
  console.log('Validating URL:', url);
  
  // Bỏ qua base64 data URLs
  if (url.startsWith('data:image/')) {
    console.log('Rejected: base64 data URL');
    return false;
  }
  
  // Chấp nhận http/https URLs
  if (url.startsWith('http://') || url.startsWith('https://')) {
    console.log('Accepted: http/https URL');
    return true;
  }
  
  // Chấp nhận relative paths (bắt đầu với /)
  if (url.startsWith('/')) {
    console.log('Accepted: relative path');
    return true;
  }
  
  // Chấp nhận paths không bắt đầu với / (sẽ được normalize)
  if (url.includes('/') && !url.includes('\\')) {
    console.log('Accepted: path without leading slash');
    return true;
  }
  
  console.log('Rejected: invalid URL format');
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
  
  console.log('Normalizing URL:', url);
  
  // Nếu URL bắt đầu bằng /uploads, ghép với http://103.200.20.253
  if (url.startsWith('/uploads')) {
    const normalized = `http://103.200.20.253${url}`;
    console.log('Fixed /uploads URL:', normalized);
    return normalized;
  }
  
  // Convert Android emulator IP to localhost for development
  if (url.includes('10.0.2.2:3000')) {
    const normalized = url.replace('10.0.2.2:3000', 'localhost:3000');
    console.log('Converted emulator IP to localhost:', normalized);
    return normalized;
  }
  
  // If URL doesn't start with http/https, try to fix it
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    // Assume it's a relative path, prepend with current origin
    const normalized = `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}`;
    console.log('Fixed relative URL:', normalized);
    return normalized;
  }
  
  console.log('URL is already valid:', url);
  return url;
};