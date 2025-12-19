// src/pages/Services.jsx
import { useState, memo, useCallback } from 'react';
import GenericCrudPage from '../components/features/GenericCrudPage';
import ServiceDetailModal from '../components/features/ServiceDetailModal';
import { servicesAPI } from '../services/api';
import { servicesConfig } from '../config/entityConfigs.jsx';

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
    setRefreshKey(prev => prev + 1);
  }, []);

  return (
    <>
      <GenericCrudPage
        key={refreshKey}
        api={servicesAPI}
        columns={servicesConfig.columns}
        fieldsForModal={servicesConfig.fieldsForModal}
        title={servicesConfig.title}
        showActions={true}
        onView={handleViewService}
        onEdit={handleViewService}
        onRowClick={handleViewService}
      />

      {/* Service Detail Modal - Form riêng cho dịch vụ với quản lý ảnh */}
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