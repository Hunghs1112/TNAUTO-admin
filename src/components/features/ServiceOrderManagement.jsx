// src/components/features/ServiceOrderManagement.jsx
import React, { useState, useEffect } from 'react';
import GenericCrudPage from './GenericCrudPage';
import ServiceOrderDetailModal from './ServiceOrderDetailModal';
import { serviceOrdersAPI, employeesAPI } from '../../services/api';
import { serviceOrdersConfig } from '../../config/entityConfigs';
import { isValidImageUrl, normalizeImageUrl } from '../../utils/format';

/**
 * Service Order Management component
 * Sử dụng form chi tiết riêng (ServiceOrderDetailModal)
 * Các trang khác dùng form xem/sửa chung trong Table.jsx
 */
export default function ServiceOrderManagement({ tableActionsRef = null }) {
  const [employees, setEmployees] = useState([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await employeesAPI.getAll();
      setEmployees(res.data.data || []);
    } catch (err) {
      console.error('Fetch employees error:', err);
      setEmployees([]);
    }
  };

  const handleViewOrder = (item) => {
    setSelectedOrderId(item.id);
    setShowDetailModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailModal(false);
    setSelectedOrderId(null);
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Enhanced columns with image preview
  const enhancedColumns = [
    ...serviceOrdersConfig.columns,
    {
      key: 'image_preview',
      label: 'Hình ảnh',
      render: (val, item) => {
        if (!item.image_urls || item.image_urls.length === 0) {
          return <span className="text-gray-400 text-xs italic">Chưa có</span>;
        }
        
        const validUrls = item.image_urls
          .filter(url => url && isValidImageUrl(url))
          .map(url => normalizeImageUrl(url))
          .filter(url => url !== null)
          .slice(0, 3);
        
        if (validUrls.length === 0) {
          return <span className="text-gray-400 text-xs italic">Chưa có</span>;
        }
        
        return (
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {validUrls.map((url, idx) => (
                <div 
                  key={idx}
                  className="relative group cursor-pointer"
                  title="Click để xem ảnh lớn"
                >
                  <div className="w-12 h-12 rounded-lg border-2 border-gray-200 dark:border-slate-600 overflow-hidden bg-gray-50 dark:bg-slate-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all hover:shadow-md">
                    <img
                      src={url}
                      alt={`Ảnh ${idx + 1}`}
                      className="w-full h-full object-cover hover:scale-110 transition-transform bg-white dark:bg-slate-800"
                      loading="lazy"
                      onError={(e) => { 
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          parent.classList.add('flex', 'items-center', 'justify-center', 'bg-gray-100', 'dark:bg-slate-700');
                          parent.innerHTML = '<svg class="w-6 h-6 text-gray-300 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>';
                        }
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            {item.image_urls.length > 3 && (
              <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs px-2 py-1 rounded-full">
                +{item.image_urls.length - 3}
              </span>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <>
      <GenericCrudPage
        key={refreshKey}
        api={serviceOrdersAPI}
        columns={enhancedColumns}
        fieldsForModal={serviceOrdersConfig.fieldsForModal}
        title={serviceOrdersConfig.title}
        hideTitle={true}
        showActions={true}
        onView={handleViewOrder}
        onEdit={handleViewOrder}
        onRowClick={handleViewOrder}
        tableActionsRef={tableActionsRef}
        showTableHeaderActions={false}
        options={{
          transformData: (data) => data.map(order => ({
            ...order,
            image_urls: order.image_urls 
              ? order.image_urls
                  .filter(url => isValidImageUrl(url))
                  .map(url => normalizeImageUrl(url))
                  .filter(url => url !== null)
              : []
          })),
          onError: (error) => console.error('Service orders error:', error)
        }}
      />

      {/* Service Order Detail Modal - Form riêng cho đơn dịch vụ */}
      <ServiceOrderDetailModal
        isOpen={showDetailModal}
        orderId={selectedOrderId}
        employees={employees}
        onClose={handleCloseModal}
        onRefresh={handleRefresh}
      />
    </>
  );
}
