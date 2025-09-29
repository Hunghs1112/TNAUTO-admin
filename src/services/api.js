// src/services/api.js
import axios from 'axios';

const API_BASE = 'http://localhost:3000/api'; // Thay bằng backend URL thực tế

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  console.log('API Request:', config.method?.toUpperCase(), config.url, config.data);
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.data);
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

export const customersAPI = {
  getAll: () => api.get('/customers'),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers/register', data), // Use /register for create
  update: (id, data) => api.patch(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
  login: (data) => api.post('/customers/login', data),
  getServices: () => api.get('/customers/services'),
  getOrders: (phone) => api.get('/customers/orders', { params: { phone } }),
  createOrder: (data) => api.post('/customers/orders', data),
  getOrderDetails: (id) => api.get(`/customers/orders/${id}`),
};

export const employeesAPI = {
  getAll: () => api.get('/employees'),
  getById: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.patch(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`),
  login: (data) => api.post('/employees/login', data),
  getAssignedOrders: (employeeId, status) => api.get('/employees/orders/assigned', { params: { employee_id: employeeId, status } }),
  getOrders: (status) => api.get('/employees/orders', { params: { status } }),
  getOrderDetails: (id) => api.get(`/employees/orders/${id}`),
};

export const servicesAPI = {
  getAll: () => api.get('/services'),
  getById: (id) => api.get(`/services/${id}`),
  create: (data) => api.post('/services', data),
  update: (id, data) => api.patch(`/services/${id}`, data),
  delete: (id) => api.delete(`/services/${id}`),
};

export const productsAPI = {
  getAll: () => api.get('/products'),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.patch(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  createImage: (data) => api.post('/products/images', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteImage: (id) => api.delete(`/products/images/${id}`),
};

export const serviceOrdersAPI = {
  getAll: () => api.get('/service-orders'),
  getById: (id) => api.get(`/service-orders/${id}`),
  create: (data) => api.post('/service-orders', data),
  updateStatus: (id, status) => api.put(`/service-orders/${id}/status`, { status }),
  complete: (id) => api.patch(`/service-orders/${id}/complete`),
  assign: (id, employeeId) => api.patch(`/service-orders/${id}/assign`, { employee_id: employeeId }),
  delete: (id) => api.delete(`/service-orders/${id}`),
};

export const notificationsAPI = {
  getAll: () => api.get('/notifications'), // Now supports all without params
  create: (data) => api.post('/notifications', data),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  getByRecipient: (recipientId, recipientType) => api.get('/notifications', { params: { recipient_id: recipientId, recipient_type: recipientType } }),
};

export const warrantiesAPI = {
  getAll: () => api.get('/warranties'),
  getById: (id) => api.get(`/warranties/${id}`),
  create: (data) => api.post('/warranties', data),
  update: (id, data) => api.patch(`/warranties/${id}`, data),
  delete: (id) => api.delete(`/warranties/${id}`),
};

export const offersAPI = {
  getAll: () => api.get('/offers'),
  getById: (id) => api.get(`/offers/${id}`),
  create: (data) => api.post('/offers', data),
  update: (id, data) => api.patch(`/offers/${id}`, data),
  delete: (id) => api.delete(`/offers/${id}`),
};

export const serviceOrderImagesAPI = {
  getByOrder: (orderId) => api.get(`/service-order-images/${orderId}`),
  create: (data) => api.post('/service-order-images', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/service-order-images/${id}`),
};

export default api;