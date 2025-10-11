// src/hooks/useEntityCrud.js
import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for managing CRUD operations for any entity
 * Eliminates code duplication across all page components
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
  } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasFetched, setHasFetched] = useState(false);

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

  // Fetch all entities
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAll();
      const fetchedData = res.data.data || res.data || [];
      const transformed = transformDataRef.current(fetchedData);
      setData(transformed);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err);
      setData(initialDataRef.current);
      onErrorRef.current(err);
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Auto-fetch on mount only - runs once
  useEffect(() => {
    if (!hasFetched) {
      fetchData();
      setHasFetched(true);
    }
  }, []);

  // Refresh handler
  const handleRefresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Delete handler
  const handleDelete = useCallback(async (id) => {
    try {
      await api.delete(id);
      setData((prevData) => prevData.filter((item) => item.id !== id));
    } catch (err) {
      console.error('Delete error:', err);
      onErrorRef.current(err);
      // Refresh to ensure data consistency
      fetchData();
    }
  }, [api, fetchData]);

  // Create handler
  const handleCreate = useCallback(async (newData) => {
    try {
      await api.create(newData);
      fetchData(); // Refresh to get updated data
    } catch (err) {
      console.error('Create error:', err);
      onErrorRef.current(err);
      throw err; // Re-throw to allow caller to handle
    }
  }, [api, fetchData]);

  // Update handler
  const handleUpdate = useCallback(async (id, updatedData) => {
    try {
      await api.update(id, updatedData);
      fetchData(); // Refresh to get updated data
    } catch (err) {
      console.error('Update error:', err);
      onErrorRef.current(err);
      throw err; // Re-throw to allow caller to handle
    }
  }, [api, fetchData]);

  return {
    data,
    loading,
    error,
    fetchData,
    handleRefresh,
    handleDelete,
    handleCreate,
    handleUpdate,
  };
}

