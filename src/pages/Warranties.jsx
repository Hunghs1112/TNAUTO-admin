// src/pages/Warranties.jsx
import { memo, useCallback, useRef, useState, useEffect } from 'react';
import GenericCrudPage from '../components/features/GenericCrudPage';
import { warrantiesAPI, customersAPI, servicesAPI, employeesAPI } from '../services/api';
import { warrantiesConfig } from '../config/entityConfigs.jsx';

function Warranties() {
  // Cache để lưu mapping ID -> Name
  const [nameMaps, setNameMaps] = useState({
    customers: new Map(),
    services: new Map(),
    employees: new Map()
  });
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const mapsLoadingRef = useRef(false);

  // Load all mappings once - chỉ load 1 lần khi component mount
  useEffect(() => {
    if (mapsLoadingRef.current || mapsLoaded) return;
    
    mapsLoadingRef.current = true;
    
    const loadMappings = async () => {
      try {
        console.log('[Warranties] Loading name mappings...');
        // Load tất cả mappings cùng lúc với warranties để chỉ fetch 1 lần
        const [customersRes, servicesRes, employeesRes] = await Promise.all([
          customersAPI.getAll().catch((err) => {
            console.error('[Warranties] Error loading customers:', err);
            return { data: { data: [] } };
          }),
          servicesAPI.getAll().catch((err) => {
            console.error('[Warranties] Error loading services:', err);
            return { data: { data: [] } };
          }),
          employeesAPI.getAll().catch((err) => {
            console.error('[Warranties] Error loading employees:', err);
            return { data: { data: [] } };
          })
        ]);

        const customersMap = new Map();
        const servicesMap = new Map();
        const employeesMap = new Map();

        // Process customers
        const customersData = customersRes.data?.data || customersRes.data || [];
        if (Array.isArray(customersData)) {
          customersData.forEach(customer => {
            if (customer.id && customer.name) {
              customersMap.set(customer.id, customer.name);
            }
          });
          console.log(`[Warranties] Loaded ${customersMap.size} customers`);
        }

        // Process services
        const servicesData = servicesRes.data?.data || servicesRes.data || [];
        if (Array.isArray(servicesData)) {
          servicesData.forEach(service => {
            if (service.id && service.name) {
              servicesMap.set(service.id, service.name);
            }
          });
          console.log(`[Warranties] Loaded ${servicesMap.size} services`);
        }

        // Process employees
        const employeesData = employeesRes.data?.data || employeesRes.data || [];
        if (Array.isArray(employeesData)) {
          employeesData.forEach(employee => {
            if (employee.id && employee.name) {
              employeesMap.set(employee.id, employee.name);
            }
          });
          console.log(`[Warranties] Loaded ${employeesMap.size} employees`);
        }

        setNameMaps({
          customers: customersMap,
          services: servicesMap,
          employees: employeesMap
        });
        setMapsLoaded(true);
        console.log('[Warranties] Name mappings loaded successfully');
        // KHÔNG trigger refresh nữa - để GenericCrudPage tự fetch với mappings đã sẵn sàng
      } catch (error) {
        console.error('[Warranties] Error loading mappings:', error);
        // Set empty maps on error
        setNameMaps({
          customers: new Map(),
          services: new Map(),
          employees: new Map()
        });
        setMapsLoaded(true);
      } finally {
        mapsLoadingRef.current = false;
      }
    };

    loadMappings();
  }, []); // Chỉ chạy 1 lần khi mount

  // Transform function to add names to warranties
  const transformData = useCallback((data) => {
    if (!Array.isArray(data)) return data;
    
    return data.map(warranty => {
      const result = { ...warranty };
      
      // Add customer_name
      if (warranty.customer_id && nameMaps.customers.has(warranty.customer_id)) {
        result.customer_name = nameMaps.customers.get(warranty.customer_id);
      }
      
      // Add service_name
      if (warranty.service_id && nameMaps.services.has(warranty.service_id)) {
        result.service_name = nameMaps.services.get(warranty.service_id);
      }
      
      // Add employee_name
      if (warranty.employee_id && nameMaps.employees.has(warranty.employee_id)) {
        result.employee_name = nameMaps.employees.get(warranty.employee_id);
      }
      
      return result;
    });
  }, [nameMaps]);

  const handleError = useCallback((error) => {
    console.error('Warranties error:', error);
  }, []);

  const options = {
    transformData,
    onError: handleError
  };

  // Chỉ render GenericCrudPage khi mappings đã load xong để tránh fetch 2 lần
  if (!mapsLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <GenericCrudPage
      api={warrantiesAPI}
      columns={warrantiesConfig.columns}
      fieldsForModal={warrantiesConfig.fieldsForModal}
      title={warrantiesConfig.title}
      disableCreate={true}
      options={options}
    />
  );
}

export default memo(Warranties);