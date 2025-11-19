// src/pages/Warranties.jsx
import { memo } from 'react';
import GenericCrudPage from '../components/features/GenericCrudPage';
import { warrantiesAPI } from '../services/api';
import { warrantiesConfig } from '../config/entityConfigs.jsx';

function Warranties() {
  return (
    <GenericCrudPage
      api={warrantiesAPI}
      columns={warrantiesConfig.columns}
      fieldsForModal={warrantiesConfig.fieldsForModal}
      title={warrantiesConfig.title}
    />
  );
}

export default memo(Warranties);