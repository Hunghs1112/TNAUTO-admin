import axios from 'axios';
import { createCrudAPI } from './apiFactory';
import { clearAuthSession, getAuthToken, getStoredGarageContext } from './authStorage';

import { buildVehiclePayload } from '../utils/vehicleDocuments';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://103.200.20.253:5000/api';
const API_ROOT = API_BASE.replace(/\/api\/?$/, '');
const GARAGE_SCOPED_PREFIXES = [
  '/services',
  '/service-categories',
  '/products',
  '/categories',
  '/offers',
  '/dealer/products',
  '/dealer/categories',
  '/vehicles',
];

function createApiClient(baseURL) {
  return axios.create({
    ...(baseURL ? { baseURL } : {}),
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000,
  });
}

const api = createApiClient(API_BASE);
const rootApi = createApiClient(API_ROOT);
const SERVICES_CACHE_TTL_MS = 3000;
let servicesListCache = {
  expiresAt: 0,
  items: null,
};

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

function extractRequestPath(url = '') {
  if (!url) {
    return '';
  }

  try {
    if (/^https?:\/\//i.test(url)) {
      return new URL(url).pathname.replace(/^\/api/, '');
    }
  } catch {
    // Ignore invalid URLs and keep the relative path.
  }

  return String(url).replace(/^\/api/, '');
}

function shouldAttachGarageScope(url) {
  const path = extractRequestPath(url);
  return GARAGE_SCOPED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

function appendGarageScope(config) {
  if (config?.skipGarageScope || !shouldAttachGarageScope(config?.url)) {
    return config;
  }

  const garage = getStoredGarageContext();
  if (garage.id === null && !garage.code) {
    return config;
  }

  const nextParams = { ...(config.params || {}) };
  if (nextParams.garage_id !== undefined || nextParams.garage_code !== undefined) {
    return config;
  }

  return {
    ...config,
    params: {
      ...nextParams,
      ...(garage.id !== null ? { garage_id: garage.id } : {}),
      ...(garage.code ? { garage_code: garage.code } : {}),
    },
  };
}

function extractListItems(response) {
  const raw = response?.data;

  if (Array.isArray(raw?.data)) {
    return raw.data;
  }

  if (Array.isArray(raw)) {
    return raw;
  }

  return [];
}

function extractPaginationMeta(response, fallbackPage = 1, fallbackLimit = 50, fallbackTotal = 0) {
  const raw = response?.data || {};
  const pagination = raw.pagination || {};
  const totalItems = Number(raw.total ?? pagination.totalItems ?? fallbackTotal ?? 0) || 0;
  const pageSize = Number(raw.limit ?? pagination.pageSize ?? fallbackLimit ?? 50) || fallbackLimit || 50;
  const totalPages =
    Number(raw.totalPages ?? pagination.totalPages ?? Math.max(1, Math.ceil(totalItems / Math.max(pageSize, 1)))) || 1;
  const currentPage = Number(raw.page ?? pagination.currentPage ?? fallbackPage ?? 1) || 1;

  return {
    totalItems,
    pageSize: Math.max(1, pageSize),
    totalPages: Math.max(1, totalPages),
    currentPage: Math.max(1, currentPage),
  };
}

function normalizeSearchText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .trim();
}

function collectSearchableStrings(value, bucket = []) {
  if (value === null || value === undefined) {
    return bucket;
  }

  if (Array.isArray(value)) {
    value.forEach((entry) => collectSearchableStrings(entry, bucket));
    return bucket;
  }

  if (typeof value === 'object') {
    Object.values(value).forEach((entry) => collectSearchableStrings(entry, bucket));
    return bucket;
  }

  bucket.push(String(value));
  return bucket;
}

function matchesServiceSearch(service, searchTerm) {
  const normalizedTerm = normalizeSearchText(searchTerm);
  if (!normalizedTerm) {
    return true;
  }

  const searchable = collectSearchableStrings({
    id: service?.id,
    name: service?.name,
    supplier_name: service?.supplier_name,
    description: service?.description,
    category_name: service?.category_name,
  });

  return searchable.some((entry) => normalizeSearchText(entry).includes(normalizedTerm));
}

function sortServicesByNewest(services) {
  return [...services].sort((left, right) => {
    const leftTime = left?.created_at ? new Date(left.created_at).getTime() : 0;
    const rightTime = right?.created_at ? new Date(right.created_at).getTime() : 0;

    if (rightTime !== leftTime) {
      return rightTime - leftTime;
    }

    return (Number(right?.id) || 0) - (Number(left?.id) || 0);
  });
}

function buildPaginatedResponse(items, params = {}) {
  const paginate = params?.paginate === true || params?.paginate === 'true';
  const requestedLimit = Number(params?.limit) || 10;
  const pageSize = Math.max(1, requestedLimit);
  const totalItems = items.length;
  const totalPages = paginate ? Math.max(1, Math.ceil(totalItems / pageSize)) : 1;
  const requestedPage = Math.max(1, Number(params?.page) || 1);
  const currentPage = paginate ? Math.min(requestedPage, totalPages) : 1;
  const startIndex = paginate ? (currentPage - 1) * pageSize : 0;
  const pageItems = paginate ? items.slice(startIndex, startIndex + pageSize) : items;

  return {
    data: {
      success: true,
      data: pageItems,
      total: totalItems,
      page: currentPage,
      limit: pageSize,
      totalPages,
      pagination: {
        isPaginated: paginate,
        currentPage,
        pageSize,
        totalItems,
        totalPages,
        hasNextPage: paginate ? currentPage < totalPages : false,
        hasPreviousPage: paginate ? currentPage > 1 : false,
      },
    },
  };
}

function invalidateServicesCache() {
  servicesListCache = {
    expiresAt: 0,
    items: null,
  };
}

async function fetchAllServices({ force = false } = {}) {
  if (!force && servicesListCache.items && servicesListCache.expiresAt > Date.now()) {
    return servicesListCache.items;
  }

  const pageSize = 50;
  const firstResponse = await api.get('/services', {
    params: {
      page: 1,
      limit: pageSize,
      paginate: true,
    },
  });

  const firstItems = extractListItems(firstResponse);
  const meta = extractPaginationMeta(firstResponse, 1, pageSize, firstItems.length);

  if (meta.totalPages <= 1) {
    servicesListCache = {
      expiresAt: Date.now() + SERVICES_CACHE_TTL_MS,
      items: firstItems,
    };
    return firstItems;
  }

  const responses = await Promise.all(
    Array.from({ length: meta.totalPages - 1 }, (_, index) =>
      api.get('/services', {
        params: {
          page: index + 2,
          limit: pageSize,
          paginate: true,
        },
      })
    )
  );

  const items = responses.reduce((allItems, response) => allItems.concat(extractListItems(response)), firstItems);
  servicesListCache = {
    expiresAt: Date.now() + SERVICES_CACHE_TTL_MS,
    items,
  };
  return items;
}

[api, rootApi].forEach((client) => {
  client.interceptors.request.use((config) => {
    const nextConfig = appendGarageScope({ ...config });
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

  client.interceptors.response.use(
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
});

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
  getDriverLicense: async (id) => {
    try {
      return await api.get(`/customers/${id}/driver-license`);
    } catch (requestError) {
      if (requestError?.status === 404) {
        return null;
      }

      throw requestError;
    }
  },
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
  getAll: async (params = {}) => {
    const services = await fetchAllServices();
    const filteredServices = sortServicesByNewest(services).filter((service) => matchesServiceSearch(service, params.search));
    return buildPaginatedResponse(filteredServices, params);
  },
  create: async (data) => {
    const response = await api.post('/services/admin', data);
    invalidateServicesCache();
    return response;
  },
  update: async (id, data) => {
    const response = await api.put(`/services/admin/${id}`, data);
    invalidateServicesCache();
    return response;
  },
  delete: async (id) => {
    const response = await api.delete(`/services/admin/${id}`);
    invalidateServicesCache();
    return response;
  },
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
  getAll: (params = {}) =>
    requestWithFallback(
      () => api.get('/products', { params }),
      () => api.get('/products/admin', { params })
    ),
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
  getAll: (params = {}) =>
    requestWithFallback(
      () => api.get('/service-categories', { params }),
      () => api.get('/service-categories/admin', { params })
    ),
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
  getAll: (params = {}) =>
    requestWithFallback(
      () => api.get('/categories', { params }),
      () => api.get('/categories/admin', { params })
    ),
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
      () => api.get(`/vehicles/${id}`),
      () => api.get(`/vehicles/admin/${id}`)
    ),
  create: (data) => api.post('/vehicles', buildVehiclePayload(data)),
  update: (id, data) => api.put(`/vehicles/admin/${id}`, buildVehiclePayload(data)),
  delete: (id) => api.delete(`/vehicles/admin/${id}`),
  getStats: () => api.get('/vehicles/admin/stats'),
  uploadImage: (id, file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post(`/vehicles/admin/${id}/upload-image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  searchByPlate: (plate) => api.get('/vehicles/search', { params: { license_plate: plate } }),
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
  getAll: (params = {}) =>
    requestWithFallback(
      () => api.get('/offers', { params }),
      () => api.get('/offers/admin', { params })
    ),
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
      () => api.post('/notifications/send', data),
      () => api.post('/admin/notifications', data)
    ),
  getStats: () =>
    requestWithFallback(
      () => api.get('/notifications/admin/stats'),
      () => api.get('/admin/notifications/stats')
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
  health: () => rootApi.get('/health'),
  docs: () => rootApi.get('/api-docs'),
};

export default api;
