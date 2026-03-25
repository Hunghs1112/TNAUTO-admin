import { useEffect, useState } from 'react';
import { employeesAPI, serviceOrdersAPI } from '../../services/api';
import { serviceOrdersConfig } from '../../config/entityConfigs';
import { isValidImageUrl, normalizeImageUrl } from '../../utils/format';
import GenericCrudPage from './GenericCrudPage';
import ServiceOrderDetailModal from './ServiceOrderDetailModal';

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
          return <span className="text-xs italic text-gray-400">Chưa có</span>;
        }

        const validUrls = item.image_urls
          .filter((url) => url && isValidImageUrl(url))
          .map((url) => normalizeImageUrl(url))
          .filter((url) => url !== null)
          .slice(0, 3);

        if (!validUrls.length) {
          return <span className="text-xs italic text-gray-400">Chưa có</span>;
        }

        return (
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {validUrls.map((url, index) => (
                <div key={index} className="group relative cursor-pointer" title="Bấm để xem ảnh lớn">
                  <div className="h-12 w-12 overflow-hidden rounded-lg border-2 border-gray-200 bg-gray-50 transition-all hover:border-blue-400 hover:shadow-md dark:border-slate-600 dark:bg-slate-700 dark:hover:border-blue-500">
                    <img
                      src={url}
                      alt={`Ảnh ${index + 1}`}
                      className="h-full w-full object-cover transition-transform hover:scale-110"
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.style.display = 'none';
                        const parent = event.currentTarget.parentElement;
                        if (parent) {
                          parent.classList.add('flex', 'items-center', 'justify-center', 'bg-gray-100', 'dark:bg-slate-700');
                          parent.innerHTML =
                            '<svg class="w-6 h-6 text-gray-300 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>';
                        }
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            {item.image_urls.length > 3 ? (
              <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
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
