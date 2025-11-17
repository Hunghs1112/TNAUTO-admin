// src/services/api.js
import axios from 'axios';
import { createCrudAPI } from './apiFactory';

const API_BASE = 'http://103.200.20.253:5000/api'; // Thay bằng backend URL thực tế

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - minimal logging
api.interceptors.request.use((config) => {
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor - normalize response format
api.interceptors.response.use(
  (response) => {
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
    // Better error handling
    const errorMessage = error.response?.data?.error || 
                        error.response?.data?.message || 
                        error.message || 
                        'Có lỗi xảy ra';
    return Promise.reject({
      ...error,
      message: errorMessage,
      status: error.response?.status
    });
  }
);

// ===== USER MANAGEMENT =====

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
});

// ===== WARRANTY MANAGEMENT =====

// Warranties API - GET uses public endpoint, admin actions use /admin prefix
export const warrantiesAPI = createCrudAPI(api, '/warranties', {
  // Override create/update/delete to use /admin prefix
  create: (data) => api.post('/warranties/admin', data),
  update: (id, data) => api.put(`/warranties/admin/${id}`, data),
  delete: (id) => api.delete(`/warranties/admin/${id}`),
  // Admin stats
  getStats: () => api.get('/warranties/admin/stats'),
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
  
  // Admin notifications
  getAll: (params) => api.get('/notifications/admin/all', { params }),
  send: (data) => api.post('/notifications/send', data),
  getStats: () => api.get('/notifications/admin/stats'),
  
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