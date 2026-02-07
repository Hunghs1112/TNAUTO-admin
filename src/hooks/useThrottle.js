// src/hooks/useThrottle.js
import { useRef, useCallback } from 'react';

/**
 * Custom hook để throttle function call
 * @param {Function} callback - Function cần throttle
 * @param {number} delay - Delay time (ms)
 * @returns {Function} - Throttled function
 */
export function useThrottle(callback, delay = 500) {
  const lastRun = useRef(Date.now());
  const timeoutRef = useRef(null);
  const callbackRef = useRef(callback);

  // Update callback ref khi callback thay đổi
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback((...args) => {
    const now = Date.now();
    const timeSinceLastRun = now - lastRun.current;

    if (timeSinceLastRun >= delay) {
      lastRun.current = now;
      callbackRef.current(...args);
    } else {
      // Schedule call sau khi delay đã trôi qua
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        lastRun.current = Date.now();
        callbackRef.current(...args);
      }, delay - timeSinceLastRun);
    }
  }, [delay]);
}


