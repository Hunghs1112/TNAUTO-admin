// src/pages/Services.jsx
import { memo } from 'react';
import GenericCrudPage from '../components/features/GenericCrudPage';
import { servicesAPI } from '../services/api';
import { servicesConfig } from '../config/entityConfigs.jsx';

function Services() {
  return (
    <GenericCrudPage
      api={servicesAPI}
      columns={servicesConfig.columns}
      fieldsForModal={servicesConfig.fieldsForModal}
      title={servicesConfig.title}
    />
  );
}

export default memo(Services);