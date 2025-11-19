// src/pages/Customers.jsx
import { memo } from 'react';
import GenericCrudPage from '../components/features/GenericCrudPage';
import { customersAPI } from '../services/api';
import { customersConfig } from '../config/entityConfigs.jsx';

function Customers() {
  return (
    <GenericCrudPage
      api={customersAPI}
      columns={customersConfig.columns}
      fieldsForModal={customersConfig.fieldsForModal}
      title={customersConfig.title}
      showDelete={false} // Admin không xóa khách hàng
    />
  );
}

export default memo(Customers);