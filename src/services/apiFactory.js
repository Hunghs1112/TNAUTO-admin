// src/services/apiFactory.js
/**
 * Generic API factory to create CRUD API objects
 * Eliminates duplication in API service definitions
 * 
 * @param {Object} api - Axios instance
 * @param {string} endpoint - API endpoint (e.g., '/customers')
 * @param {Object} customMethods - Additional custom methods specific to this endpoint
 * @returns {Object} API object with CRUD methods
 */
export function createCrudAPI(api, endpoint, customMethods = {}) {
  const baseAPI = {
    getAll: (params) => {
      // Only add params if they exist and are not empty
      if (params && Object.keys(params).length > 0) {
        return api.get(endpoint, { params });
      }
      return api.get(endpoint);
    },
    getById: (id) => api.get(`${endpoint}/${id}`),
    create: (data) => api.post(endpoint, data),
    update: (id, data) => api.patch(`${endpoint}/${id}`, data),
    delete: (id) => api.delete(`${endpoint}/${id}`),
  };

  // Merge custom methods with base CRUD methods
  return { ...baseAPI, ...customMethods };
}

/**
 * Create an API with multipart/form-data support for file uploads
 */
export function createFileUploadAPI(api, endpoint, customMethods = {}) {
  return createCrudAPI(api, endpoint, {
    createWithFile: (data) => 
      api.post(endpoint, data, { 
        headers: { 'Content-Type': 'multipart/form-data' } 
      }),
    ...customMethods,
  });
}

