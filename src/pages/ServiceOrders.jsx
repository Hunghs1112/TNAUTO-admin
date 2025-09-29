// src/pages/ServiceOrders.jsx
import { useState, useEffect } from 'react';
import GenericTable from '../components/Table';
import { serviceOrdersAPI, employeesAPI, serviceOrderImagesAPI } from '../services/api';
import { formatDate, formatCurrency } from '../utils/format';

const columns = [
  { key: 'customer_name', label: 'Tên khách hàng' },
  { key: 'receiver_phone', label: 'Số điện thoại khách hàng' },
  { key: 'service_name', label: 'Dịch vụ' },
  { key: 'status', label: 'Trạng thái', render: (val) => {
    let bgColor = 'bg-gray-200 text-gray-800';
    let textColor = 'text-gray-800';
    let statusText = val;
    if (val === 'received') { 
      bgColor = 'bg-yellow-200'; 
      textColor = 'text-yellow-800'; 
      statusText = 'Đã nhận'; 
    }
    else if (val === 'ready_for_pickup') { 
      bgColor = 'bg-blue-200'; 
      textColor = 'text-blue-800'; 
      statusText = 'Sẵn sàng lấy'; 
    }
    else if (val === 'in_progress') { 
      bgColor = 'bg-indigo-200'; 
      textColor = 'text-indigo-800'; 
      statusText = 'Đang xử lý'; 
    }
    else if (val === 'completed') { 
      bgColor = 'bg-green-200'; 
      textColor = 'text-green-800'; 
      statusText = 'Hoàn thành'; 
    }
    else if (val === 'cancelled') { 
      bgColor = 'bg-red-200'; 
      textColor = 'text-red-800'; 
      statusText = 'Đã hủy'; 
    }
    return <span className={`px-2 py-1 rounded text-xs font-bold ${bgColor} ${textColor}`}>{statusText}</span>;
  }},
  { key: 'employee_name', label: 'Nhân viên đảm nhận' },
  { key: 'receive_date', label: 'Ngày nhận', render: (val) => formatDate(val) },
  { key: 'delivery_date', label: 'Ngày giao', render: (val) => formatDate(val) },
  { key: 'created_at', label: 'Ngày tạo', render: (val) => formatDate(val) },
  { key: 'image_urls', label: 'Số hình ảnh', render: (val) => val ? val.length : 0 },
];

export default function ServiceOrders() {
  const [data, setData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderImages, setOrderImages] = useState([]);

  useEffect(() => {
    fetchData();
    fetchEmployees();
  }, []);

  const fetchData = async () => {
    console.log('Fetching service orders...');
    try {
      const res = await serviceOrdersAPI.getAll();
      console.log('Fetched service orders response:', res.data);
      setData(res.data.data || []);
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
    try {
      const orderRes = await serviceOrdersAPI.getById(id);
      console.log('Fetched order details:', orderRes.data);
      setSelectedOrder(orderRes.data || null);

      const imagesRes = await serviceOrderImagesAPI.getByOrder(id);
      console.log('Fetched order images:', imagesRes.data);
      setOrderImages(imagesRes.data || []);
    } catch (err) {
      console.error('Fetch order details/images error:', err);
      setSelectedOrder(null);
      setOrderImages([]);
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

  const openDetailModal = (id) => {
    console.log('Opening detail modal for order:', id);
    fetchOrderDetails(id);
    setShowDetailModal(true);
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
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">Danh sách đơn hàng dịch vụ</h2>
      <button
        onClick={handleRefresh}
        className="mb-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Làm mới
      </button>
      <table className="w-full table-auto border-collapse">
        <thead>
          <tr className="bg-gray-200">
            {columns.map((col) => <th key={col.key} className="p-3 text-left">{col.label}</th>)}
            {data.some(item => item.status === 'received') && <th className="p-3 text-left">Thao tác</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.id} className="border-b hover:bg-gray-50">
              {columns.map((col) => (
                <td key={col.key} className="p-3">
                  {col.render ? col.render(item[col.key], item) : (item[col.key] || '-')}
                </td>
              ))}
              {item.status === 'received' && (
                <td className="p-3 space-x-2">
                  <button onClick={() => openAssignModal(item.id)} className="text-blue-500 hover:underline text-sm">Giao việc</button>
                  <button onClick={() => handleCancel(item.id)} className="text-red-500 hover:underline text-sm">Hủy</button>
                </td>
              )}
            </tr>
          ))}
          {data.length === 0 && (
            <tr><td colSpan={columns.length + 1} className="p-3 text-center text-gray-500">Không có dữ liệu</td></tr>
          )}
        </tbody>
      </table>
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
              className="w-full bg-gray-300 text-black px-4 py-2 rounded"
            >
              Hủy
            </button>
          </div>
        </div>
      )}
      {/* Modal chi tiết đơn hàng */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-auto">
            <h3 className="text-xl font-bold mb-4">Chi tiết đơn hàng: {selectedOrder.id}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <p><strong>Tên khách hàng:</strong> {selectedOrder.customer_name}</p>
              <p><strong>Số điện thoại khách hàng:</strong> {selectedOrder.receiver_phone}</p>
              <p><strong>Dịch vụ:</strong> {selectedOrder.service_name}</p>
              <p><strong>Trạng thái:</strong> <span className={`px-2 py-1 rounded text-xs font-bold ${selectedOrder.status === 'received' ? 'bg-yellow-200 text-yellow-800' : selectedOrder.status === 'ready_for_pickup' ? 'bg-blue-200 text-blue-800' : selectedOrder.status === 'in-progress' ? 'bg-indigo-200 text-indigo-800' : selectedOrder.status === 'completed' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>{selectedOrder.status === 'received' ? 'Đã nhận' : selectedOrder.status === 'ready_for_pickup' ? 'Sẵn sàng lấy' : selectedOrder.status === 'in-progress' ? 'Đang xử lý' : selectedOrder.status === 'completed' ? 'Hoàn thành' : 'Đã hủy'}</span></p>
              <p><strong>Nhân viên đảm nhận:</strong> {selectedOrder.employee_name || 'Chưa giao'}</p>
              <p><strong>Tổng tiền:</strong> {formatCurrency(selectedOrder.total_amount)}</p>
              <p><strong>Ngày nhận:</strong> {formatDate(selectedOrder.receive_date)}</p>
              <p><strong>Ngày giao:</strong> {formatDate(selectedOrder.delivery_date)}</p>
              <p><strong>Ngày tạo:</strong> {formatDate(selectedOrder.created_at)}</p>
              {selectedOrder.license_plate && <p><strong>Biển số xe:</strong> {selectedOrder.license_plate}</p>}
              {selectedOrder.vehicle_type && <p><strong>Loại xe:</strong> {selectedOrder.vehicle_type}</p>}
              {selectedOrder.address && <p><strong>Địa chỉ:</strong> {selectedOrder.address}</p>}
              {selectedOrder.note && <p><strong>Ghi chú:</strong> {selectedOrder.note}</p>}
            </div>
            <h4 className="text-lg font-semibold mb-2">Hình ảnh ({orderImages.length})</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-4">
              {orderImages.map((img) => (
                <img
                  key={img.id}
                  src={img.image_url}
                  alt="Hình ảnh đơn hàng"
                  className="w-full h-32 object-cover rounded border"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ))}
              {orderImages.length === 0 && <p className="col-span-full text-gray-500">Không có hình ảnh</p>}
            </div>
            <button
              onClick={() => setShowDetailModal(false)}
              className="bg-gray-300 text-black px-4 py-2 rounded"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}