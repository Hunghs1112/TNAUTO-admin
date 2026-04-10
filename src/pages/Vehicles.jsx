import { memo, useCallback, useMemo, useState } from 'react';
import GenericCrudPage from '../components/features/GenericCrudPage';
import VehicleDetailModal from '../components/features/VehicleDetailModal';
import { vehiclesConfig } from '../config/entityConfigs.jsx';
import { vehiclesAPI } from '../services/api';
import { normalizeVehicleResponse } from '../utils/vehicleDocuments';

const vehicleFormFields = [
  {
    name: 'customer_id',
    label: 'Khách hàng',
    type: 'select',
    required: true,
    searchable: true,
    apiEndpoint: '/customers',
    valueKey: 'id',
    labelKey: 'name',
    labelFormat: (item) => `${item.name || 'Khách hàng'}${item.phone ? ` - ${item.phone}` : ''}`,
    placeholder: 'Tìm theo tên hoặc số điện thoại',
  },
  { name: 'license_plate', label: 'Biển số xe', type: 'text', required: true },
  { name: 'model', label: 'Mẫu xe', type: 'text' },
  { name: 'image_url', label: 'Hình ảnh xe', type: 'image', multiple: false, maxFiles: 1, uploadMode: 'both' },
  { name: 'registration_section', label: 'Đăng ký xe', type: 'section' },
  { name: 'registration_number', label: 'Số đăng ký', type: 'text' },
  { name: 'registration_owner_name', label: 'Chủ xe', type: 'text' },
  { name: 'registration_issued_date', label: 'Ngày cấp', type: 'date' },
  { name: 'inspection_section', label: 'Đăng kiểm', type: 'section' },
  { name: 'inspection_certificate_no', label: 'Số chứng nhận đăng kiểm', type: 'text' },
  { name: 'inspection_last_date', label: 'Ngày đăng kiểm gần nhất', type: 'date' },
  { name: 'inspection_expiry_date', label: 'Ngày hết hạn đăng kiểm', type: 'date' },
  { name: 'insurance_section', label: 'Bảo hiểm', type: 'section' },
  { name: 'insurance_provider', label: 'Đơn vị bảo hiểm', type: 'text' },
  { name: 'insurance_policy_no', label: 'Số hợp đồng / policy', type: 'text' },
  { name: 'insurance_start_date', label: 'Ngày bắt đầu bảo hiểm', type: 'date' },
  { name: 'insurance_expiry_date', label: 'Ngày hết hạn bảo hiểm', type: 'date' },
];

function Vehicles() {
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const transformData = useCallback((data) => {
    return data.map((vehicle) => normalizeVehicleResponse(vehicle));
  }, []);

  const handleError = useCallback((error) => {
    console.error('Vehicles error:', error);
  }, []);

  const options = useMemo(
    () => ({
      transformData,
      onError: handleError,
    }),
    [transformData, handleError]
  );

  const openVehicle = useCallback((item) => {
    if (!item?.id) {
      return;
    }

    setSelectedVehicle(item);
    setIsDetailOpen(true);
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, []);

  return (
    <>
      <GenericCrudPage
        api={vehiclesAPI}
        columns={vehiclesConfig.columns}
        fieldsForModal={vehicleFormFields}
        title={vehiclesConfig.title}
        description="Quản lý xe đang được liên kết với khách hàng trong gara."
        showPagination={true}
        limit={20}
        showSearch={true}
        searchPlaceholder="Tìm biển số, mẫu xe, tên khách hàng..."
        disableCreate={false}
        createButtonText="Thêm xe"
        options={options}
        refreshTrigger={refreshKey}
        onView={openVehicle}
        onEdit={openVehicle}
        onRowClick={openVehicle}
      />

      <VehicleDetailModal
        isOpen={isDetailOpen}
        vehicle={selectedVehicle}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedVehicle(null);
        }}
        onRefresh={handleRefresh}
      />
    </>
  );
}

export default memo(Vehicles);
