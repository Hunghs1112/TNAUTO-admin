// src/pages/Services.jsx
import GenericCrudPage from '../components/GenericCrudPage';
import { servicesAPI } from '../services/api';
import { servicesConfig } from '../config/entityConfigs.jsx';

export default function Services() {
  return (
    <GenericCrudPage
      api={servicesAPI}
      columns={servicesConfig.columns}
      fieldsForModal={servicesConfig.fieldsForModal}
      title={servicesConfig.title}
    />
  );
}