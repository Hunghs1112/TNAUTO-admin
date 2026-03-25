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
        description="Theo dõi đơn chờ nhân viên nhận, đơn đã được web giao và toàn bộ tiến độ xử lý trong cùng một giao diện thống nhất."
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
