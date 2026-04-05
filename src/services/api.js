import axios from 'axios';
import { createCrudAPI } from './apiFactory';
import { clearAuthSession, getAuthToken } from './authStorage';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://tnauto-backend-production.up.railway.app/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

async function requestWithFallback(primaryRequest, fallbackRequest) {
  try {
    return await primaryRequest();
  } catch (error) {
    const status = error?.response?.status;
    if (fallbackRequest && [404, 405, 501].includes(status)) {
      return fallbackRequest();
    }

    throw error;
  }
}

api.interceptors.request.use((config) => {
  const nextConfig = { ...config };
  const nextHeaders = nextConfig.headers || {};

  if (!nextConfig.skipAuth) {
    const token = getAuthToken();
    if (token && !nextHeaders.Authorization) {
      nextHeaders.Authorization = `Bearer ${token}`;
    }
  }

  nextConfig.headers = nextHeaders;
  return nextConfig;
});

api.interceptors.response.use(
  (response) => {
    if (response.data && response.data.success !== undefined) {
      return response;
    }

    return {
      ...response,
      data: {
        success: true,
        data: response.data,
      },
    };
  },
  (error) => {
    if (error.response?.status === 401 && !error.config?.skipAuthFailureHandler) {
      clearAuthSession('unauthorized');
    }

    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'Có lỗi xảy ra';

    return Promise.reject({
      ...error,
      message,
      status: error.response?.status,
      code: error.code,
      isNetworkError: error.code === 'ERR_NETWORK' || error.message?.includes('Network Error'),
      isCorsError: error.response?.status === 0 || (error.code === 'ERR_NETWORK' && !error.response),
    });
  }
);

export const authAPI = {
  loginGarage: (data) =>
    api.post('/auth/garage/login', data, {
      skipAuth: true,
      skipAuthFailureHandler: true,
    }),
  resolveGarageByCode: (code) =>
    api.get(`/garages/by-code/${encodeURIComponent(code)}`, {
      skipAuth: true,
      skipAuthFailureHandler: true,
    }),
};

export const dealersAPI = createCrudAPI(api, '/dealers', {
  getAll: (params = {}) => api.get('/dealers', { params }),
  getById: (id) => api.get(`/dealers/${id}`),
  create: (data) => api.post('/dealers', data),
  update: (id, data) => api.put(`/dealers/${id}`, data),
  delete: (id) => api.delete(`/dealers/${id}`),
  getStats: () => api.get('/dealers/stats'),
  register: (data) => api.post('/auth/dealer/register', data),
  uploadAvatar: (id, file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post(`/dealers/${id}/upload-avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
});

export const customersAPI = createCrudAPI(api, '/customers', {
  getStats: () => api.get('/customers/stats'),
  register: (data) => api.post('/customers/register', data),
  login: (data) => api.post('/customers/login', data),
  updateProfile: (data) => api.put('/customers/profile', data),
  deleteAccount: (data) => api.delete('/customers/account', data),
  uploadAvatar: (id, file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post(`/customers/${id}/upload-avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getDriverLicense: (id) => api.get(`/customers/${id}/driver-license`),
  updateDriverLicense: (id, data) => api.put(`/customers/${id}/driver-license`, data),
  getVehiclesForGarage: ({ phone, garageCode }) =>
    api.get('/customers/vehicles', {
      params: {
        phone,
        garage_code: garageCode,
      },
    }),
  addVehicle: (id, data) => api.post(`/customers/${id}/vehicles`, data),
});

export const employeesAPI = createCrudAPI(api, '/employees', {
  getStats: () => api.get('/employees/stats'),
  login: (data) => api.post('/employees/login', data),
  getAssignedOrders: () => api.get('/employees/orders/assigned'),
  getOrders: () => api.get('/employees/orders'),
  getOrderById: (id) => api.get(`/employees/orders/${id}`),
  assignOrder: (data) => api.post('/employees/assign-order', data),
  uploadAvatar: (id, file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post(`/employees/${id}/upload-avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
});

export const servicesAPI = createCrudAPI(api, '/services', {
  create: (data) => api.post('/services/admin', data),
  update: (id, data) => api.put(`/services/admin/${id}`, data),
  delete: (id) => api.delete(`/services/admin/${id}`),
  getStats: () => api.get('/services/admin/stats'),
  uploadImage: (id, file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post(`/services/admin/${id}/upload-image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
});

export const productsAPI = createCrudAPI(api, '/products', {
  create: (data) => api.post('/products/admin', data),
  update: (id, data) => api.put(`/products/admin/${id}`, data),
  delete: (id) => api.delete(`/products/admin/${id}`),
  getStats: () => api.get('/products/admin/stats'),
  createImage: (data) => api.post('/products/images', data),
  getImages: (productId) => api.get(`/products/${productId}/images`),
  updateImage: (id, data) => api.put(`/products/images/${id}`, data),
  deleteImage: (id) => api.delete(`/products/images/${id}`),
});

export const dealerCategoriesAPI = createCrudAPI(api, '/dealer/categories', {
  getAll: (params = {}) => api.get('/dealer/categories', { params }),
  getById: (id) => api.get(`/dealer/categories/${id}`),
  create: (data) => api.post('/dealer/categories', data),
  update: (id, data) => api.put(`/dealer/categories/${id}`, data),
  delete: (id) => api.delete(`/dealer/categories/${id}`),
});

export const dealerProductsAPI = createCrudAPI(api, '/dealer/products', {
  getAll: (params = {}) => api.get('/dealer/products', { params }),
  getById: (id) => api.get(`/dealer/products/${id}`),
  create: (data) => api.post('/dealer/products', data),
  update: (id, data) => api.put(`/dealer/products/${id}`, data),
  delete: (id) => api.delete(`/dealer/products/${id}`),
  createImage: (data) => api.post('/dealer/products/images', data),
  getImages: (productId) => api.get(`/dealer/products/${productId}/images`),
  updateImage: (id, data) => api.put(`/dealer/products/images/${id}`, data),
  deleteImage: (id) => api.delete(`/dealer/products/images/${id}`),
});

export const serviceCategoriesAPI = createCrudAPI(api, '/service-categories', {
  create: (data) => api.post('/service-categories/admin', data),
  update: (id, data) => api.put(`/service-categories/admin/${id}`, data),
  delete: (id) => api.delete(`/service-categories/admin/${id}`),
  getStats: () => api.get('/service-categories/admin/stats'),
  uploadImage: (id, file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post(`/service-categories/admin/${id}/upload-image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
});

export const categoriesAPI = createCrudAPI(api, '/categories', {
  getAll: (params = {}) => api.get('/categories', { params }),
  create: (data) => api.post('/categories/admin', data),
  update: (id, data) => api.put(`/categories/admin/${id}`, data),
  delete: (id) => api.delete(`/categories/admin/${id}`),
  getStats: () => api.get('/categories/admin/stats'),
  uploadImage: (id, file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post(`/categories/admin/${id}/upload-image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
});

export const vehiclesAPI = createCrudAPI(api, '/vehicles', {
  getAll: (params = {}) => api.get('/vehicles/admin/all', { params }),
  getById: (id) =>
    requestWithFallback(
      () => api.get(`/vehicles/admin/${id}`),
      () => api.get(`/vehicles/${id}`)
    ),
  update: (id, data) => api.put(`/vehicles/admin/${id}`, data),
  delete: (id) => api.delete(`/vehicles/admin/${id}`),
  getStats: () => api.get('/vehicles/admin/stats'),
  uploadImage: (id, file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post(`/vehicles/admin/${id}/upload-image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  searchByPlate: (plate) => api.get('/vehicles/search', { params: { plate } }),
  getInspection: (vehicleId) => api.get(`/vehicles/${vehicleId}/inspection`),
  updateInspection: (vehicleId, data) => api.put(`/vehicles/${vehicleId}/inspection`, data),
  deleteInspection: (vehicleId) => api.delete(`/vehicles/${vehicleId}/inspection`),
});

export const serviceOrdersAPI = createCrudAPI(api, '/service-orders', {
  getStats: () => api.get('/service-orders/admin/stats'),
  updateStatus: (id, data) => api.put(`/service-orders/admin/${id}/status`, data),
  assign: (id, data) => api.patch(`/service-orders/admin/${id}/assign`, data),
  complete: (id, data) => api.patch(`/service-orders/admin/${id}/complete`, data),
  delete: (id) => api.delete(`/service-orders/admin/${id}`),
});

export const offersAPI = createCrudAPI(api, '/offers', {
  create: (data) => api.post('/offers/admin', data),
  update: (id, data) => api.put(`/offers/admin/${id}`, data),
  delete: (id) => api.delete(`/offers/admin/${id}`),
  getStats: () => api.get('/offers/admin/stats'),
  uploadImage: (id, file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post(`/offers/admin/${id}/upload-image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  createImage: (data) => api.post('/offers/images', data),
  getImages: (offerId) => api.get(`/offers/${offerId}/images`),
  updateImage: (id, data) => api.put(`/offers/images/${id}`, data),
  deleteImage: (id) => api.delete(`/offers/images/${id}`),
});

export const warrantiesAPI = createCrudAPI(api, '/warranties', {
  getAll: (params) => api.get('/warranties', { params }),
  create: (data) => api.post('/warranties', data),
  update: (id, data) => api.put(`/warranties/${id}`, data),
  delete: (id) => api.delete(`/warranties/${id}`),
  getStats: () => api.get('/warranties/stats'),
});

export const uploadAPI = {
  single: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/upload/single', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  multiple: (files) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    return api.post('/upload/multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  delete: (filename) => api.delete(`/upload/${filename}`),
};

export const serviceOrderImagesAPI = {
  getByOrder: (orderId) => api.get(`/service-order-images/${orderId}`),
  create: (data) => api.post('/service-order-images', data),
  delete: (id) => api.delete(`/service-order-images/${id}`),
};

export const notificationsAPI = {
  getUserNotifications: (params) => api.get('/notifications', { params }),
  getUnreadCount: (params) => api.get('/notifications/unread-count', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: (data) => api.put('/notifications/read-all', data),
  delete: (id) =>
    requestWithFallback(
      () => api.delete(`/admin/notifications/${id}`),
      () => api.delete(`/notifications/${id}`)
    ),
  getAll: (params) =>
    requestWithFallback(
      () => api.get('/admin/notifications', { params }),
      () => api.get('/notifications/admin/all', { params })
    ),
  send: (data) =>
    requestWithFallback(
      () => api.post('/admin/notifications', data),
      () => api.post('/notifications/send', data)
    ),
  getStats: () =>
    requestWithFallback(
      () => api.get('/admin/notifications/stats'),
      () => api.get('/notifications/admin/stats')
    ),
  getAdminLogs: (params) =>
    requestWithFallback(
      () => api.get('/admin/notifications', { params }),
      () => api.get('/notifications/admin/all', { params })
    ),
  getCustomers: () => api.get('/customers', { params: { limit: 1000 } }),
  getEmployees: () => api.get('/employees', { params: { limit: 1000 } }),
};

export const fcmTokensAPI = {
  register: (data) => api.post('/fcm-tokens/register', data),
  refresh: (data) => api.post('/fcm-tokens/refresh', data),
  getUserTokens: (params) => api.get('/fcm-tokens/user', { params }),
  delete: (data) => api.delete('/fcm-tokens', { data }),
  getActive: () => api.get('/fcm-tokens/active'),
  deactivateInactive: () => api.post('/fcm-tokens/deactivate-inactive'),
  cleanup: () => api.delete('/fcm-tokens/cleanup'),
  getStats: () => api.get('/fcm-tokens/stats'),
};

export const serviceReminderConfigsAPI = {
  getAll: (params) => api.get('/admin/service-reminder-configs', { params }),
  upsert: (serviceId, data) => api.put(`/admin/service-reminder-configs/${serviceId}`, data),
  setEnabled: (serviceId, enabled) => api.patch(`/admin/service-reminder-configs/${serviceId}/enabled`, { enabled }),
};

export const adminNotificationsAPI = {
  getAll: (params) => notificationsAPI.getAll(params),
  delete: (id) => notificationsAPI.delete(id),
  send: (data) => notificationsAPI.send(data),
  getStats: () => notificationsAPI.getStats(),
};

export const pushNotificationsAPI = {
  sendToUser: (data) => api.post('/push-notifications/send-to-user', data),
  sendToAll: (data) => api.post('/push-notifications/send-to-all', data),
  sendToTopic: (data) => api.post('/push-notifications/send-to-topic', data),
  test: (data) => api.post('/push-notifications/test', data),
  getHealth: () => api.get('/push-notifications/health'),
  getStats: () => api.get('/push-notifications/stats'),
};

export const systemAPI = {
  health: () => api.get('/health'),
  docs: () => api.get('/api-docs'),
};

export default api;
 
// hello world