import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import GenericCrudPage from '../components/features/GenericCrudPage';
import { categoriesConfig } from '../config/entityConfigs.jsx';
import { categoriesAPI } from '../services/api';
import { normalizeImageUrl } from '../utils/format';

function Categories() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const handleProductCategoryChange = () => {
      setRefreshTrigger((prev) => prev + 1);
    };

    const lastChange = sessionStorage.getItem('productCategoryChanged');
    if (lastChange) {
      const timeSinceChange = Date.now() - parseInt(lastChange, 10);
      if (timeSinceChange < 5000) {
        setRefreshTrigger((prev) => prev + 1);
        sessionStorage.removeItem('productCategoryChanged');
      }
    }

    window.addEventListener('productCategoryChanged', handleProductCategoryChange);

    return () => {
      window.removeEventListener('productCategoryChanged', handleProductCategoryChange);
    };
  }, []);

  const transformData = useCallback((data) => {
    return data.map((category) => {
      const result = { ...category };
      if (category.image_url) {
        const normalized = normalizeImageUrl(category.image_url);
        result.image_url = normalized || category.image_url;
      }
      return result;
    });
  }, []);

  const options = useMemo(
    () => ({
      transformData,
    }),
    [transformData]
  );

  return (
    <GenericCrudPage
      api={categoriesAPI}
      columns={categoriesConfig.columns}
      fieldsForModal={categoriesConfig.fieldsForModal}
      title={categoriesConfig.title}
      showPagination={true}
      limit={20}
      showSearch={true}
      searchPlaceholder="Tìm theo tên danh mục..."
      options={options}
      refreshTrigger={refreshTrigger}
    />
  );
}

export default memo(Categories);
