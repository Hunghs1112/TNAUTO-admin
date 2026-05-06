import { memo } from 'react';
import GenericCrudPage from '../components/features/GenericCrudPage';
import { dealersConfig } from '../config/entityConfigs';
import { dealersAPI } from '../services/api';

function Dealers() {
  return (
    <GenericCrudPage
      api={dealersAPI}
      columns={dealersConfig.columns}
      fieldsForModal={dealersConfig.fieldsForModal}
      title={dealersConfig.title}
      showPagination={true}
      limit={20}
      showSearch={true}
      searchPlaceholder="Tìm theo tên / SĐT / email..."
    />
  );
}

export default memo(Dealers);



