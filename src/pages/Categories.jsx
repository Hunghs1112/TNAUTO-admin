// src/pages/Categories.jsx
import GenericCrudPage from '../components/GenericCrudPage';
import { categoriesAPI } from '../services/api';
import { categoriesConfig } from '../config/entityConfigs.jsx';

export default function Categories() {
  return (
    <GenericCrudPage
      api={categoriesAPI}
      columns={categoriesConfig.columns}
      fieldsForModal={categoriesConfig.fieldsForModal}
      title={categoriesConfig.title}
    />
  );
}

