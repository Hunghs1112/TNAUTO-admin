// src/contexts/LoadingContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';

const LoadingContext = createContext();

/**
 * Global Loading Context Provider
 * Manages loading states across the entire application
 * Provides consistent loading UI and behavior
 */
export function LoadingProvider({ children }) {
  const [loadingStates, setLoadingStates] = useState({});
  const [globalLoading, setGlobalLoading] = useState(false);

  // Set loading state for a specific key
  const setLoading = useCallback((key, isLoading, message = '') => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: {
        loading: isLoading,
        message: message || 'Đang tải...'
      }
    }));
  }, []);

  // Get loading state for a specific key
  const getLoading = useCallback((key) => {
    return loadingStates[key] || { loading: false, message: 'Đang tải...' };
  }, [loadingStates]);

  // Check if any loading is active
  const isAnyLoading = useCallback(() => {
    return Object.values(loadingStates).some(state => state.loading) || globalLoading;
  }, [loadingStates, globalLoading]);

  // Clear all loading states
  const clearAllLoading = useCallback(() => {
    setLoadingStates({});
    setGlobalLoading(false);
  }, []);

  // Clear specific loading state
  const clearLoading = useCallback((key) => {
    setLoadingStates(prev => {
      const newStates = { ...prev };
      delete newStates[key];
      return newStates;
    });
  }, []);

  // Global loading controls
  const setGlobalLoadingState = useCallback((isLoading, message = 'Đang xử lý...') => {
    setGlobalLoading(isLoading);
    if (isLoading) {
      setLoadingStates({});
    }
  }, []);

  const value = {
    // Individual loading states
    setLoading,
    getLoading,
    clearLoading,
    
    // Global loading states
    globalLoading,
    setGlobalLoadingState,
    
    // Utility functions
    isAnyLoading,
    clearAllLoading,
    
    // All loading states for debugging
    loadingStates
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
}

/**
 * Hook to use loading context
 * Provides easy access to loading state management
 */
export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}

/**
 * Hook for specific loading key
 * Automatically manages loading state for a specific operation
 */
export function useLoadingKey(key, initialMessage = 'Đang tải...') {
  const { setLoading, getLoading, clearLoading } = useLoading();
  
  const loadingState = getLoading(key);
  
  const startLoading = useCallback((message) => {
    setLoading(key, true, message || initialMessage);
  }, [key, setLoading, initialMessage]);
  
  const stopLoading = useCallback(() => {
    setLoading(key, false);
  }, [key, setLoading]);
  
  const clearLoadingState = useCallback(() => {
    clearLoading(key);
  }, [key, clearLoading]);
  
  return {
    loading: loadingState.loading,
    message: loadingState.message,
    startLoading,
    stopLoading,
    clearLoadingState
  };
}

export default LoadingContext;
