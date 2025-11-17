// src/hooks/useEntityCrud.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { useLoadingKey } from '../contexts/LoadingContext';

/**
 * Custom hook for managing CRUD operations for any entity
 * Eliminates code duplication across all page components
 * Now uses global loading context for consistent loading states
 * 
 * @param {Object} api - API object with CRUD methods (getAll, create, update, delete)
 * @param {Object} options - Configuration options
 * @returns {Object} State and handlers for entity management
 */
export default function useEntityCrud(api, options = {}) {
  const {
    transformData = (data) => data, // Transform data after fetching
    onError = (error) => console.error('Error:', error), // Error handler
    initialData = [],
    loadingKey = 'entity-crud', // Unique key for loading state
  } = options;

  const [data, setData] = useState(initialData);
  const [error, setError] = useState(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Use global loading context
  const { startLoading, stopLoading } = useLoadingKey(loadingKey, 'Đang tải dữ liệu...');

  // Use refs to keep stable references to functions
  const transformDataRef = useRef(transformData);
  const onErrorRef = useRef(onError);
  const initialDataRef = useRef(initialData);

  // Update refs when values change
  useEffect(() => {
    transformDataRef.current = transformData;
    onErrorRef.current = onError;
    initialDataRef.current = initialData;
  }, [transformData, onError, initialData]);

  // Fetch all entities - optimized with proper response handling
  const fetchData = useCallback(async (isRefresh = false) => {
    // Nếu là refresh và đã có data, chỉ set isRefreshing để hiển thị overlay
    // KHÔNG clear data để tránh chớp trắng
    const hasExistingData = data.length > 0;
    
    if (isRefresh && hasExistingData) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    startLoading('Đang tải dữ liệu...');
    setError(null);
    
    try {
      const res = await api.getAll();
      console.log('[useEntityCrud] API response:', res);
      console.log('[useEntityCrud] Response data:', res.data);
      
      // Handle response format: { success: true, data: [...], count, total, page, limit }
      let fetchedData = [];
      if (res.data) {
        if (Array.isArray(res.data.data)) {
          fetchedData = res.data.data;
        } else if (Array.isArray(res.data)) {
          fetchedData = res.data;
        } else if (res.data.data && Array.isArray(res.data.data)) {
          fetchedData = res.data.data;
        }
      }
      
      console.log('[useEntityCrud] Extracted data:', fetchedData);
      console.log('[useEntityCrud] Data length:', fetchedData.length);
      
      const transformed = transformDataRef.current(fetchedData);
      console.log('[useEntityCrud] Transformed data:', transformed);
      console.log('[useEntityCrud] Transformed length:', transformed?.length);
      
      // Always update data when refreshing or fetching
      // Remove the condition that prevents updating on refresh
      setData(transformed || []);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err);
      // Khi refresh, KHÔNG reset data để tránh chớp trắng
      // Chỉ reset nếu là lần đầu load
      if (!isRefresh && !hasExistingData) {
        setData(initialDataRef.current);
      }
      onErrorRef.current(err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      stopLoading();
    }
  }, [api, startLoading, stopLoading, data]);

  // Auto-fetch on mount only - runs once
  useEffect(() => {
    if (!hasFetched) {
      fetchData();
      setHasFetched(true);
    }
  }, []);

  // Refresh handler
  const handleRefresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  // Delete handler
  const handleDelete = useCallback(async (id) => {
    try {
      setLoading(true);
      startLoading('Đang xóa...');
      await api.delete(id);
      setData((prevData) => prevData.filter((item) => item.id !== id));
    } catch (err) {
      console.error('Delete error:', err);
      onErrorRef.current(err);
      // Refresh to ensure data consistency
      fetchData();
    } finally {
      setLoading(false);
      stopLoading();
    }
  }, [api, fetchData, startLoading, stopLoading]);

  // Create handler
  const handleCreate = useCallback(async (newData) => {
    try {
      setLoading(true);
      startLoading('Đang tạo mới...');
      await api.create(newData);
      await fetchData(); // Refresh to get updated data
    } catch (err) {
      console.error('Create error:', err);
      onErrorRef.current(err);
      throw err; // Re-throw to allow caller to handle
    } finally {
      setLoading(false);
      stopLoading();
    }
  }, [api, fetchData, startLoading, stopLoading]);

  // Update handler
  const handleUpdate = useCallback(async (id, updatedData) => {
    try {
      setLoading(true);
      startLoading('Đang cập nhật...');
      await api.update(id, updatedData);
      await fetchData(); // Refresh to get updated data
    } catch (err) {
      console.error('Update error:', err);
      onErrorRef.current(err);
      throw err; // Re-throw to allow caller to handle
    } finally {
      setLoading(false);
      stopLoading();
    }
  }, [api, fetchData, startLoading, stopLoading]);

  // Search handler - optimized with proper response handling
  const handleSearch = useCallback(async (searchTerm) => {
    setLoading(true);
    startLoading('Đang tìm kiếm...');
    setError(null);
    try {
      let res;
      if (api.getAllAdmin) {
        const params = searchTerm ? { search: searchTerm } : {};
        res = await api.getAllAdmin(params);
      } else if (searchTerm) {
        res = await api.getAll({ search: searchTerm });
      } else {
        res = await api.getAll();
      }
      // Handle response format properly
      let fetchedData = [];
      if (res.data) {
        if (Array.isArray(res.data.data)) {
          fetchedData = res.data.data;
        } else if (Array.isArray(res.data)) {
          fetchedData = res.data;
        } else if (res.data.data && Array.isArray(res.data.data)) {
          fetchedData = res.data.data;
        }
      }
      const transformed = transformDataRef.current(fetchedData);
      setData(transformed);
    } catch (err) {
      console.error('Search error:', err);
      setError(err);
      setData(initialDataRef.current);
      onErrorRef.current(err);
    } finally {
      setLoading(false);
      stopLoading();
    }
  }, [api, startLoading, stopLoading]);

  return {
    data,
    loading, // Local loading state for immediate UI feedback
    isRefreshing, // State để track khi đang refresh (đã có data)
    error,
    fetchData,
    handleRefresh,
    handleDelete,
    handleCreate,
    handleUpdate,
    handleSearch,
  };
}

