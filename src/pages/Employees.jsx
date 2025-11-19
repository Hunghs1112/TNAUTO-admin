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
    />
  );
}

export default memo(Employees);