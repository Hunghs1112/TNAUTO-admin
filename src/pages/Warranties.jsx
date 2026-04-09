import { memo, useCallback, useEffect, useRef, useState } from 'react';
import WarrantyDetailModal from '../components/features/WarrantyDetailModal';
import GenericCrudPage from '../components/features/GenericCrudPage';
import { warrantiesConfig } from '../config/entityConfigs.jsx';
import { customersAPI, dealersAPI, employeesAPI, servicesAPI, warrantiesAPI } from '../services/api';

function normalizeListResponse(response) {
  const raw = response?.data;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data?.data)) return raw.data.data;
  return [];
}

function Warranties() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedWarrantyId, setSelectedWarrantyId] = useState(null);
  const [nameMaps, setNameMaps] = useState({
    customers: new Map(),
    dealers: new Map(),
    services: new Map(),
    employees: new Map(),
  });
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const mapsLoadingRef = useRef(false);

  useEffect(() => {
    if (mapsLoadingRef.current || mapsLoaded) {
      return;
    }

    mapsLoadingRef.current = true;

    const loadMappings = async () => {
      try {
        const [customersResponse, dealersResponse, servicesResponse, employeesResponse] = await Promise.all([
          customersAPI.getAll().catch(() => ({ data: { data: [] } })),
          dealersAPI.getAll().catch(() => ({ data: { data: [] } })),
          servicesAPI.getAll().catch(() => ({ data: { data: [] } })),
          employeesAPI.getAll().catch(() => ({ data: { data: [] } })),
        ]);

        const customersMap = new Map();
        const dealersMap = new Map();
        const servicesMap = new Map();
        const employeesMap = new Map();

        normalizeListResponse(customersResponse).forEach((customer) => {
          if (customer?.id && customer?.name) customersMap.set(customer.id, customer.name);
        });
        normalizeListResponse(dealersResponse).forEach((dealer) => {
          if (dealer?.id && dealer?.name) dealersMap.set(dealer.id, dealer.name);
        });
        normalizeListResponse(servicesResponse).forEach((service) => {
          if (service?.id && service?.name) servicesMap.set(service.id, service.name);
        });
        normalizeListResponse(employeesResponse).forEach((employee) => {
          if (employee?.id && employee?.name) employeesMap.set(employee.id, employee.name);
        });

        setNameMaps({
          customers: customersMap,
          dealers: dealersMap,
          services: servicesMap,
          employees: employeesMap,
        });
      } finally {
        mapsLoadingRef.current = false;
        setMapsLoaded(true);
      }
    };

    loadMappings();
  }, [mapsLoaded]);

  const transformData = useCallback(
    (data) => {
      if (!Array.isArray(data)) {
        return data;
      }

      return data.map((warranty) => ({
        ...warranty,
        customer_name: warranty.customer_id ? nameMaps.customers.get(warranty.customer_id) || warranty.customer_name : warranty.customer_name,
        dealer_name: warranty.dealer_id ? nameMaps.dealers.get(warranty.dealer_id) || warranty.dealer_name : warranty.dealer_name,
        service_name: warranty.service_id ? nameMaps.services.get(warranty.service_id) || warranty.service_name : warranty.service_name,
        employee_name: warranty.employee_id
          ? nameMaps.employees.get(warranty.employee_id) || warranty.employee_name
          : warranty.employee_name,
      }));
    },
    [nameMaps]
  );

  if (!mapsLoaded) {
    return (
      <div className="app-panel">
        <div className="app-panel-body">
          <div className="flex items-center justify-center py-14">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-[#1e406b]" />
              <p className="text-sm text-slate-300">Đang tải dữ liệu bảo hành...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <GenericCrudPage
        api={warrantiesAPI}
        columns={warrantiesConfig.columns}
        fieldsForModal={warrantiesConfig.fieldsForModal}
        title={warrantiesConfig.title}
        showPagination={true}
        limit={20}
        options={{ transformData }}
        refreshTrigger={refreshTrigger}
        onView={(item) => {
          setSelectedWarrantyId(item?.id || null);
          setShowDetailModal(true);
        }}
        onRowClick={(item) => {
          setSelectedWarrantyId(item?.id || null);
          setShowDetailModal(true);
        }}
      />

      <WarrantyDetailModal
        isOpen={showDetailModal}
        warrantyId={selectedWarrantyId}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedWarrantyId(null);
        }}
        onSaved={() => setRefreshTrigger((prev) => prev + 1)}
      />
    </>
  );
}

export default memo(Warranties);
