// src/services/api.js
import axios from 'axios';
import { createCrudAPI } from './apiFactory';

const API_BASE = 'http://localhost:3000/api'; // Thay bằng backend URL thực tế

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// api.interceptors.request.use((config) => {
//   console.log('API Request:', config.method?.toUpperCase(), config.url, config.data);
//   return config;
// });

// api.interceptors.response.use(
//   (response) => {
//     console.log('API Response:', response.status, response.data);
//     return response;
//   },
//   (error) => {
//     console.error('API Error:', error.response?.status, error.response?.data);
//     return Promise.reject(error);
//   }
// );

// Using factory for customers API with custom methods
export const customersAPI = createCrudAPI(api, '/customers', {
  // Override create to use /register endpoint
  create: (data) => api.post('/customers/register', data),
  // Custom methods
  login: (data) => api.post('/customers/login', data),
  getServices: () => api.get('/customers/services'),
  getOrders: (phone) => api.get('/customers/orders', { params: { phone } }),
  createOrder: (data) => api.post('/customers/orders', data),
  getOrderDetails: (id) => api.get(`/customers/orders/${id}`),
});

// Using factory for employees API with custom methods
export const employeesAPI = createCrudAPI(api, '/employees', {
  login: (data) => api.post('/employees/login', data),
  getAssignedOrders: (employeeId, status) => api.get('/employees/orders/assigned', { params: { employee_id: employeeId, status } }),
  getOrders: (status) => api.get('/employees/orders', { params: { status } }),
  getOrderDetails: (id) => api.get(`/employees/orders/${id}`),
});

// Simple CRUD APIs using factory
export const servicesAPI = createCrudAPI(api, '/services');

// Categories API
export const categoriesAPI = createCrudAPI(api, '/categories');

// Products API with category support and image methods
export const productsAPI = createCrudAPI(api, '/products', {
  createImage: (data) => api.post('/products/images', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteImage: (id) => api.delete(`/products/images/${id}`),
});

// Offers API
export const offersAPI = createCrudAPI(api, '/offers');

// Warranties API
export const warrantiesAPI = createCrudAPI(api, '/warranties');

// Service Orders API with custom methods
export const serviceOrdersAPI = createCrudAPI(api, '/service-orders', {
  updateStatus: (id, status) => api.put(`/service-orders/${id}/status`, { status }),
  complete: (id) => api.patch(`/service-orders/${id}/complete`),
  assign: (id, employeeId) => api.patch(`/service-orders/${id}/assign`, { employee_id: employeeId }),
});

// Notifications API with custom methods
export const notificationsAPI = createCrudAPI(api, '/notifications', {
  // Override getAll to use admin endpoint
  getAll: (params) => {
    // Only add params if they exist and are not empty
    if (params && Object.keys(params).length > 0) {
      return api.get('/notifications/admin/all', { params });
    }
    return api.get('/notifications/admin/all');
  },
  // Mark as read
  markRead: (id) => api.put(`/notifications/${id}/read`),
  // Get by recipient
  getByRecipient: (recipientId, recipientType) => api.get('/notifications', { params: { recipient_id: recipientId, recipient_type: recipientType } }),
  // Get unread count
  getUnreadCount: (recipientId, recipientType) => api.get('/notifications/unread-count', { params: { recipient_id: recipientId, recipient_type: recipientType } }),
  // Send custom notification
  send: (data) => api.post('/notifications/send', data),
  // Mark all as read
  markAllRead: (recipientId, recipientType) => api.put('/notifications/read-all', { recipient_id: recipientId, recipient_type: recipientType }),
  // Get customers for dropdown
  getCustomers: () => api.get('/customers'),
  // Get employees for dropdown
  getEmployees: () => api.get('/employees'),
});

// Push Notifications API
export const pushNotificationsAPI = {
  // Send to specific user
  sendToUser: (data) => api.post('/push-notifications/send-to-user', data),
  // Broadcast to all users
  sendToAll: (data) => api.post('/push-notifications/send-to-all', data),
  // Send to topic
  sendToTopic: (data) => api.post('/push-notifications/send-to-topic', data),
  // Test notification
  test: (data) => api.post('/push-notifications/test', data),
};

// FCM Tokens API - Optional, comment out if not available on backend
export const fcmTokensAPI = {
  // Get all active tokens
  getActive: () => api.get('/fcm-tokens/active').catch(() => ({ data: { tokens: [], count: 0 } })),
  // Get tokens for specific user
  getUserTokens: (userId, userType) => api.get('/fcm-tokens/user', { params: { user_id: userId, user_type: userType } }).catch(() => ({ data: { tokens: [] } })),
  // Cleanup inactive tokens
  cleanupInactive: () => api.post('/fcm-tokens/cleanup/inactive').catch(() => ({ data: { deactivated_count: 0 } })),
  // Delete old tokens
  deleteOld: (days = 90) => api.delete(`/fcm-tokens/cleanup/old?days=${days}`).catch(() => ({ data: { deleted_count: 0 } })),
};

// Service Order Images API
export const serviceOrderImagesAPI = {
  getByOrder: (orderId) => api.get(`/service-order-images/${orderId}`),
  create: (data) => api.post('/service-order-images', data),
  delete: (id) => api.delete(`/service-order-images/${id}`),
};

// Vehicles API - Sử dụng endpoint admin mới
export const vehiclesAPI = {
  // Admin endpoint - lấy tất cả vehicles với phân trang và search
  getAll: (params = {}) => api.get('/vehicles/admin/all', { params }),
  getById: (id) => api.get(`/vehicles/${id}`),
  create: (data) => api.post('/vehicles', data),
  update: (id, data) => api.patch(`/vehicles/${id}`, data),
  delete: (id) => api.delete(`/vehicles/${id}`),
  // Customer-specific endpoints
  getCustomerVehicles: (customerId) => api.get('/vehicles', { params: { customer_id: customerId } }),
  searchByPlate: (licensePlate) => api.get('/vehicles/search', { params: { license_plate: licensePlate } }),
};

// Upload API
export const uploadAPI = {
  single: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/upload/single', formData, { 
      headers: { 'Content-Type': 'multipart/form-data' } 
    });
  },
  multiple: (files) => {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    return api.post('/upload/multiple', formData, { 
      headers: { 'Content-Type': 'multipart/form-data' } 
    });
  },
  delete: (filename) => api.delete(`/upload/${filename}`),
};

export default api;