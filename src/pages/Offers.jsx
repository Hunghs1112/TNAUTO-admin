// src/pages/Offers.jsx
import GenericCrudPage from '../components/features/GenericCrudPage';
import { offersAPI } from '../services/api';
import { offersConfig } from '../config/entityConfigs.jsx';

export default function Offers() {
  return (
    <GenericCrudPage
      api={offersAPI}
      columns={offersConfig.columns}
      fieldsForModal={offersConfig.fieldsForModal}
      title={offersConfig.title}
    />
  );
}