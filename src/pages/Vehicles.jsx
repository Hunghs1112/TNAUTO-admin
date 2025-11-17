// src/pages/Vehicles.jsx
import GenericCrudPage from '../components/features/GenericCrudPage';
import { vehiclesAPI } from '../services/api';
import { vehiclesConfig } from '../config/entityConfigs.jsx';

export default function Vehicles() {
  return (
    <GenericCrudPage
      api={vehiclesAPI}
      columns={vehiclesConfig.columns}
      fieldsForModal={vehiclesConfig.fieldsForModal}
      title={vehiclesConfig.title}
      showSearch={true}
      searchPlaceholder="Tìm biển số, mẫu xe, tên KH..."
      options={{
        // Custom API call for vehicles with search support
        transformData: (data) => {
          // Debug: Log raw data to check structure
          console.log('Vehicles raw data:', data);
          if (data.length > 0) {
            console.log('First vehicle sample:', data[0]);
            console.log('All vehicle keys:', Object.keys(data[0]));
          }
          
          // Transform data to ensure model and customer_name are available
          return data.map(vehicle => {
            // Check for model in various possible fields
            const modelValue = vehicle.model || 
                             vehicle.vehicle_model || 
                             vehicle.car_model || 
                             vehicle.model_name ||
                             vehicle.vehicle_type ||
                             null;
            
            if (!modelValue) {
              console.warn('Vehicle missing model. Available fields:', Object.keys(vehicle));
              console.warn('Vehicle data:', vehicle);
            }
            
            return {
              ...vehicle,
              // Ensure model is present - use '-' if null
              model: modelValue || '-',
              // Ensure customer_name is present
              customer_name: vehicle.customer_name || (vehicle.customer && vehicle.customer.name) || null
            };
          });
        },
        onError: (error) => console.error('Vehicles error:', error)
      }}
    />
  );
}

