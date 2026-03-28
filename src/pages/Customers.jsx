import { memo, useState } from 'react';
import CustomerDetailModal from '../components/features/CustomerDetailModal';
import GenericCrudPage from '../components/features/GenericCrudPage';
import { customersConfig } from '../config/entityConfigs.jsx';
import { customersAPI } from '../services/api';

function Customers() {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  return (
    <>
      <GenericCrudPage
        api={customersAPI}
        columns={customersConfig.columns}
        fieldsForModal={customersConfig.fieldsForModal}
        title={customersConfig.title}
        description="Danh sách này chỉ gồm các khách hàng đã liên kết với gara đang đăng nhập. Mỗi khách có thể có nhiều xe riêng trong phần chi tiết."
        showPagination={true}
        limit={20}
        disableCreate={false}
        createButtonText="Thêm khách hàng"
        deleteConfig={{
          actionLabel: 'Gỡ khỏi gara',
          confirmTitle: 'Gỡ khách khỏi gara',
          confirmDescription: 'Khách hàng sẽ bị gỡ khỏi gara hiện tại, không xóa khỏi toàn hệ thống.',
          confirmButtonLabel: 'Gỡ khỏi gara',
          successMessage: 'Đã gỡ khách hàng khỏi gara hiện tại.',
        }}
        onView={(item) => {
          setSelectedCustomer(item || null);
          setIsDetailOpen(true);
        }}
        onRowClick={(item) => {
          setSelectedCustomer(item || null);
          setIsDetailOpen(true);
        }}
      />

      <CustomerDetailModal
        isOpen={isDetailOpen}
        customer={selectedCustomer}
        onCustomerChange={(nextCustomer) => {
          setSelectedCustomer(nextCustomer || null);
        }}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedCustomer(null);
        }}
      />
    </>
  );
}

export default memo(Customers);
