// src/pages/Vehicles.jsx
import { memo, useCallback, useMemo, useState } from 'react';
import GenericCrudPage from '../components/features/GenericCrudPage';
import VehicleDetailModal from '../components/features/VehicleDetailModal';
import { vehiclesConfig } from '../config/entityConfigs.jsx';
import { vehiclesAPI } from '../services/api';

function Vehicles() {
  const [selectedVehicle, setSelectedVehicle] = useState(null);
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
        customer_name: vehicle.customer_name || vehicle.customer?.name || null,
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
        fieldsForModal={vehiclesConfig.fieldsForModal}
        title={vehiclesConfig.title}
        description="Danh sach nay chi hien thi xe thuoc gara hien tai. Them xe moi nen thuc hien tu chi tiet khach hang de di dung customer vehicle flow."
        showPagination={true}
        limit={20}
        showSearch={true}
        searchPlaceholder="Tim bien so, mau xe, ten KH..."
        disableCreate={true}
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
