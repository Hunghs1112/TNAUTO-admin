// src/pages/Employees.jsx
import GenericCrudPage from '../components/GenericCrudPage';
import { employeesAPI } from '../services/api';
import { employeesConfig } from '../config/entityConfigs.jsx';

export default function Employees() {
  return (
    <GenericCrudPage
      api={employeesAPI}
      columns={employeesConfig.columns}
      fieldsForModal={employeesConfig.fieldsForModal}
      title={employeesConfig.title}
    />
  );
}