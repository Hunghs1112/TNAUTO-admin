// src/pages/Vehicles.jsx
import { memo, useCallback, useMemo, useState } from 'react';
import GenericCrudPage from '../components/features/GenericCrudPage';
import { vehiclesAPI } from '../services/api';
import { vehiclesConfig } from '../config/entityConfigs.jsx';
import VehicleDetailModal from '../components/features/VehicleDetailModal';

function Vehicles() {
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const transformData = useCallback((data) => {
    return data.map((vehicle) => {
      const modelValue =
        vehicle.model ||
        vehicle.vehicle_model ||
        vehicle.car_model ||
        vehicle.model_name ||
        vehicle.vehicle_type ||
        null;

      return {
        ...vehicle,
        model: modelValue || '-',
        customer_name: vehicle.customer_name || (vehicle.customer && vehicle.customer.name) || null,
      };
    });
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
    const id = item?.id;
    if (!id) return;
    setSelectedVehicleId(id);
    setIsDetailOpen(true);
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <>
      <GenericCrudPage
        api={vehiclesAPI}
        columns={vehiclesConfig.columns}
        fieldsForModal={vehiclesConfig.fieldsForModal}
        title={vehiclesConfig.title}
        description="Mỗi khách hàng có thể có nhiều xe. Danh sách này phản ánh các xe gắn với khách thuộc phạm vi gara hiện tại."
        showPagination={true}
        limit={20}
        showSearch={true}
        searchPlaceholder="Tìm biển số, mẫu xe, tên KH..."
        options={options}
        refreshTrigger={refreshKey}
        onView={openVehicle}
        onEdit={openVehicle}
        onRowClick={openVehicle}
      />

      <VehicleDetailModal
        isOpen={isDetailOpen}
        vehicleId={selectedVehicleId}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedVehicleId(null);
        }}
        onRefresh={handleRefresh}
      />
    </>
  );
}

export default memo(Vehicles);
