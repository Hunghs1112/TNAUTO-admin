import axios from 'axios';
import { createCrudAPI } from './apiFactory';
import { buildVehiclePayload } from '../utils/vehicleDocuments';
import { clearAuthSession, getAuthToken } from './authStorage';


const API_BASE = import.meta.env.DEV
  ? '/api'
  : (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000/api');
const API_ROOT = API_BASE.replace(/\/api\/?$/, '');

function createApiClient(baseURL) {
  return axios.create({
    ...(baseURL ? { baseURL } : {}),
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000,
  });
}

const api = createApiClient(API_BASE);
const rootApi = createApiClient(API_ROOT);
const IS_DEV = import.meta.env.DEV;
const SERVICES_CACHE_TTL_MS = 3000;
let servicesListCache = {
  expiresAt: 0,
  items: null,
};

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

function sanitizeVehiclePayload(data = {}) {
  const payload = buildVehiclePayload(data);

  // Tenant scope is derived from bearer token on backend.
  // Never send override fields from web admin client.
  delete payload.garage_id;
  delete payload.garage_code;

  return payload;
}

async function fetchAllServices({ force = false } = {}) {
  if (!force && servicesListCache.items && servicesListCache.expiresAt > Date.now()) {
    return servicesListCache.items;
  }

  const pageSize = 50;
  const firstResponse = await api.get('/web/services', {
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
      api.get('/web/services', {
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
    const nextConfig = { ...config };
    const nextHeaders = nextConfig.headers || {};

    if (!nextConfig.skipAuth) {
      const token = getAuthToken();
      if (token && !nextHeaders.Authorization) {
        nextHeaders.Authorization = `Bearer ${token}`;
      }
    }

    nextConfig.headers = nextHeaders;

    if (IS_DEV) {
      const method = String(nextConfig.method || 'GET').toUpperCase();
      const requestUrl = `${nextConfig.baseURL || ''}${nextConfig.url || ''}`;
      console.log('[API Request]', {
        method,
        url: requestUrl,
        params: nextConfig.params || null,
        data: nextConfig.data || null,
      });
    }

    return nextConfig;
  });

  client.interceptors.response.use(
    (response) => {
      if (IS_DEV) {
        const method = String(response.config?.method || 'GET').toUpperCase();
        const responseUrl = `${response.config?.baseURL || ''}${response.config?.url || ''}`;
        console.log('[API Response]', {
          method,
          url: responseUrl,
          status: response.status,
          data: response.data,
        });
      }

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
      if (IS_DEV) {
        const method = String(error.config?.method || 'GET').toUpperCase();
        const errorUrl = `${error.config?.baseURL || ''}${error.config?.url || ''}`;
        console.log('[API Error]', {
          method,
          url: errorUrl,
          status: error.response?.status,
          code: error.code,
          responseData: error.response?.data || null,
          message: error.message,
        });
      }

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
    api.post('/web/auth/login', data, {
      skipAuth: true,
      skipAuthFailureHandler: true,
    }),
};

export const dealersAPI = createCrudAPI(api, '/web/dealers', {
  getAll: (params = {}) => api.get('/web/dealers', { params }),
  getById: (id) => api.get(`/web/dealers/${id}`),
  create: (data) => api.post('/web/dealers', data),
  update: (id, data) => api.put(`/web/dealers/${id}`, data),
  delete: (id) => api.delete(`/web/dealers/${id}`),
});

export const garagesAPI = createCrudAPI(api, '/web/garages', {
  getAll: (params = {}) => api.get('/web/garages', { params }),
  getById: (id) => api.get(`/web/garages/${id}`),
  create: (data) => api.post('/web/garages', data),
  update: (id, data) => api.put(`/web/garages/${id}`, data),
  delete: (id) => api.delete(`/web/garages/${id}`),
});

export const garageManagersAPI = createCrudAPI(api, '/web/garage-managers', {
  getAll: (params = {}) => api.get('/web/garage-managers', { params }),
  getById: (id) => api.get(`/web/garage-managers/${id}`),
  create: (data) => api.post('/web/garage-managers', data),
  update: (id, data) => api.put(`/web/garage-managers/${id}`, data),
  patch: (id, data) => api.patch(`/web/garage-managers/${id}`, data),
  delete: (id) => api.delete(`/web/garage-managers/${id}`),
});

export const customersAPI = createCrudAPI(api, '/web/customers', {
  getStats: () => api.get('/web/customers/stats'),
  uploadAvatar: (id, file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post(`/web/customers/${id}/upload-avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getDriverLicense: async (id) => {
    try {
      return await api.get(`/web/customers/${id}/driver-license`);
    } catch (requestError) {
      if (requestError?.status === 404) {
        return null;
      }
      throw requestError;
    }
  },
  updateDriverLicense: (id, data) => api.put(`/web/customers/${id}/driver-license`, data),
  deleteDriverLicense: (id) => api.delete(`/web/customers/${id}/driver-license`),
  getVehiclesForGarage: (id) => api.get(`/web/customers/${id}/vehicles`),
  addVehicle: (id, data) => api.post(`/web/customers/${id}/vehicles`, data),
});

export const employeesAPI = createCrudAPI(api, '/web/employees', {
  getStats: () => api.get('/web/employees/stats'),
  assignOrder: (data) => api.post('/web/employees/assign-order', data),
  uploadAvatar: (id, file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post(`/web/employees/${id}/upload-avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
});

export const servicesAPI = createCrudAPI(api, '/web/services', {
  getAll: async (params = {}) => {
    const services = await fetchAllServices();
    const filteredServices = sortServicesByNewest(services).filter((service) => matchesServiceSearch(service, params.search));
    return buildPaginatedResponse(filteredServices, params);
  },
  create: async (data) => {
    const response = await api.post('/web/services', data);
    invalidateServicesCache();
    return response;
  },
  update: async (id, data) => {
    const response = await api.put(`/web/services/${id}`, data);
    invalidateServicesCache();
    return response;
  },
  delete: async (id) => {
    const response = await api.delete(`/web/services/${id}`);
    invalidateServicesCache();
    return response;
  },
  getStats: () => api.get('/web/services/stats'),
  uploadImage: (id, file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post(`/web/services/${id}/upload-image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
});

export const productsAPI = createCrudAPI(api, '/web/products', {
  getAll: (params = {}) => api.get('/web/products', { params }),
  create: (data) => api.post('/web/products', data),
  update: (id, data) => api.put(`/web/products/${id}`, data),
  delete: (id) => api.delete(`/web/products/${id}`),
  getStats: () => api.get('/web/products/stats'),
  createImage: (data) => api.post('/web/products/images', data),
  getImages: (productId) => api.get(`/web/products/${productId}/images`),
  updateImage: (id, data) => api.put(`/web/products/images/${id}`, data),
  deleteImage: (id) => api.delete(`/web/products/images/${id}`),
});

export const dealerCategoriesAPI = createCrudAPI(api, '/web/categories', {
  getAll: (params = {}) => api.get('/web/categories', { params }),
  getById: (id) => api.get(`/web/categories/${id}`),
  create: (data) => api.post('/web/categories', data),
  update: (id, data) => api.put(`/web/categories/${id}`, data),
  delete: (id) => api.delete(`/web/categories/${id}`),
});

export const dealerProductsAPI = createCrudAPI(api, '/web/products', {
  getAll: (params = {}) => api.get('/web/products', { params }),
  getById: (id) => api.get(`/web/products/${id}`),
  create: (data) => api.post('/web/products', data),
  update: (id, data) => api.put(`/web/products/${id}`, data),
  delete: (id) => api.delete(`/web/products/${id}`),
  createImage: (data) => api.post('/web/products/images', data),
  getImages: (productId) => api.get(`/web/products/${productId}/images`),
  updateImage: (id, data) => api.put(`/web/products/images/${id}`, data),
  deleteImage: (id) => api.delete(`/web/products/images/${id}`),
});

export const serviceCategoriesAPI = createCrudAPI(api, '/web/service-categories', {
  getAll: (params = {}) => api.get('/web/service-categories', { params }),
  create: (data) => api.post('/web/service-categories', data),
  update: (id, data) => api.put(`/web/service-categories/${id}`, data),
  delete: (id) => api.delete(`/web/service-categories/${id}`),
  getStats: () => api.get('/web/service-categories/stats'),
  uploadImage: (id, file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post(`/web/service-categories/${id}/upload-image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
});

export const categoriesAPI = createCrudAPI(api, '/web/categories', {
  getAll: (params = {}) => api.get('/web/categories', { params }),
  create: (data) => api.post('/web/categories', data),
  update: (id, data) => api.put(`/web/categories/${id}`, data),
  delete: (id) => api.delete(`/web/categories/${id}`),
  getStats: () => api.get('/web/categories/stats'),
  uploadImage: (id, file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post(`/web/categories/${id}/upload-image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
});

export const vehiclesAPI = createCrudAPI(api, '/web/vehicles', {
  getAll: (params = {}) => api.get('/web/vehicles', { params }),
  getById: (id) => api.get(`/web/vehicles/${id}`),
  create: (data) => api.post('/web/vehicles', sanitizeVehiclePayload(data)),
  update: (id, data) => api.put(`/web/vehicles/${id}`, sanitizeVehiclePayload(data)),
  delete: (id) => api.delete(`/web/vehicles/${id}`),
  getStats: () => api.get('/web/vehicles/stats'),
  uploadImage: (id, file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post(`/web/vehicles/${id}/upload-image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
});

export const serviceOrdersAPI = createCrudAPI(api, '/web/service-orders', {
  getStats: () => api.get('/web/service-orders/stats'),
  updateStatus: (id, data) => api.put(`/web/service-orders/${id}/status`, data),
  assign: (id, data) => api.patch(`/web/service-orders/${id}/assign`, data),
  complete: (id, data) => api.patch(`/web/service-orders/${id}/complete`, data),
  delete: (id) => api.delete(`/web/service-orders/${id}`),
});

export const offersAPI = createCrudAPI(api, '/web/offers', {
  getAll: (params = {}) => api.get('/web/offers', { params }),
  create: (data) => api.post('/web/offers', data),
  update: (id, data) => api.put(`/web/offers/${id}`, data),
  delete: (id) => api.delete(`/web/offers/${id}`),
  getStats: () => api.get('/web/offers/stats'),
  uploadImage: (id, file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post(`/web/offers/${id}/upload-image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  createImage: (data) => api.post('/web/offers/images', data),
  getImages: (offerId) => api.get(`/web/offers/${offerId}/images`),
  updateImage: (id, data) => api.put(`/web/offers/images/${id}`, data),
  deleteImage: (id) => api.delete(`/web/offers/images/${id}`),
});

export const warrantiesAPI = createCrudAPI(api, '/web/warranties', {
  getAll: (params) => api.get('/web/warranties', { params }),
  create: (data) => api.post('/web/warranties', data),
  update: (id, data) => api.put(`/web/warranties/${id}`, data),
  delete: (id) => api.delete(`/web/warranties/${id}`),
  getStats: () => api.get('/web/warranties/stats'),
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
  getByOrder: (orderId) => api.get(`/web/service-orders/${orderId}/images`),
  create: (data) => api.post('/web/service-orders/images', data),
  update: (id, data) => api.put(`/web/service-orders/images/${id}`, data),
  delete: (id) => api.delete(`/web/service-orders/images/${id}`),
};

export const notificationsAPI = {
  delete: (id) => api.delete(`/web/notifications/${id}`),
  getAll: (params) => api.get('/web/notifications', { params }),
  send: (data) => api.post('/web/notifications', data),
  getStats: () => api.get('/web/notifications/stats'),
  getAdminLogs: (params) => api.get('/web/notifications', { params }),
  getCustomers: () => api.get('/web/customers', { params: { limit: 1000 } }),
  getEmployees: () => api.get('/web/employees', { params: { limit: 1000 } }),
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
  getAll: (params) => api.get('/web/settings/service-reminder-configs', { params }),
  upsert: (serviceId, data) => api.put(`/web/settings/service-reminder-configs/${serviceId}`, data),
  setEnabled: (serviceId, enabled) => api.patch(`/web/settings/service-reminder-configs/${serviceId}/enabled`, { enabled }),
};

export const uiVisibilityAPI = {
  get: () => api.get('/web/settings/ui-visibility'),
  update: (data) => api.put('/web/settings/ui-visibility', data),
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
