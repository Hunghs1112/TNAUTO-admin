// src/pages/Customers.jsx
import GenericCrudPage from '../components/features/GenericCrudPage';
import { customersAPI } from '../services/api';
import { customersConfig } from '../config/entityConfigs.jsx';

export default function Customers() {
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