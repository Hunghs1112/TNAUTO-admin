import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import GenericCrudPage from '../components/features/GenericCrudPage';
import { serviceCategoriesConfig } from '../config/entityConfigs.jsx';
import { serviceCategoriesAPI } from '../services/api';
import { normalizeImageUrl } from '../utils/format';

function ServiceCategories() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const handleServiceCategoryChange = () => {
      setRefreshTrigger((prev) => prev + 1);
    };

    const lastChange = sessionStorage.getItem('serviceCategoryChanged');
    if (lastChange) {
      const timeSinceChange = Date.now() - parseInt(lastChange, 10);
      if (timeSinceChange < 5000) {
        setRefreshTrigger((prev) => prev + 1);
        sessionStorage.removeItem('serviceCategoryChanged');
      }
    }

    window.addEventListener('serviceCategoryChanged', handleServiceCategoryChange);

    return () => {
      window.removeEventListener('serviceCategoryChanged', handleServiceCategoryChange);
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
      api={serviceCategoriesAPI}
      columns={serviceCategoriesConfig.columns}
      fieldsForModal={serviceCategoriesConfig.fieldsForModal}
      title={serviceCategoriesConfig.title}
      showPagination={true}
      limit={20}
      options={options}
      refreshTrigger={refreshTrigger}
    />
  );
}

export default memo(ServiceCategories);
