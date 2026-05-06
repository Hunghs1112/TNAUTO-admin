// src/pages/Employees.jsx
import { memo } from 'react';
import GenericCrudPage from '../components/features/GenericCrudPage';
import { employeesAPI } from '../services/api';
import { employeesConfig } from '../config/entityConfigs.jsx';

function Employees() {
  return (
    <GenericCrudPage
      api={employeesAPI}
      columns={employeesConfig.columns}
      fieldsForModal={employeesConfig.fieldsForModal}
      title={employeesConfig.title}
      showPagination={true}
      limit={20}
      showSearch={true}
      searchPlaceholder="Tìm theo tên, SĐT, email, vai trò..."
    />
  );
}

export default memo(Employees);


