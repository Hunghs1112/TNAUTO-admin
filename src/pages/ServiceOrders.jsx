// src/pages/ServiceOrders.jsx
import { useRef, memo, useCallback } from 'react';
import PageHeader from '../components/layout/PageHeader';
import ServiceOrderManagement from '../components/features/ServiceOrderManagement';

function ServiceOrders() {
  const tableActionsRef = useRef(null);

  const handleRefresh = useCallback(() => {
    tableActionsRef.current?.refresh?.();
  }, []);

  const handleCreate = useCallback(() => {
    tableActionsRef.current?.openCreateModal?.();
  }, []);

  return (
    <>
      <PageHeader
        title="Đơn dịch vụ"
        onRefresh={handleRefresh}
        onCreate={handleCreate}
      />
      
      <div className="page-content">
        <ServiceOrderManagement tableActionsRef={tableActionsRef} />
      </div>
    </>
  );
}

export default memo(ServiceOrders);