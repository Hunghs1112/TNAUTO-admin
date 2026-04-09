import { useEffect, useState } from 'react';
import { employeesAPI, serviceOrdersAPI } from '../../services/api';
import { serviceOrdersConfig } from '../../config/entityConfigs';
import { isValidImageUrl, normalizeImageUrl } from '../../utils/format';
import GenericCrudPage from './GenericCrudPage';
import ServiceOrderDetailModal from './ServiceOrderDetailModal';
import OptimizedImage from '../image/OptimizedImage';

export default function ServiceOrderManagement({ tableActionsRef = null }) {
  const [employees, setEmployees] = useState([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await employeesAPI.getAll();
        setEmployees(response.data.data || []);
      } catch {
        setEmployees([]);
      }
    };

    fetchEmployees();
  }, []);

  const enhancedColumns = [
    ...serviceOrdersConfig.columns,
    {
      key: 'image_preview',
      label: 'Hình ảnh',
      render: (value, item) => {
        if (!item.image_urls || item.image_urls.length === 0) {
          return <span className="text-xs italic text-slate-400">Chưa có</span>;
        }

        const validUrls = item.image_urls
          .filter((url) => url && isValidImageUrl(url))
          .map((url) => normalizeImageUrl(url))
          .filter((url) => url !== null)
          .slice(0, 3);

        if (!validUrls.length) {
          return <span className="text-xs italic text-slate-400">Chưa có</span>;
        }

        return (
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {validUrls.map((url, index) => (
                <div key={index} className="group relative cursor-pointer" title="Ảnh xem trước">
                  <div className="h-12 w-12 overflow-hidden rounded-lg border-2 border-slate-600 bg-slate-700 transition-all hover:border-[#1e406b] hover:shadow-md">
                    <OptimizedImage
                      src={url}
                      alt={`Ảnh ${index + 1}`}
                      className="h-full w-full object-cover transition-transform hover:scale-110"
                      containerClassName="h-full w-full"
                      placeholder={<div className="h-full w-full bg-slate-700" />}
                      fallback={<div className="h-full w-full bg-slate-700" />}
                    />
                  </div>
                </div>
              ))}
            </div>
            {item.image_urls.length > 3 ? (
              <span className="rounded-full bg-[#1e406b]/15 px-2 py-1 text-xs text-[#eecd7e]">
                +{item.image_urls.length - 3}
              </span>
            ) : null}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <GenericCrudPage
        api={serviceOrdersAPI}
        columns={enhancedColumns}
        fieldsForModal={serviceOrdersConfig.fieldsForModal}
        title={serviceOrdersConfig.title}
        showPagination={true}
        limit={12}
        refreshTrigger={refreshKey}
        hideTitle={true}
        showActions={true}
        onView={(item) => {
          setSelectedOrderId(item.id);
          setShowDetailModal(true);
        }}
        onEdit={(item) => {
          setSelectedOrderId(item.id);
          setShowDetailModal(true);
        }}
        onRowClick={(item) => {
          setSelectedOrderId(item.id);
          setShowDetailModal(true);
        }}
        tableActionsRef={tableActionsRef}
        showTableHeaderActions={false}
        options={{
          transformData: (data) =>
            data.map((order) => ({
              ...order,
              image_urls: order.image_urls
                ? order.image_urls
                    .filter((url) => isValidImageUrl(url))
                    .map((url) => normalizeImageUrl(url))
                    .filter((url) => url !== null)
                : [],
            })),
        }}
      />

      <ServiceOrderDetailModal
        isOpen={showDetailModal}
        orderId={selectedOrderId}
        employees={employees}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedOrderId(null);
        }}
        onRefresh={() => setRefreshKey((prev) => prev + 1)}
      />
    </>
  );
}
