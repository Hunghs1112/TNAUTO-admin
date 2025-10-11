// src/pages/Products.jsx
import GenericCrudPage from '../components/GenericCrudPage';
import { productsAPI } from '../services/api';
import { productsConfig } from '../config/entityConfigs.jsx';

export default function Products() {
  return (
    <GenericCrudPage
      api={productsAPI}
      columns={productsConfig.columns}
      fieldsForModal={productsConfig.fieldsForModal}
      title={productsConfig.title}
    />
  );
}