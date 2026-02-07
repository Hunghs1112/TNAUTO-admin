// src/hooks/useApiCache.js
import { useRef, useCallback } from 'react';

/**
 * Custom hook để cache API responses
 * @param {number} ttl - Time to live (ms), default 5 minutes
 * @returns {Object} - Cache utilities
 */
export function useApiCache(ttl = 5 * 60 * 1000) {
  const cacheRef = useRef(new Map());

  const getCacheKey = useCallback((url, params = {}) => {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${JSON.stringify(params[key])}`)
      .join('&');
    return `${url}?${sortedParams}`;
  }, []);

  const get = useCallback((url, params = {}) => {
    const key = getCacheKey(url, params);
    const cached = cacheRef.current.get(key);
    
    if (!cached) return null;
    
    const now = Date.now();
    if (now - cached.timestamp > ttl) {
      cacheRef.current.delete(key);
      return null;
    }
    
    return cached.data;
  }, [getCacheKey, ttl]);

  const set = useCallback((url, params = {}, data) => {
    const key = getCacheKey(url, params);
    cacheRef.current.set(key, {
      data,
      timestamp: Date.now()
    });
  }, [getCacheKey]);

  const clear = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  const invalidate = useCallback((url, params = {}) => {
    const key = getCacheKey(url, params);
    cacheRef.current.delete(key);
  }, [getCacheKey]);

  return { get, set, clear, invalidate };
}


