// src/pages/ServiceOrders.jsx
import ServiceOrderManagement from '../components/features/ServiceOrderManagement';

export default function ServiceOrders() {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Đơn dịch vụ</h1>
      </div>
      
      <div className="page-content">
        <ServiceOrderManagement />
      </div>
    </div>
  );
}