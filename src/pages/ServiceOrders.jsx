// src/pages/ServiceOrders.jsx
import { useState, useEffect } from 'react';
import GenericTable from '../components/Table';
import { serviceOrdersAPI, employeesAPI, serviceOrderImagesAPI } from '../services/api';
import { formatDate, formatCurrency, isValidImageUrl, normalizeImageUrl } from '../utils/format';
import { statusColors, buttonStyles } from '../styles/colors';

const getStatusBadge = (status) => {
  const config = statusColors[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status };
  return <span className={`px-2 py-1 rounded text-xs font-bold ${config.bg} ${config.text} whitespace-nowrap`}>{config.label}</span>;
};

const columns = [
  { key: 'id', label: 'ID', render: (val) => <span className="font-mono text-xs">{val}</span> },
  { key: 'customer_name', label: 'Khách hàng' },
  { key: 'receiver_phone', label: 'SĐT' },
  { 
    key: 'vehicle_model', 
    label: 'Xe', 
    render: (val, item) => {
      if (!val && !item.license_plate) return '-';
      return (
        <div className="text-xs">
          <div className="font-semibold">{item.license_plate || '-'}</div>
          {val && <div className="text-gray-500">{val}</div>}
        </div>
      );
    }
  },
  { key: 'service_name', label: 'Dịch vụ' },
  { key: 'status', label: 'Trạng thái', render: getStatusBadge },
  { key: 'employee_name', label: 'Nhân viên', render: (val) => val || '-' },
  { key: 'receive_date', label: 'Ngày nhận', render: (val) => val ? new Date(val).toLocaleDateString('vi-VN') : '-' },
  { key: 'created_at', label: 'Ngày tạo', render: (val) => formatDate(val) },
];

export default function ServiceOrders() {
  const [data, setData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderImages, setOrderImages] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    fetchData();
    fetchEmployees();
  }, []);

  const fetchData = async () => {
    console.log('Fetching service orders...');
    try {
      const res = await serviceOrdersAPI.getAll();
      console.log('Fetched service orders response:', res.data);
      const ordersData = res.data.data || [];
      
      // Filter và normalize image URLs cho mỗi đơn hàng
      const processedOrders = ordersData.map(order => ({
        ...order,
        image_urls: order.image_urls 
          ? order.image_urls
              .filter(url => isValidImageUrl(url))
              .map(url => normalizeImageUrl(url))
              .filter(url => url !== null)
          : []
      }));
      
      setData(processedOrders);
    } catch (err) {
      console.error('Fetch service orders error:', err);
      setData([]);
    }
  };

  const fetchEmployees = async () => {
    console.log('Fetching employees for assign...');
    try {
      const res = await employeesAPI.getAll();
      console.log('Fetched employees for assign:', res.data);
      setEmployees(res.data.data || []);
    } catch (err) {
      console.error('Fetch employees error:', err);
      setEmployees([]);
    }
  };

  const fetchOrderDetails = async (id) => {
    console.log('Fetching order details for ID:', id);
    setLoadingDetail(true);
    try {
      const orderRes = await serviceOrdersAPI.getById(id);
      console.log('Fetched order details:', orderRes.data);
      // Backend trả về { success: true, data: {...} }
      const orderData = orderRes.data.data || orderRes.data;
      setSelectedOrder(orderData || null);

      const imagesRes = await serviceOrderImagesAPI.getByOrder(id);
      console.log('Fetched order images:', imagesRes.data);
      // Backend có thể trả về array hoặc { success: true, data: [...] }
      const imagesData = imagesRes.data.data || imagesRes.data;
      // Filter và normalize URL ảnh (loại bỏ file path local, chuyển đổi URL)
      const validImages = Array.isArray(imagesData) 
        ? imagesData
            .filter(img => isValidImageUrl(img.image_url))
            .map(img => ({
              ...img,
              image_url: normalizeImageUrl(img.image_url)
            }))
        : [];
      console.log('Valid images (filtered):', validImages.length, 'of', imagesData.length);
      setOrderImages(validImages);
    } catch (err) {
      console.error('Fetch order details/images error:', err);
      alert('Không thể tải chi tiết đơn hàng: ' + (err.response?.data?.message || err.message));
      setSelectedOrder(null);
      setOrderImages([]);
      setShowDetailModal(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleRefresh = () => fetchData();

  const handleAssignEmployee = async (employeeId) => {
    console.log('Assigning employee_id:', employeeId, 'to order:', selectedOrderId);
    if (selectedOrderId) {
      try {
        await serviceOrdersAPI.assign(selectedOrderId, employeeId);
        console.log('Assigned employee successfully');
        setShowAssignModal(false);
        setSelectedOrderId(null);
        fetchData();
      } catch (err) {
        console.error('Assign error:', err);
      }
    }
  };

  const openAssignModal = (id) => {
    console.log('Opening assign modal for order:', id);
    setSelectedOrderId(id);
    setShowAssignModal(true);
  };

  const openDetailModal = async (id) => {
    console.log('Opening detail modal for order:', id);
    setShowDetailModal(true);
    await fetchOrderDetails(id);
  };

  const handleCancel = async (id) => {
    console.log('Cancelling order:', id);
    if (confirm('Hủy đơn hàng này?')) {
      try {
        await serviceOrdersAPI.updateStatus(id, 'cancelled');
        console.log('Cancelled order successfully');
        fetchData();
      } catch (err) {
        console.error('Cancel error:', err);
      }
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl sm:text-2xl font-bold">Đơn hàng dịch vụ</h2>
          <button
            onClick={handleRefresh}
            className={`${buttonStyles.primary} text-sm`}
          >
            Làm mới
          </button>
        </div>
      </div>

      {/* Table Container - Scrollable */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse min-w-max">
          <thead className="bg-gray-200 sticky top-0 z-10">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="p-2 sm:p-3 text-left text-xs sm:text-sm font-semibold whitespace-nowrap">
                  {col.label}
                </th>
              ))}
              <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-semibold whitespace-nowrap">Hình ảnh</th>
              <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-semibold whitespace-nowrap">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.id} className="border-b hover:bg-gray-50">
                {columns.map((col) => (
                  <td key={col.key} className="p-2 sm:p-3 text-xs sm:text-sm">
                    {col.render ? col.render(item[col.key], item) : (item[col.key] || '-')}
                  </td>
                ))}
                <td className="p-2 sm:p-3">
                  {item.image_urls && item.image_urls.length > 0 ? (
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {item.image_urls.slice(0, 3).map((url, idx) => (
                          <div 
                            key={idx}
                            className="relative group cursor-pointer"
                            onClick={() => openDetailModal(item.id)}
                            title="Click để xem chi tiết"
                          >
                            <div className="w-12 h-12 rounded border-2 border-gray-200 overflow-hidden bg-gray-50 hover:border-blue-400 transition-all hover:shadow-md">
                              <img
                                src={url}
                                alt={`Ảnh ${idx + 1}`}
                                className="w-full h-full object-contain hover:scale-110 transition-transform"
                                onError={(e) => { 
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.parentElement.classList.add('flex', 'items-center', 'justify-center');
                                  e.currentTarget.parentElement.innerHTML = '<svg class="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>';
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      {item.image_urls.length > 3 && (
                        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-semibold">
                          +{item.image_urls.length - 3}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400 text-xs italic">Chưa có</span>
                  )}
                </td>
                <td className="p-2 sm:p-3">
                  <div className="flex flex-wrap gap-1">
                    <button 
                      onClick={() => openDetailModal(item.id)}
                      className="text-blue-600 hover:text-blue-700 hover:underline text-xs sm:text-sm whitespace-nowrap"
                    >
                      Chi tiết
                    </button>
                    {item.status === 'received' && (
                      <>
                        <button 
                          onClick={() => openAssignModal(item.id)} 
                          className="text-green-600 hover:text-green-700 hover:underline text-xs sm:text-sm whitespace-nowrap"
                        >
                          Giao việc
                        </button>
                        <button 
                          onClick={() => handleCancel(item.id)} 
                          className="text-red-600 hover:text-red-700 hover:underline text-xs sm:text-sm whitespace-nowrap"
                        >
                          Hủy
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={columns.length + 2} className="p-6 text-center text-gray-500">
                  Không có dữ liệu
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Modal giao nhân viên */}
      {showAssignModal && selectedOrderId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 max-h-96 overflow-auto">
            <h3 className="text-xl font-bold mb-4">Giao nhân viên cho đơn hàng {selectedOrderId}</h3>
            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
              {employees.map((emp) => (
                <button
                  key={emp.id}
                  onClick={() => handleAssignEmployee(emp.id)}
                  className="w-full p-2 border rounded hover:bg-gray-100 text-left"
                >
                  {emp.name} ({emp.phone})
                </button>
              ))}
              {employees.length === 0 && <p className="text-gray-500">Không có nhân viên nào</p>}
            </div>
            <button
              onClick={() => { setShowAssignModal(false); setSelectedOrderId(null); }}
              className={`w-full ${buttonStyles.secondary}`}
            >
              Hủy
            </button>
          </div>
        </div>
      )}
      {/* Modal chi tiết đơn hàng - Tối ưu responsive */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg w-full max-w-5xl max-h-[95vh] flex flex-col shadow-2xl">
            {/* Header - Fixed */}
            <div className="p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold">
                    {selectedOrder ? `Chi tiết đơn hàng #${selectedOrder.id}` : 'Đang tải...'}
                  </h3>
                  {selectedOrder && <div className="mt-2">{getStatusBadge(selectedOrder.status)}</div>}
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>
            
            {/* Loading State */}
            {loadingDetail && (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-500">Đang tải thông tin đơn hàng...</p>
                </div>
              </div>
            )}
            
            {/* Content - Only show when loaded */}
            {!loadingDetail && selectedOrder && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {/* Thông tin đơn hàng */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-base sm:text-lg mb-3 text-gray-700">Thông tin đơn hàng</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div><span className="font-medium">Khách hàng:</span> {selectedOrder.customer_name}</div>
                  <div><span className="font-medium">SĐT:</span> {selectedOrder.receiver_phone}</div>
                  <div><span className="font-medium">Dịch vụ:</span> {selectedOrder.service_name}</div>
                  <div><span className="font-medium">Nhân viên:</span> {selectedOrder.employee_name || 'Chưa giao'}</div>
                  <div><span className="font-medium">Ngày nhận:</span> {selectedOrder.receive_date ? new Date(selectedOrder.receive_date).toLocaleDateString('vi-VN') : '-'}</div>
                  <div><span className="font-medium">Ngày giao:</span> {selectedOrder.delivery_date ? new Date(selectedOrder.delivery_date).toLocaleDateString('vi-VN') : '-'}</div>
                  <div><span className="font-medium">Ngày tạo:</span> {new Date(selectedOrder.created_at).toLocaleDateString('vi-VN')}</div>
                  {selectedOrder.address && (
                    <div className="sm:col-span-2"><span className="font-medium">Địa chỉ:</span> {selectedOrder.address}</div>
                  )}
                  {selectedOrder.note && (
                    <div className="sm:col-span-2"><span className="font-medium">Ghi chú:</span> {selectedOrder.note}</div>
                  )}
                </div>
              </div>

              {/* Thông tin xe */}
              {(selectedOrder.license_plate || selectedOrder.vehicle_model) && (
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-base sm:text-lg mb-3 text-gray-700">Thông tin xe</h4>
                  <div className="flex gap-4">
                    {selectedOrder.vehicle_image_url && (
                      <div className="flex-shrink-0">
                        <img 
                          src={selectedOrder.vehicle_image_url} 
                          alt="Xe" 
                          className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg object-cover border-2 border-gray-200"
                          onError={(e) => { 
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <div className="flex-1 grid grid-cols-1 gap-2 text-sm">
                      {selectedOrder.license_plate && (
                        <div>
                          <span className="font-medium">Biển số xe:</span>{' '}
                          <span className="bg-yellow-400 text-black px-3 py-1 rounded font-bold">{selectedOrder.license_plate}</span>
                        </div>
                      )}
                      {selectedOrder.vehicle_model && (
                        <div><span className="font-medium">Mẫu xe:</span> {selectedOrder.vehicle_model}</div>
                      )}
                      {selectedOrder.vehicle_type && (
                        <div><span className="font-medium">Loại xe:</span> {selectedOrder.vehicle_type}</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Hình ảnh */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-base sm:text-lg mb-3 text-gray-700">
                  Hình ảnh đơn hàng ({orderImages.length})
                </h4>
                {orderImages.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                    {orderImages.map((img) => (
                      <div key={img.id} className="group relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-all">
                        <img
                          src={img.image_url}
                          alt="Hình ảnh đơn hàng"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          onError={(e) => { 
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400"><svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>';
                          }}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                          <button
                            onClick={() => window.open(img.image_url, '_blank')}
                            className="opacity-0 group-hover:opacity-100 bg-white text-blue-600 px-2 py-1 rounded text-xs font-medium"
                          >
                            Xem lớn
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p>Chưa có hình ảnh nào</p>
                  </div>
                )}
              </div>
              </div>
            )}
            
            {/* Footer - Fixed */}
            {!loadingDetail && (
              <div className="p-4 sm:p-6 border-t border-gray-200 flex-shrink-0">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className={`w-full sm:w-auto ${buttonStyles.secondary}`}
                >
                  Đóng
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}