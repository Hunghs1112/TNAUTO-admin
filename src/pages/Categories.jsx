// src/pages/Categories.jsx
import { memo, useCallback, useMemo, useState, useEffect } from 'react';
import GenericCrudPage from '../components/features/GenericCrudPage';
import { categoriesAPI } from '../services/api';
import { categoriesConfig } from '../config/entityConfigs.jsx';
import { normalizeImageUrl } from '../utils/format';

function Categories() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Listen for product category changes
  useEffect(() => {
    const handleProductCategoryChange = () => {
      console.log('[Categories] Product category changed event received');
      setRefreshTrigger(prev => {
        const newValue = prev + 1;
        console.log('[Categories] Updating refreshTrigger from', prev, 'to', newValue);
        return newValue;
      });
    };

    // Check if there was a recent change (stored in sessionStorage)
    const lastChange = sessionStorage.getItem('productCategoryChanged');
    if (lastChange) {
      const timeSinceChange = Date.now() - parseInt(lastChange, 10);
      // If change was within last 5 seconds, trigger refresh
      if (timeSinceChange < 5000) {
        console.log('[Categories] Detected recent category change, triggering refresh');
        setRefreshTrigger(prev => prev + 1);
        sessionStorage.removeItem('productCategoryChanged');
      }
    }

    window.addEventListener('productCategoryChanged', handleProductCategoryChange);
    
    return () => {
      window.removeEventListener('productCategoryChanged', handleProductCategoryChange);
    };
  }, []);

  // Tạo transform function sử dụng normalizeImageUrl - memoized để tránh rerender
  const transformData = useCallback((data) => {
    console.log('[Categories] Transforming data, input:', data);
    const transformed = data.map(category => {
      const result = { ...category };
      if (category.image_url) {
        const normalized = normalizeImageUrl(category.image_url);
        result.image_url = normalized || category.image_url;
      }
      // Ensure product_count is preserved
      if (category.product_count !== undefined) {
        console.log(`[Categories] Category ${category.id} (${category.name}) has product_count:`, category.product_count);
      }
      return result;
    });
    console.log('[Categories] Transformed data, output:', transformed);
    return transformed;
  }, []);

  const handleError = useCallback((error) => {
    console.error('Categories error:', error);
  }, []);

  const options = useMemo(() => ({
    transformData,
    onError: handleError
  }), [transformData, handleError]);

  return (
    <GenericCrudPage
      api={categoriesAPI}
      columns={categoriesConfig.columns}
      fieldsForModal={categoriesConfig.fieldsForModal}
      title={categoriesConfig.title}
      options={options}
      refreshTrigger={refreshTrigger}
    />
  );
}

export default memo(Categories);

