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
        showPagination={true}
        limit={20}
        showDelete={false}
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
