// src/pages/Categories.jsx
import GenericCrudPage from '../components/features/GenericCrudPage';
import { categoriesAPI } from '../services/api';
import { categoriesConfig } from '../config/entityConfigs.jsx';
import { normalizeImageUrl } from '../utils/format';

export default function Categories() {
  return (
    <GenericCrudPage
      api={categoriesAPI}
      columns={categoriesConfig.columns}
      fieldsForModal={categoriesConfig.fieldsForModal}
      title={categoriesConfig.title}
      options={{
        transformData: (data) => {
          // Debug: Log raw data
          console.log('Categories raw data:', data);
          
          // Normalize image URLs
          const transformed = data.map(category => {
            if (category.image_url) {
              console.log('Category image_url before:', category.image_url);
              const normalized = normalizeImageUrl(category.image_url);
              console.log('Category image_url after:', normalized);
              return {
                ...category,
                image_url: normalized || category.image_url
              };
            }
            return category;
          });
          
          console.log('Categories transformed data:', transformed);
          return transformed;
        },
        onError: (error) => console.error('Categories error:', error)
      }}
    />
  );
}

