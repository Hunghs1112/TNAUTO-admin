// src/pages/ServiceCategories.jsx
import { memo, useCallback, useMemo } from 'react';
import GenericCrudPage from '../components/features/GenericCrudPage';
import { serviceCategoriesAPI } from '../services/api';
import { serviceCategoriesConfig } from '../config/entityConfigs.jsx';
import { normalizeImageUrl } from '../utils/format';

function ServiceCategories() {
  // Tạo transform function sử dụng normalizeImageUrl - memoized để tránh rerender
  const transformData = useCallback((data) => {
    return data.map(category => {
      if (category.image_url) {
        const normalized = normalizeImageUrl(category.image_url);
        return {
          ...category,
          image_url: normalized || category.image_url
        };
      }
      return category;
    });
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
    />
  );
}

export default memo(ServiceCategories);

