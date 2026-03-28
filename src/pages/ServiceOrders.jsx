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
        description="Theo dõi đơn dịch vụ trong gara hiện tại, từ lúc tạo đơn đến khi giao nhân viên và hoàn tất xử lý. Backend tự scope theo token nên web không cần gửi garage_id."
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
