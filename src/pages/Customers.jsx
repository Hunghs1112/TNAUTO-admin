// src/pages/Customers.jsx
import { memo, useState } from 'react';
import GenericCrudPage from '../components/features/GenericCrudPage';
import { customersAPI } from '../services/api';
import { customersConfig } from '../config/entityConfigs.jsx';
import CustomerDetailModal from '../components/features/CustomerDetailModal';

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
        showDelete={false} // Admin không xóa khách hàng
        disableCreate={false}
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
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedCustomer(null);
        }}
      />
    </>
  );
}

export default memo(Customers);
