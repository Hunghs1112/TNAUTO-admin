import { memo, useCallback, useEffect, useRef, useState } from 'react';
import GenericCrudPage from '../components/features/GenericCrudPage';
import { dealersAPI, employeesAPI, productsAPI, warrantiesAPI } from '../services/api';

function normalizeListResponse(response) {
  const raw = response?.data;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data?.data)) return raw.data.data;
  return [];
}

function DealerWarranties() {
  const [nameMaps, setNameMaps] = useState({
    dealers: new Map(),
    products: new Map(),
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
        const [dealersResponse, productsResponse, employeesResponse] = await Promise.all([
          dealersAPI.getAll().catch(() => ({ data: { data: [] } })),
          productsAPI.getAll().catch(() => ({ data: { data: [] } })),
          employeesAPI.getAll().catch(() => ({ data: { data: [] } })),
        ]);

        const dealersMap = new Map();
        const productsMap = new Map();
        const employeesMap = new Map();

        normalizeListResponse(dealersResponse).forEach((dealer) => {
          if (dealer?.id && dealer?.name) dealersMap.set(dealer.id, dealer.name);
        });
        normalizeListResponse(productsResponse).forEach((product) => {
          if (product?.id && product?.name) productsMap.set(product.id, product.name);
        });
        normalizeListResponse(employeesResponse).forEach((employee) => {
          if (employee?.id && employee?.name) employeesMap.set(employee.id, employee.name);
        });

        setNameMaps({
          dealers: dealersMap,
          products: productsMap,
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

      return data
        .filter((warranty) => warranty?.dealer_id)
        .map((warranty) => ({
          ...warranty,
          dealer_name: warranty.dealer_id ? nameMaps.dealers.get(warranty.dealer_id) || warranty.dealer_name : warranty.dealer_name,
          product_name:
            warranty.product_id ? nameMaps.products.get(warranty.product_id) || warranty.product_name : warranty.product_name,
          employee_name:
            warranty.employee_id
              ? nameMaps.employees.get(warranty.employee_id) || warranty.employee_name
              : warranty.employee_name,
        }));
    },
    [nameMaps]
  );

  const dealerWarrantiesColumns = [
    { key: 'id', label: 'ID', render: (value) => <span className="font-mono text-xs">{value}</span> },
    {
      key: 'dealer_name',
      label: 'Đại lý',
      render: (value, item) => {
        if (value) return <span className="font-medium text-[#dfe1e3]">{value}</span>;
        if (item?.dealer?.name) return <span className="font-medium text-[#dfe1e3]">{item.dealer.name}</span>;
        if (item?.dealer_id) return <span className="text-[#dfe1e3]">ĐL ID: {item.dealer_id}</span>;
        return '-';
      },
    },
    {
      key: 'product_name',
      label: 'Sản phẩm',
      render: (value, item) => {
        if (value) return value;
        if (item?.product?.name) return item.product.name;
        if (item?.product_id) return <span className="text-slate-400">ID: {item.product_id}</span>;
        return '-';
      },
    },
    {
      key: 'employee_name',
      label: 'Nhân viên',
      render: (value, item) => {
        if (value) return value;
        if (item?.employee?.name) return item.employee.name;
        if (item?.employee_id) return <span className="text-slate-400">ID: {item.employee_id}</span>;
        return <span className="italic text-slate-400">Chưa giao</span>;
      },
    },
    { key: 'warranty_period', label: 'Thời hạn (tháng)', render: (value) => (value != null ? `${value} tháng` : '-') },
    { key: 'start_date', label: 'Ngày bắt đầu', render: (value) => (value ? new Date(value).toLocaleDateString('vi-VN') : '-') },
    { key: 'end_date', label: 'Ngày hết hạn', render: (value) => (value ? new Date(value).toLocaleDateString('vi-VN') : '-') },
    { key: 'note', label: 'Ghi chú', render: (value) => (value ? String(value).slice(0, 50) : '-') },
    { key: 'created_at', label: 'Ngày tạo', render: (value) => (value ? new Date(value).toLocaleDateString('vi-VN') : '-') },
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
      <div className="app-panel">
        <div className="app-panel-body">
          <div className="flex items-center justify-center py-14">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-[#1e406b]" />
              <p className="text-sm text-slate-300">Đang tải dữ liệu bảo hành đại lý...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <GenericCrudPage
      api={warrantiesAPI}
      columns={dealerWarrantiesColumns}
      fieldsForModal={dealerWarrantiesFieldsForModal}
      title="Bảo hành đại lý"
      showPagination={true}
      limit={20}
      showSearch={true}
      searchPlaceholder="Tìm theo đại lý, sản phẩm, nhân viên..."
      options={{ transformData }}
    />
  );
}

export default memo(DealerWarranties);
