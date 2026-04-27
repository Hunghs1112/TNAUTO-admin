import { memo, useCallback, useRef } from 'react';
import ServiceOrderManagement from '../components/features/ServiceOrderManagement';
import PageHeader from '../components/layout/PageHeader';

function ServiceOrders() {
  const tableActionsRef = useRef(null);

  const handleRefresh = useCallback(() => {
    tableActionsRef.current?.refresh?.();
  }, []);

  const handleCreate = useCallback(() => {
    tableActionsRef.current?.openCreateModal?.();
  }, []);

  return (
    <div className="app-page">
      <PageHeader
        title="Đơn dịch vụ"
        description="Theo dõi và quản lý các đơn dịch vụ."
        onRefresh={handleRefresh}
        onCreate={handleCreate}
        createButtonText="Tạo đơn mới"
      />

      <div className="page-content">
        <ServiceOrderManagement tableActionsRef={tableActionsRef} />
      </div>
    </div>
  );
}

export default memo(ServiceOrders);


