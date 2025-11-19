// src/pages/Offers.jsx
import { memo } from 'react';
import GenericCrudPage from '../components/features/GenericCrudPage';
import { offersAPI } from '../services/api';
import { offersConfig } from '../config/entityConfigs.jsx';

function Offers() {
  return (
    <GenericCrudPage
      api={offersAPI}
      columns={offersConfig.columns}
      fieldsForModal={offersConfig.fieldsForModal}
      title={offersConfig.title}
    />
  );
}

export default memo(Offers);