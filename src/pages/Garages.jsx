import { memo } from 'react';
import GenericCrudPage from '../components/features/GenericCrudPage';
import { garagesConfig } from '../config/entityConfigs';
import { garagesAPI } from '../services/api';

function Garages() {
  return (
    <GenericCrudPage
      api={garagesAPI}
      columns={garagesConfig.columns}
      fieldsForModal={garagesConfig.fieldsForModal}
      title={garagesConfig.title}
      showPagination={true}
      limit={20}
      showSearch={true}
      searchPlaceholder="Tìm theo mã gara / tên / SĐT / email..."
    />
  );
}

export default memo(Garages);
