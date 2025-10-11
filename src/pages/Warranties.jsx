// src/pages/Warranties.jsx
import GenericCrudPage from '../components/GenericCrudPage';
import { warrantiesAPI } from '../services/api';
import { warrantiesConfig } from '../config/entityConfigs.jsx';

export default function Warranties() {
  return (
    <GenericCrudPage
      api={warrantiesAPI}
      columns={warrantiesConfig.columns}
      fieldsForModal={warrantiesConfig.fieldsForModal}
      title={warrantiesConfig.title}
    />
  );
}