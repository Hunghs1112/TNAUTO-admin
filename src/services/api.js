// src/services/api.js
import axios from 'axios';
import { createCrudAPI } from './apiFactory';

const API_BASE = 'http://103.200.20.253:5000/api';

// Log API base URL on module load
console.log('[API Config] Base URL:', API_BASE);

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000, // 30 seconds timeout
});

// Request throttling map - track requests để tránh duplicate
const pendingRequests = new Map();
const requestCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Request interceptor - log API calls và optimize
api.interceptors.request.use((config) => {
  const fullUrl = `${config.baseURL}${config.url}`;
  const method = config.method?.toUpperCase();
  const cacheKey = `${method}:${fullUrl}:${JSON.stringify(config.params || config.data || {})}`;
  
  // Kiểm tra cache cho GET requests
  if (method === 'GET' && requestCache.has(cacheKey)) {
    const cached = requestCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`[API Cache Hit] ${method} ${fullUrl}`);
      // Return cached response
      return Promise.reject({
        __isCached: true,
        data: cached.data,
        config
      });
    } else {
      requestCache.delete(cacheKey);
    }
  }

  // Kiểm tra duplicate requests (trong 100ms)
  if (pendingRequests.has(cacheKey)) {
    console.log(`[API Duplicate] ${method} ${fullUrl} - reusing pending request`);
    return pendingRequests.get(cacheKey);
  }

  // Tạo promise cho request
  const requestPromise = axios(config)
    .then(response => {
      // Cache GET responses
      if (method === 'GET') {
        requestCache.set(cacheKey, {
          data: response.data,
          timestamp: Date.now()
        });
        // Limit cache size (keep last 100 entries)
        if (requestCache.size > 100) {
          const firstKey = requestCache.keys().next().value;
          requestCache.delete(firstKey);
        }
      }
      pendingRequests.delete(cacheKey);
      return response;
    })
    .catch(error => {
      pendingRequests.delete(cacheKey);
      throw error;
    });

  // Lưu pending request (chỉ trong 5 giây)
  pendingRequests.set(cacheKey, requestPromise);
  setTimeout(() => {
    pendingRequests.delete(cacheKey);
  }, 5000);

  console.log(`[API Request] ${method} ${fullUrl}`, config.params || config.data || '');
  return config;
}, (error) => {
  console.error('[API Request Error]', error);
  return Promise.reject(error);
});

// Response interceptor - normalize response format và cache responses
api.interceptors.response.use(
  (response) => {
    const fullUrl = `${response.config.baseURL}${response.config.url}`;
    const method = response.config.method?.toUpperCase();
    const cacheKey = response.config.__cacheKey;
    
    // Handle cached response
    if (response.config.__useCache && response.config.__cachedData) {
      console.log(`[API Cache Return] ${method} ${fullUrl}`);
      return {
        ...response,
        data: response.config.__cachedData,
        status: 200,
        statusText: 'OK (Cached)'
      };
    }
    
    // Cache GET responses
    if (method === 'GET' && cacheKey && !response.config.__useCache) {
      requestCache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now()
      });
      // Limit cache size (keep last 100 entries)
      if (requestCache.size > 100) {
        const firstKey = requestCache.keys().next().value;
        requestCache.delete(firstKey);
      }
    }

    // Remove from pending requests
    if (cacheKey) {
      pendingRequests.delete(cacheKey);
    }

    console.log(`[API Response] ${method} ${fullUrl}`, {
      status: response.status,
      dataCount: Array.isArray(response.data?.data) ? response.data.data.length : 'N/A',
      hasData: !!response.data
    });
    
    // Normalize response data structure
    // Backend returns: { success: true, data: [...], count, total, page, limit }
    if (response.data && response.data.success !== undefined) {
      return response;
    }
    // If response doesn't have success field, wrap it
    return {
      ...response,
      data: {
        success: true,
        data: response.data
      }
    };
  },
  (error) => {
    // Xử lý trường hợp cache hit - không phải là lỗi thực sự
    if (error.__isCached) {
      // Trả về response object giống như axios response
      return Promise.resolve({
        data: error.data,
        status: 200,
        statusText: 'OK (Cached)',
        headers: {},
        config: error.config || {},
        request: {}
      });
    }
    
    const fullUrl = error.config ? `${error.config.baseURL || ''}${error.config.url || ''}` : 'Unknown URL';
    const method = error.config?.method ? error.config.method.toUpperCase() : 'UNKNOWN';
    
    // Chi tiết error logging để debug
    const errorDetails = {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.response?.data?.message || error.message,
      code: error.code,
      requestUrl: fullUrl,
      method: method,
    };
    
    // Log chi tiết hơn cho các lỗi phổ biến
    if (error.code === 'ECONNABORTED') {
      console.error(`[API Error] Timeout: ${fullUrl}`, errorDetails);
    } else if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
      console.error(`[API Error] Network Error (CORS hoặc không kết nối được): ${fullUrl}`, errorDetails);
      console.error('[API Error] Nguyên nhân có thể:');
      console.error('  1. CORS: Backend chưa cho phép origin này');
      console.error('  2. Backend không chạy hoặc không accessible từ IP này');
      console.error('  3. Firewall chặn kết nối');
      console.error('  4. Backend chỉ listen trên localhost thay vì 0.0.0.0');
    } else if (error.response?.status === 0) {
      console.error(`[API Error] CORS Error (Status 0): ${fullUrl}`, errorDetails);
      console.error('[API Error] Backend cần cấu hình CORS để cho phép origin này');
    } else {
      console.error(`[API Error] ${method} ${fullUrl}`, errorDetails);
    }
    
    // Better error handling
    const errorMessage = error.response?.data?.error || 
                        error.response?.data?.message || 
                        error.message || 
                        'Có lỗi xảy ra';
    return Promise.reject({
      ...error,
      message: errorMessage,
      status: error.response?.status,
      code: error.code,
      isNetworkError: error.code === 'ERR_NETWORK' || error.message?.includes('Network Error'),
      isCorsError: error.response?.status === 0 || (error.code === 'ERR_NETWORK' && !error.response),
    });
  }
);

// ===== USER MANAGEMENT =====

// Dealers API
export const dealersAPI = createCrudAPI(api, '/dealers', {
  getAll: (params = {}) => api.get('/dealers', { params }),
  getById: (id) => api.get(`/dealers/${id}`),
  create: (data) => api.post('/dealers', data),
  update: (id, data) => api.put(`/dealers/${id}`, data),
  delete: (id) => api.delete(`/dealers/${id}`),
  getStats: () => api.get('/dealers/stats'),
  register: (data) => api.post('/auth/dealer/register', data),
  // Upload avatar
  uploadAvatar: (id, file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post(`/dealers/${id}/upload-avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
});

// Customers API - Admin endpoints per ADMIN_QUICK_REFERENCE.md
export const customersAPI = createCrudAPI(api, '/customers', {
  // Stats endpoint
  getStats: () => api.get('/customers/stats'),
  // Customer authentication
  register: (data) => api.post('/customers/register', data),
  login: (data) => api.post('/customers/login', data),
  updateProfile: (data) => api.put('/customers/profile', data),
  deleteAccount: (data) => api.delete('/customers/account', data),
  // Upload avatar
  uploadAvatar: (id, file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post(`/customers/${id}/upload-avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  // Get driver license info
  getDriverLicense: (id) => api.get(`/customers/${id}/driver-license`),
  // Get customer vehicles
  getVehicles: (id) => api.get(`/customers/${id}/vehicles`),
});

// Employees API - Admin endpoints per ADMIN_QUICK_REFERENCE.md
export const employeesAPI = createCrudAPI(api, '/employees', {
  // Stats endpoint
  getStats: () => api.get('/employees/stats'),
  // Employee authentication
  login: (data) => api.post('/employees/login', data),
  getAssignedOrders: () => api.get('/employees/orders/assigned'),
  getOrders: () => api.get('/employees/orders'),
  getOrderById: (id) => api.get(`/employees/orders/${id}`),
  // Assign order
  assignOrder: (data) => api.post('/employees/assign-order', data),
  // Upload avatar
  uploadAvatar: (id, file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post(`/employees/${id}/upload-avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
});

// ===== SERVICE MANAGEMENT =====

// Services API - Per ADMIN_QUICK_REFERENCE.md
export const servicesAPI = createCrudAPI(api, '/services', {
  // Override create/update/delete to use /admin prefix
  create: (data) => api.post('/services/admin', data),
  update: (id, data) => api.put(`/services/admin/${id}`, data),
  delete: (id) => api.delete(`/services/admin/${id}`),
  // Stats
  getStats: () => api.get('/services/admin/stats'),
  // Upload image
  uploadImage: (id, file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post(`/services/admin/${id}/upload-image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
});

// ===== PRODUCT MANAGEMENT =====

// Products API - GET uses public endpoint, admin actions use /admin prefix
export const productsAPI = createCrudAPI(api, '/products', {
  // Override create/update/delete to use /admin prefix
  create: (data) => api.post('/products/admin', data),
  update: (id, data) => api.put(`/products/admin/${id}`, data),
  delete: (id) => api.delete(`/products/admin/${id}`),
  // Admin stats
  getStats: () => api.get('/products/admin/stats'),
  // Product images management - using correct endpoints from updated documentation
  createImage: (data) => api.post('/products/images', data),
  getImages: (productId) => api.get(`/products/${productId}/images`),
  updateImage: (id, data) => api.put(`/products/images/${id}`, data),
  deleteImage: (id) => api.delete(`/products/images/${id}`),
});

// ===== SERVICE CATEGORY MANAGEMENT =====

// Service Categories API - Per HUONG_DAN_TICH_HOP.md
export const serviceCategoriesAPI = createCrudAPI(api, '/service-categories', {
  // Override create/update/delete to use /admin prefix
  create: (data) => api.post('/service-categories/admin', data),
  update: (id, data) => api.put(`/service-categories/admin/${id}`, data),
  delete: (id) => api.delete(`/service-categories/admin/${id}`),
  // Stats
  getStats: () => api.get('/service-categories/admin/stats'),
  // Upload image
  uploadImage: (id, file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post(`/service-categories/admin/${id}/upload-image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
});

// ===== CATEGORY MANAGEMENT =====

// Categories API - Per ADMIN_QUICK_REFERENCE.md
export const categoriesAPI = createCrudAPI(api, '/categories', {
  // Override create/update/delete to use /admin prefix
  create: (data) => {
    console.log('[Categories API] Creating category:', data);
    return api.post('/categories/admin', data);
  },
  getAll: (params = {}) => {
    console.log('[Categories API] Fetching all categories...');
    return api.get('/categories', { params }).then(res => {
      console.log('[Categories API] Categories response:', res.data);
      return res;
    });
  },
  update: (id, data) => {
    console.log(`[Categories API] Updating category ${id} with data:`, data);
    console.log(`[Categories API] Image URL in update data:`, data.image_url);
    return api.put(`/categories/admin/${id}`, data);
  },
  delete: (id) => api.delete(`/categories/admin/${id}`),
  // Stats
  getStats: () => api.get('/categories/admin/stats'),
  // Upload image
  uploadImage: (id, file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post(`/categories/admin/${id}/upload-image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
});

// ===== VEHICLE MANAGEMENT =====

// Vehicles API - Per ADMIN_QUICK_REFERENCE.md
export const vehiclesAPI = createCrudAPI(api, '/vehicles/admin', {
  // Override getAll to use /admin/all endpoint
  getAll: (params = {}) => api.get('/vehicles/admin/all', { params }),
  // Stats
  getStats: () => api.get('/vehicles/admin/stats'),
  // Upload image
  uploadImage: (id, file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post(`/vehicles/admin/${id}/upload-image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  // Public search endpoint
  searchByPlate: (plate) => api.get('/vehicles/search', { params: { plate } }),
});

// ===== SERVICE ORDER MANAGEMENT =====

// Service Orders API - Admin actions require /admin prefix
export const serviceOrdersAPI = createCrudAPI(api, '/service-orders', {
  // Admin stats
  getStats: () => api.get('/service-orders/admin/stats'),
  // Order status management - Admin endpoints
  updateStatus: (id, data) => api.put(`/service-orders/admin/${id}/status`, data),
  assign: (id, data) => api.patch(`/service-orders/admin/${id}/assign`, data),
  complete: (id, data) => api.patch(`/service-orders/admin/${id}/complete`, data),
  // Override delete to use admin endpoint
  delete: (id) => api.delete(`/service-orders/admin/${id}`),
});

// ===== OFFER MANAGEMENT =====

// Offers API - Per ADMIN_QUICK_REFERENCE.md
export const offersAPI = createCrudAPI(api, '/offers', {
  // Override create/update/delete to use /admin prefix
  create: (data) => api.post('/offers/admin', data),
  update: (id, data) => api.put(`/offers/admin/${id}`, data),
  delete: (id) => api.delete(`/offers/admin/${id}`),
  // Stats
  getStats: () => api.get('/offers/admin/stats'),
  // Upload image
  uploadImage: (id, file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post(`/offers/admin/${id}/upload-image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  // Offer images management
  createImage: (data) => api.post('/offers/images', data),
  getImages: (offerId) => api.get(`/offers/${offerId}/images`),
  updateImage: (id, data) => api.put(`/offers/images/${id}`, data),
  deleteImage: (id) => api.delete(`/offers/images/${id}`),
});

// ===== WARRANTY MANAGEMENT =====

// Warranties API - GET uses public endpoint, admin actions use /admin prefix
export const warrantiesAPI = createCrudAPI(api, '/warranties', {
  // Override getAll to log response structure
  getAll: (params) => {
    console.log('[Warranties API] Fetching all warranties...');
    return api.get('/warranties', { params }).then(res => {
      console.log('[Warranties API] Warranties response:', res.data);
      // Log sample warranty item structure
      if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
        const sample = res.data.data[0];
        console.log('[Warranties API] Sample warranty item structure:', sample);
        console.log('[Warranties API] Has employee_id:', 'employee_id' in sample, sample.employee_id);
        console.log('[Warranties API] Has service_id:', 'service_id' in sample, sample.service_id);
        console.log('[Warranties API] Has employee_name:', 'employee_name' in sample, sample.employee_name);
        console.log('[Warranties API] Has service_name:', 'service_name' in sample, sample.service_name);
        console.log('[Warranties API] Has employee object:', 'employee' in sample, sample.employee);
        console.log('[Warranties API] Has service object:', 'service' in sample, sample.service);
      }
      return res;
    });
  },
  create: (data) => api.post('/warranties', data),
  update: (id, data) => api.put(`/warranties/${id}`, data),
  delete: (id) => api.delete(`/warranties/${id}`),
  getStats: () => api.get('/warranties/stats'),
});

// ===== FILE UPLOAD MANAGEMENT =====

// Upload API - File management
export const uploadAPI = {
  single: async (file) => {
    // Backend expects "image" field name for single upload
    const formData = new FormData();
    formData.append('image', file); // Use "image" as per API docs
    console.log(`Uploading single file with field name: image`);
    
    return api.post('/upload/single', formData, { 
      headers: { 'Content-Type': 'multipart/form-data' } 
    });
  },
  multiple: async (files) => {
    // Backend expects "images" field name for multiple uploads
    const formData = new FormData();
    files.forEach(file => formData.append('images', file)); // Use "images" as specified by backend
    console.log(`Uploading multiple files with field name: images`);
    
    return api.post('/upload/multiple', formData, { 
      headers: { 'Content-Type': 'multipart/form-data' } 
    });
  },
  delete: (filename) => api.delete(`/upload/${filename}`),
};

// ===== SERVICE ORDER IMAGE MANAGEMENT =====

// Service Order Images API
export const serviceOrderImagesAPI = {
  getByOrder: (orderId) => api.get(`/service-order-images/${orderId}`),
  create: (data) => api.post('/service-order-images', data),
  delete: (id) => api.delete(`/service-order-images/${id}`),
};

// ===== NOTIFICATION MANAGEMENT =====

// Notifications API - User and admin management
export const notificationsAPI = {
  // User notifications
  getUserNotifications: (params) => api.get('/notifications', { params }),
  getUnreadCount: (params) => api.get('/notifications/unread-count', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: (data) => api.put('/notifications/read-all', data),
  delete: (id) => api.delete(`/notifications/${id}`),
  
  // Admin notifications (legacy)
  getAll: (params) => api.get('/notifications/admin/all', { params }),
  send: (data) => api.post('/notifications/send', data),
  getStats: () => api.get('/notifications/admin/stats'),

  // Admin notifications (spec)
  getAdminLogs: (params) => api.get('/admin/notifications', { params }),
  
  // Helper methods for dropdowns
  getCustomers: () => api.get('/customers'),
  getEmployees: () => api.get('/employees'),
};

// ===== FCM TOKEN MANAGEMENT =====

// FCM Tokens API
export const fcmTokensAPI = {
  register: (data) => api.post('/fcm-tokens/register', data),
  refresh: (data) => api.post('/fcm-tokens/refresh', data),
  getUserTokens: (params) => api.get('/fcm-tokens/user', { params }),
  delete: (data) => api.delete('/fcm-tokens', { data }),
  
  // Admin endpoints
  getActive: () => api.get('/fcm-tokens/active'),
  deactivateInactive: () => api.post('/fcm-tokens/deactivate-inactive'),
  cleanup: () => api.delete('/fcm-tokens/cleanup'),
  getStats: () => api.get('/fcm-tokens/stats'),
};

// ===== SERVICE REMINDER CONFIGS API =====

// Per Notification System Guide
export const serviceReminderConfigsAPI = {
  getAll: (params) => api.get('/admin/service-reminder-configs', { params }),
  upsert: (serviceId, data) => api.put(`/admin/service-reminder-configs/${serviceId}`, data),
  setEnabled: (serviceId, enabled) => api.patch(`/admin/service-reminder-configs/${serviceId}/enabled`, { enabled }),
};

// ===== ADMIN NOTIFICATIONS (LOGS) API =====

// Per Notification System Guide
export const adminNotificationsAPI = {
  getAll: (params) => api.get('/admin/notifications', { params }),
};

// ===== PUSH NOTIFICATION MANAGEMENT =====

// Push Notifications API
export const pushNotificationsAPI = {
  sendToUser: (data) => api.post('/push-notifications/send-to-user', data),
  sendToAll: (data) => api.post('/push-notifications/send-to-all', data),
  sendToTopic: (data) => api.post('/push-notifications/send-to-topic', data),
  test: (data) => api.post('/push-notifications/test', data),
  
  // Monitoring
  getHealth: () => api.get('/push-notifications/health'),
  getStats: () => api.get('/push-notifications/stats'),
};

// ===== SYSTEM ENDPOINTS =====

// System API
export const systemAPI = {
  health: () => api.get('/health'),
  docs: () => api.get('/api-docs'),
};

export default api;