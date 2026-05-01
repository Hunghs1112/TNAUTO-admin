import { memo } from 'react';
import GenericCrudPage from '../components/features/GenericCrudPage';
import { garageManagersConfig } from '../config/entityConfigs.jsx';
import { garageManagersAPI } from '../services/api';

function GarageManagers() {
  return (
    <GenericCrudPage
      api={garageManagersAPI}
      columns={garageManagersConfig.columns}
      fieldsForModal={garageManagersConfig.fieldsForModal}
      title={garageManagersConfig.title}
      description="Quản lý tài khoản quản lí của từng gara, đảm bảo mỗi gara chỉ có một manager."
      options={{}}
      showPagination={true}
      limit={20}
      showSearch={true}
      searchPlaceholder="Tìm theo gara / tên / SĐT / email..."
    />
  );
}

export default memo(GarageManagers);
