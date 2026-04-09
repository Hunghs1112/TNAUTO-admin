import { memo, useCallback, useState } from 'react';
import GenericCrudPage from '../components/features/GenericCrudPage';
import ServiceDetailModal from '../components/features/ServiceDetailModal';
import { servicesConfig } from '../config/entityConfigs.jsx';
import { servicesAPI } from '../services/api';

function Services() {
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleViewService = useCallback((item) => {
    setSelectedServiceId(item.id);
    setShowDetailModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowDetailModal(false);
    setSelectedServiceId(null);
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <>
      <GenericCrudPage
        api={servicesAPI}
        columns={servicesConfig.columns}
        fieldsForModal={servicesConfig.fieldsForModal}
        title={servicesConfig.title}
        description="Quản lý danh mục dịch vụ và thông tin chi tiết từng dịch vụ."
        showPagination={true}
        limit={12}
        refreshTrigger={refreshKey}
        showActions={true}
        onView={handleViewService}
        onEdit={handleViewService}
        onRowClick={handleViewService}
      />

      <ServiceDetailModal
        isOpen={showDetailModal}
        serviceId={selectedServiceId}
        onClose={handleCloseModal}
        onRefresh={handleRefresh}
      />
    </>
  );
}

export default memo(Services);
