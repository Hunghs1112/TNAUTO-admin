import { useCallback, useRef } from 'react';

export default function useDetailFetchGuard() {
  const isFetchingRef = useRef(false);
  const loadedKeyRef = useRef(null);

  const shouldSkipFetch = useCallback((key, force = false) => {
    if (key === null || key === undefined || key === '') return true;
    if (!force && loadedKeyRef.current === key) return true;
    if (isFetchingRef.current && !force) return true;
    return false;
  }, []);

  const beginFetch = useCallback(() => {
    isFetchingRef.current = true;
  }, []);

  const completeFetch = useCallback((key) => {
    loadedKeyRef.current = key;
    isFetchingRef.current = false;
  }, []);

  const failFetch = useCallback(() => {
    loadedKeyRef.current = null;
    isFetchingRef.current = false;
  }, []);

  const resetFetchGuard = useCallback(() => {
    loadedKeyRef.current = null;
    isFetchingRef.current = false;
  }, []);

  return {
    shouldSkipFetch,
    beginFetch,
    completeFetch,
    failFetch,
    resetFetchGuard,
  };
}
