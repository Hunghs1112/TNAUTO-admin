// src/pages/DealerWarranties.jsx
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import GenericCrudPage from '../components/features/GenericCrudPage';
import { dealersAPI, employeesAPI, productsAPI, warrantiesAPI } from '../services/api';

function DealerWarranties() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [nameMaps, setNameMaps] = useState({
    dealers: new Map(),
    products: new Map(),
    employees: new Map(),
  });
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const mapsLoadingRef = useRef(false);

  useEffect(() => {
    if (mapsLoadingRef.current || mapsLoaded) return;

    mapsLoadingRef.current = true;

    const loadMappings = async () => {
      try {
        const [dealersRes, productsRes, employeesRes] = await Promise.all([
          dealersAPI.getAll().catch(() => ({ data: { data: [] } })),
          productsAPI.getAll().catch(() => ({ data: { data: [] } })),
          employeesAPI.getAll().catch(() => ({ data: { data: [] } })),
        ]);

        const dealersData = dealersRes.data?.data || dealersRes.data || [];
        const productsData = productsRes.data?.data || productsRes.data || [];
        const employeesData = employeesRes.data?.data || employeesRes.data || [];

        const dealersMap = new Map();
        const productsMap = new Map();
        const employeesMap = new Map();

        if (Array.isArray(dealersData)) {
          dealersData.forEach((d) => {
            if (d?.id && d?.name) dealersMap.set(d.id, d.name);
          });
        }

        if (Array.isArray(productsData)) {
          productsData.forEach((p) => {
            if (p?.id && p?.name) productsMap.set(p.id, p.name);
          });
        }

        if (Array.isArray(employeesData)) {
          employeesData.forEach((e) => {
            if (e?.id && e?.name) employeesMap.set(e.id, e.name);
          });
        }

        setNameMaps({
          dealers: dealersMap,
          products: productsMap,
          employees: employeesMap,
        });
        setMapsLoaded(true);
      } catch (error) {
        setNameMaps({
          dealers: new Map(),
          products: new Map(),
          employees: new Map(),
        });
        setMapsLoaded(true);
      } finally {
        mapsLoadingRef.current = false;
      }
    };

    loadMappings();
  }, [mapsLoaded]);

  const transformData = useCallback(
    (data) => {
      if (!Array.isArray(data)) return data;

      return data
        .filter((w) => w?.dealer_id)
        .map((warranty) => {
          const result = { ...warranty };

          if (warranty.dealer_id && nameMaps.dealers.has(warranty.dealer_id)) {
            result.dealer_name = nameMaps.dealers.get(warranty.dealer_id);
          }

          if (warranty.product_id && nameMaps.products.has(warranty.product_id)) {
            result.product_name = nameMaps.products.get(warranty.product_id);
          }

          if (warranty.employee_id && nameMaps.employees.has(warranty.employee_id)) {
            result.employee_name = nameMaps.employees.get(warranty.employee_id);
          }

          return result;
        });
    },
    [nameMaps]
  );

  const handleError = useCallback((error) => {
    console.error('DealerWarranties error:', error);
  }, []);

  const dealerWarrantiesColumns = [
    { key: 'id', label: 'ID', render: (val) => <span className="font-mono text-xs">{val}</span> },
    {
      key: 'dealer_name',
      label: 'Đại lý',
      render: (val, item) => {
        if (val) return <span className="font-medium text-indigo-600 dark:text-indigo-400">{val}</span>;
        if (item?.dealer?.name) return <span className="font-medium text-indigo-600 dark:text-indigo-400">{item.dealer.name}</span>;
        if (item?.dealer_id) return <span className="text-indigo-400">ĐL ID: {item.dealer_id}</span>;
        return '-';
      },
    },
    {
      key: 'product_name',
      label: 'Sản phẩm',
      render: (val, item) => {
        if (val) return val;
        if (item?.product?.name) return item.product.name;
        if (item?.product_id) return <span className="text-gray-400">ID: {item.product_id}</span>;
        return '-';
      },
    },
    {
      key: 'employee_name',
      label: 'Nhân viên',
      render: (val, item) => {
        if (val) return val;
        if (item?.employee?.name) return item.employee.name;
        if (item?.employee_id) return <span className="text-gray-400">ID: {item.employee_id}</span>;
        return <span className="text-gray-400 italic">Chưa giao</span>;
      },
    },
    { key: 'warranty_period', label: 'Thời hạn (tháng)', render: (val) => (val != null ? `${val} tháng` : '-') },
    { key: 'start_date', label: 'Ngày bắt đầu', render: (val) => (val ? new Date(val).toLocaleDateString('vi-VN') : '-') },
    { key: 'end_date', label: 'Ngày hết hạn', render: (val) => (val ? new Date(val).toLocaleDateString('vi-VN') : '-') },
    { key: 'note', label: 'Ghi chú', render: (val) => (val ? String(val).slice(0, 50) : '-') },
    { key: 'created_at', label: 'Ngày tạo', render: (val) => (val ? new Date(val).toLocaleDateString('vi-VN') : '-') },
  ];

  const dealerWarrantiesFieldsForModal = [
    {
      name: 'dealer_id',
      label: 'Đại lý',
      type: 'select',
      required: true,
      apiEndpoint: '/dealers',
      valueKey: 'id',
      labelKey: 'name',
      labelFormat: (item) => `${item.name} - ${item.phone}`,
    },
    {
      name: 'product_id',
      label: 'Sản phẩm',
      type: 'select',
      required: true,
      apiEndpoint: '/products',
      valueKey: 'id',
      labelKey: 'name',
    },
    { name: 'warranty_period', label: 'Thời hạn (tháng)', type: 'number', min: 1, required: true },
    { name: 'start_date', label: 'Ngày bắt đầu', type: 'date', required: true },
    { name: 'end_date', label: 'Ngày hết hạn', type: 'date', disabled: true, placeholder: 'Tự động tính từ ngày bắt đầu và thời hạn' },
    { name: 'note', label: 'Ghi chú', type: 'textarea' },
  ];

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
      columns={dealerWarrantiesColumns}
      fieldsForModal={dealerWarrantiesFieldsForModal}
      title="Bảo hành đại lí"
      disableCreate={false}
      showTableHeaderActions={true}
      options={{ transformData, onError: handleError }}
      refreshTrigger={refreshTrigger}
      onSaved={() => setRefreshTrigger((p) => p + 1)}
    />
  );
}

export default memo(DealerWarranties);

