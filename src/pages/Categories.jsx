// src/pages/Categories.jsx
import { memo, useCallback, useMemo } from 'react';
import GenericCrudPage from '../components/features/GenericCrudPage';
import { categoriesAPI } from '../services/api';
import { categoriesConfig } from '../config/entityConfigs.jsx';
import { normalizeImageUrl } from '../utils/format';

function Categories() {
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
    />
  );
}

export default memo(Categories);

