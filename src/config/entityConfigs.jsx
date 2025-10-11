// src/config/entityConfigs.jsx
import { formatDate, formatCurrency, truncateText } from '../utils/format';

/**
 * Centralized entity configurations
 * This eliminates duplication and makes it easy to manage all entity settings
 */

export const customersConfig = {
  columns: [
    { key: 'avatar_url', label: 'Ảnh đại diện', render: (val) => val ? <img src={val} alt="Ảnh đại diện" className="w-8 h-8 rounded-full object-cover" /> : '-' },
    { key: 'name', label: 'Tên' },
    { key: 'phone', label: 'Số điện thoại' },
    { key: 'license_plate', label: 'Biển số xe' },
    { key: 'created_at', label: 'Ngày tạo', render: (val) => formatDate(val) },
  ],
  fieldsForModal: [
    { name: 'name', label: 'Tên', type: 'text' },
    { name: 'phone', label: 'Số điện thoại', type: 'text' },
    { name: 'license_plate', label: 'Biển số xe', type: 'text' },
    { name: 'avatar_url', label: 'URL ảnh đại diện', type: 'text' },
  ],
  title: 'Khách hàng',
};

export const employeesConfig = {
  columns: [
    { key: 'avatar_url', label: 'Ảnh đại diện', render: (val) => val ? <img src={val} alt="Ảnh đại diện" className="w-8 h-8 rounded-full object-cover" /> : '-' },
    { key: 'name', label: 'Tên' },
    { key: 'phone', label: 'Số điện thoại' },
    { key: 'created_at', label: 'Ngày tạo', render: (val) => formatDate(val) },
  ],
  fieldsForModal: [
    { name: 'name', label: 'Tên', type: 'text' },
    { name: 'phone', label: 'Số điện thoại', type: 'text' },
    { name: 'password', label: 'Mật khẩu', type: 'password' },
    { name: 'avatar_url', label: 'URL ảnh đại diện', type: 'text' },
  ],
  title: 'Nhân viên',
};

export const categoriesConfig = {
  columns: [
    { key: 'name', label: 'Tên danh mục' },
    { key: 'description', label: 'Mô tả', render: (val) => truncateText(val) },
    { key: 'image_url', label: 'Hình ảnh', render: (val) => val ? <img src={val} alt="Danh mục" className="w-12 h-12 rounded object-cover" /> : '-' },
    { key: 'created_at', label: 'Ngày tạo', render: (val) => formatDate(val) },
  ],
  fieldsForModal: [
    { name: 'name', label: 'Tên danh mục', type: 'text' },
    { name: 'description', label: 'Mô tả', type: 'textarea' },
    { name: 'image_url', label: 'URL hình ảnh', type: 'text' },
  ],
  title: 'Danh mục sản phẩm',
};

export const productsConfig = {
  columns: [
    { key: 'name', label: 'Tên' },
    { key: 'price', label: 'Giá', render: (val) => formatCurrency(val) },
    { key: 'category_name', label: 'Danh mục' },
    { key: 'description', label: 'Mô tả', render: (val) => truncateText(val) },
    { key: 'primary_image', label: 'Hình ảnh', render: (val) => val ? <img src={val} alt="Sản phẩm" className="w-12 h-12 rounded object-cover" /> : '-' },
  ],
  fieldsForModal: [
    { name: 'name', label: 'Tên', type: 'text' },
    { name: 'price', label: 'Giá', type: 'number' },
    { name: 'category_id', label: 'ID Danh mục', type: 'number' },
    { name: 'description', label: 'Mô tả', type: 'textarea' },
  ],
  title: 'Sản phẩm',
};

export const servicesConfig = {
  columns: [
    { key: 'name', label: 'Tên' },
    { key: 'description', label: 'Mô tả', render: (val) => truncateText(val) },
    { key: 'estimated_time', label: 'Thời gian ước tính (giờ)' },
    { key: 'created_at', label: 'Ngày tạo', render: (val) => formatDate(val) },
  ],
  fieldsForModal: [
    { name: 'name', label: 'Tên', type: 'text' },
    { name: 'description', label: 'Mô tả', type: 'textarea' },
    { name: 'estimated_time', label: 'Thời gian ước tính', type: 'number' },
  ],
  title: 'Dịch vụ',
};

export const offersConfig = {
  columns: [
    { key: 'name', label: 'Tên ưu đãi' },
    { key: 'service_name', label: 'Dịch vụ' },
    { key: 'image_url', label: 'Hình ảnh', render: (val) => val ? <img src={val} alt="Ưu đãi" className="w-12 h-12 rounded object-cover" /> : '-' },
    { key: 'created_at', label: 'Ngày tạo', render: (val) => formatDate(val) },
  ],
  fieldsForModal: [
    { name: 'name', label: 'Tên ưu đãi', type: 'text' },
    { name: 'service_id', label: 'ID Dịch vụ', type: 'number' },
    { name: 'image_url', label: 'URL hình ảnh', type: 'text' },
  ],
  title: 'Ưu đãi',
};

export const warrantiesConfig = {
  columns: [
    { key: 'order_id', label: 'ID Đơn hàng' },
    { key: 'customer_name', label: 'Khách hàng' },
    { key: 'customer_phone', label: 'Số điện thoại' },
    { key: 'warranty_period', label: 'Thời hạn (tháng)' },
    { key: 'start_date', label: 'Ngày bắt đầu', render: (val) => formatDate(val) },
    { key: 'end_date', label: 'Ngày hết hạn', render: (val) => formatDate(val) },
  ],
  fieldsForModal: [
    { name: 'order_id', label: 'ID Đơn hàng', type: 'number' },
    { name: 'customer_id', label: 'ID Khách hàng', type: 'number' },
    { name: 'warranty_period', label: 'Thời hạn (tháng)', type: 'number' },
    { name: 'start_date', label: 'Ngày bắt đầu', type: 'date' },
    { name: 'note', label: 'Ghi chú', type: 'textarea' },
  ],
  title: 'Bảo hành',
};

export const vehiclesConfig = {
  columns: [
    { key: 'image_url', label: 'Hình ảnh', render: (val) => val ? <img src={val} alt="Xe" className="w-16 h-12 rounded object-cover" /> : '-' },
    { 
      key: 'license_plate', 
      label: 'Biển số xe',
      render: (val) => val ? <span className="bg-yellow-400 text-black px-2 py-1 rounded font-bold text-sm">{val}</span> : '-'
    },
    { key: 'model', label: 'Mẫu xe' },
    { key: 'customer_name', label: 'Chủ xe' },
    { key: 'customer_phone', label: 'Số điện thoại' },
    { 
      key: 'order_count', 
      label: 'Số đơn',
      render: (val) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
          val > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
        }`}>
          {val || 0} đơn
        </span>
      )
    },
    { 
      key: 'last_order_date', 
      label: 'Đơn cuối', 
      render: (val) => val ? formatDate(val) : '-' 
    },
    { key: 'created_at', label: 'Ngày thêm', render: (val) => formatDate(val) },
  ],
  fieldsForModal: [
    { name: 'customer_id', label: 'ID Khách hàng', type: 'number' },
    { name: 'license_plate', label: 'Biển số xe', type: 'text' },
    { name: 'model', label: 'Mẫu xe', type: 'text' },
    { name: 'image_url', label: 'URL hình ảnh xe', type: 'text' },
  ],
  title: 'Quản lý xe',
};

