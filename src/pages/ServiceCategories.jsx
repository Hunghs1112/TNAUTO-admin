// src/pages/ServiceCategories.jsx
import { memo, useCallback, useMemo, useState, useEffect } from 'react';
import GenericCrudPage from '../components/features/GenericCrudPage';
import { serviceCategoriesAPI } from '../services/api';
import { serviceCategoriesConfig } from '../config/entityConfigs.jsx';
import { normalizeImageUrl } from '../utils/format';

function ServiceCategories() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Listen for service category changes
  useEffect(() => {
    const handleServiceCategoryChange = () => {
      console.log('[ServiceCategories] Service category changed event received');
      setRefreshTrigger(prev => {
        const newValue = prev + 1;
        console.log('[ServiceCategories] Updating refreshTrigger from', prev, 'to', newValue);
        return newValue;
      });
    };

    // Check if there was a recent change (stored in sessionStorage)
    const lastChange = sessionStorage.getItem('serviceCategoryChanged');
    if (lastChange) {
      const timeSinceChange = Date.now() - parseInt(lastChange, 10);
      // If change was within last 5 seconds, trigger refresh
      if (timeSinceChange < 5000) {
        console.log('[ServiceCategories] Detected recent category change, triggering refresh');
        setRefreshTrigger(prev => prev + 1);
        sessionStorage.removeItem('serviceCategoryChanged');
      }
    }

    window.addEventListener('serviceCategoryChanged', handleServiceCategoryChange);
    
    return () => {
      window.removeEventListener('serviceCategoryChanged', handleServiceCategoryChange);
    };
  }, []);

  // Tạo transform function sử dụng normalizeImageUrl - memoized để tránh rerender
  const transformData = useCallback((data) => {
    console.log('[ServiceCategories] Transforming data, input:', data);
    const transformed = data.map(category => {
      const result = { ...category };
      if (category.image_url) {
        const normalized = normalizeImageUrl(category.image_url);
        result.image_url = normalized || category.image_url;
      }
      // Ensure service_count is preserved
      if (category.service_count !== undefined) {
        console.log(`[ServiceCategories] Category ${category.id} (${category.name}) has service_count:`, category.service_count);
      }
      return result;
    });
    console.log('[ServiceCategories] Transformed data, output:', transformed);
    return transformed;
  }, []);

  const handleError = useCallback((error) => {
    console.error('Service Categories error:', error);
  }, []);

  const options = useMemo(() => ({
    transformData,
    onError: handleError
  }), [transformData, handleError]);

  return (
    <GenericCrudPage
      api={serviceCategoriesAPI}
      columns={serviceCategoriesConfig.columns}
      fieldsForModal={serviceCategoriesConfig.fieldsForModal}
      title={serviceCategoriesConfig.title}
      options={options}
      refreshTrigger={refreshTrigger}
    />
  );
}

export default memo(ServiceCategories);

