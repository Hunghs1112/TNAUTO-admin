// src/pages/Vehicles.jsx
import { memo, useCallback, useMemo } from 'react';
import GenericCrudPage from '../components/features/GenericCrudPage';
import { vehiclesAPI } from '../services/api';
import { vehiclesConfig } from '../config/entityConfigs.jsx';

function Vehicles() {
  const transformData = useCallback((data) => {
    // Transform data to ensure model and customer_name are available
    return data.map(vehicle => {
      // Check for model in various possible fields
      const modelValue = vehicle.model || 
                       vehicle.vehicle_model || 
                       vehicle.car_model || 
                       vehicle.model_name ||
                       vehicle.vehicle_type ||
                       null;
      
      return {
        ...vehicle,
        // Ensure model is present - use '-' if null
        model: modelValue || '-',
        // Ensure customer_name is present
        customer_name: vehicle.customer_name || (vehicle.customer && vehicle.customer.name) || null
      };
    });
  }, []);

  const handleError = useCallback((error) => {
    console.error('Vehicles error:', error);
  }, []);

  const options = useMemo(() => ({
    transformData,
    onError: handleError
  }), [transformData, handleError]);

  return (
    <GenericCrudPage
      api={vehiclesAPI}
      columns={vehiclesConfig.columns}
      fieldsForModal={vehiclesConfig.fieldsForModal}
      title={vehiclesConfig.title}
      showSearch={true}
      searchPlaceholder="Tìm biển số, mẫu xe, tên KH..."
      options={options}
    />
  );
}

export default memo(Vehicles);

