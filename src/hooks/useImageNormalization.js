// src/hooks/useImageNormalization.js
import { useMemo } from 'react';
import { normalizeImageUrl, isValidImageUrl } from '../utils/format';

/**
 * Hook để normalize image URLs trong data
 * Tái sử dụng cho các trang có transformData giống nhau
 */
export function useImageNormalization(data, imageField = 'image_url') {
  return useMemo(() => {
    if (!Array.isArray(data)) return data;
    
    return data.map(item => {
      if (!item[imageField]) return item;
      
      const normalized = normalizeImageUrl(item[imageField]);
      return {
        ...item,
        [imageField]: normalized || item[imageField]
      };
    });
  }, [data, imageField]);
}

/**
 * Hook để normalize multiple image URLs (array)
 */
export function useMultipleImageNormalization(data, imageField = 'image_urls') {
  return useMemo(() => {
    if (!Array.isArray(data)) return data;
    
    return data.map(item => {
      if (!item[imageField] || !Array.isArray(item[imageField])) return item;
      
      const normalizedUrls = item[imageField]
        .filter(url => url && isValidImageUrl(url))
        .map(url => normalizeImageUrl(url))
        .filter(url => url !== null);
      
      return {
        ...item,
        [imageField]: normalizedUrls
      };
    });
  }, [data, imageField]);
}

