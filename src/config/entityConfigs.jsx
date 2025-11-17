// src/config/entityConfigs.jsx
import { formatDate, formatCurrency, truncateText } from '../utils/format';
import StatusBadge from '../components/ui/StatusBadge';
import ImagePreview from '../components/image/ImagePreview';

/**
 * Centralized entity configurations with optimized helper functions
 * Eliminates duplication and makes it easy to manage all entity settings
 */

// Helper functions to reduce duplication
const createIdColumn = () => ({ 
  key: 'id', 
  label: 'ID', 
  render: (val) => <span className="font-mono text-xs">{val}</span> 
});

const createDateColumn = (key, label) => ({ 
  key, 
  label, 
  render: (val) => formatDate(val) 
});

const createImageColumn = (key, label, className = "w-12 h-12 rounded") => ({ 
  key, 
  label, 
  render: (val) => <ImagePreview src={val} alt={label} className={className} showModal={false} directDisplay={true} /> 
});

const createSelectField = (name, label, apiEndpoint, valueKey = 'id', labelKey = 'name', labelFormat = null) => ({
  name,
  label,
  type: 'select',
  required: true,
  apiEndpoint,
  valueKey,
  labelKey,
  ...(labelFormat && { labelFormat })
});

const createTextAreaField = (name, label, required = false) => ({
  name,
  label,
  type: 'textarea',
  ...(required && { required })
});

const createTextField = (key, label) => ({ key, label });

const createTextFieldForModal = (name, label, type = 'text', required = false) => ({
  name,
  label,
  type,
  ...(required && { required })
});

// ===== CUSTOMER MANAGEMENT (ADMIN ONLY) =====
export const customersConfig = {
  columns: [
    createIdColumn(),
    createTextField('name', 'Tên'),
    createTextField('phone', 'Số điện thoại'),
    createTextField('email', 'Email'),
    createTextField('license_plate', 'Biển số xe'),
    createImageColumn('avatar_url', 'Ảnh đại diện', "w-8 h-8 rounded-full object-cover"),
    createDateColumn('created_at', 'Ngày tạo'),
  ],
  fieldsForModal: [
    createTextFieldForModal('name', 'Tên', 'text', true),
    createTextFieldForModal('phone', 'Số điện thoại', 'text', true),
    createTextFieldForModal('email', 'Email', 'email'),
    createTextFieldForModal('license_plate', 'Biển số xe'),
    { name: 'avatar_url', label: 'Ảnh đại diện', type: 'image', multiple: false, maxFiles: 1, uploadMode: 'both' },
  ],
  title: 'Quản lý khách hàng',
  apiEndpoint: '/customers',
};

// ===== EMPLOYEE MANAGEMENT (ADMIN ONLY) =====
export const employeesConfig = {
  columns: [
    createIdColumn(),
    createTextField('name', 'Tên'),
    createTextField('phone', 'Số điện thoại'),
    createImageColumn('avatar_url', 'Ảnh đại diện', "w-8 h-8 rounded-full object-cover"),
    createDateColumn('created_at', 'Ngày tạo'),
  ],
  fieldsForModal: [
    createTextFieldForModal('name', 'Tên', 'text', true),
    createTextFieldForModal('phone', 'Số điện thoại', 'text', true),
    createTextFieldForModal('password', 'Mật khẩu', 'password', true),
    { name: 'avatar_url', label: 'Ảnh đại diện', type: 'image', multiple: false, maxFiles: 1, uploadMode: 'both' },
  ],
  title: 'Quản lý nhân viên',
  apiEndpoint: '/employees',
};

// ===== SERVICE MANAGEMENT =====
export const servicesConfig = {
  columns: [
    createIdColumn(),
    createTextField('name', 'Tên dịch vụ'),
    { key: 'description', label: 'Mô tả', render: (val) => truncateText(val) },
    { key: 'estimated_time', label: 'Thời gian ước tính (giờ)', render: (val) => `${val}h` },
    createImageColumn('image_url', 'Hình ảnh'),
    createDateColumn('created_at', 'Ngày tạo'),
  ],
  fieldsForModal: [
    createTextFieldForModal('name', 'Tên dịch vụ', 'text', true),
    createTextAreaField('description', 'Mô tả'),
    { name: 'estimated_time', label: 'Thời gian ước tính (giờ)', type: 'number', min: 1 },
    createTextFieldForModal('image_url', 'URL hình ảnh'),
  ],
  title: 'Dịch vụ',
  apiEndpoint: '/services',
};

// ===== PRODUCT MANAGEMENT =====
export const productsConfig = {
  columns: [
    createIdColumn(),
    createTextField('name', 'Tên sản phẩm'),
    { key: 'price', label: 'Giá', render: (val) => formatCurrency(val) },
    createTextField('category_name', 'Danh mục'),
    { key: 'description', label: 'Mô tả', render: (val) => truncateText(val) },
    { key: 'primary_image', label: 'Ảnh chính', render: (val) => val?.image_url ? <ImagePreview src={val.image_url} alt="Sản phẩm" className="w-12 h-12 rounded object-cover" showModal={false} directDisplay={true} /> : '-' },
    { key: 'images', label: 'Số ảnh', render: (val) => val ? `${val.length} ảnh` : '0 ảnh' },
    createDateColumn('created_at', 'Ngày tạo'),
  ],
  fieldsForModal: [
    createTextFieldForModal('name', 'Tên sản phẩm', 'text', true),
    { name: 'price', label: 'Giá', type: 'number', min: 0, required: true },
    createSelectField('category_id', 'Danh mục', '/categories'),
    createTextAreaField('description', 'Mô tả'),
  ],
  title: 'Sản phẩm',
  apiEndpoint: '/products',
};

// ===== CATEGORY MANAGEMENT =====
export const categoriesConfig = {
  columns: [
    createIdColumn(),
    createTextField('name', 'Tên danh mục'),
    { key: 'description', label: 'Mô tả', render: (val) => truncateText(val) },
    createImageColumn('image_url', 'Hình ảnh'),
    createDateColumn('created_at', 'Ngày tạo'),
  ],
  fieldsForModal: [
    createTextFieldForModal('name', 'Tên danh mục', 'text', true),
    createTextAreaField('description', 'Mô tả'),
    { name: 'image_url', label: 'Hình ảnh', type: 'image', multiple: false, maxFiles: 1, uploadMode: 'both' },
  ],
  title: 'Danh mục sản phẩm',
  apiEndpoint: '/categories',
};

// ===== VEHICLE MANAGEMENT =====
export const vehiclesConfig = {
  columns: [
    createIdColumn(),
    { key: 'license_plate', label: 'Biển số xe', render: (val) => val ? <span className="bg-yellow-400 text-black px-2 py-1 rounded font-bold text-sm">{val}</span> : '-' },
    { key: 'model', label: 'Mẫu xe', render: (val) => {
      // Display model or show '-' if null/empty
      if (!val || val === 'null' || val === null) return <span className="text-gray-400 italic">Chưa có</span>;
      return val;
    }},
    { key: 'customer_name', label: 'Khách hàng', render: (val, item) => {
      // Ưu tiên customer_name, nếu không có thì dùng customer.name hoặc customer_id
      if (val) return val;
      if (item.customer && item.customer.name) return item.customer.name;
      if (item.customer_id) return `ID: ${item.customer_id}`;
      return '-';
    }},
    createImageColumn('image_url', 'Hình ảnh', "w-16 h-12 rounded"),
    createDateColumn('created_at', 'Ngày tạo'),
  ],
  fieldsForModal: [
    { name: 'customer_id', label: 'Khách hàng', type: 'text', disabled: true, placeholder: 'Không thể thay đổi' },
    createTextFieldForModal('license_plate', 'Biển số xe', 'text', true),
    createTextFieldForModal('model', 'Mẫu xe'),
    { name: 'image_url', label: 'Hình ảnh xe', type: 'image', multiple: false, maxFiles: 1, uploadMode: 'both' },
  ],
  title: 'Quản lý xe',
  apiEndpoint: '/vehicles',
};

// ===== SERVICE ORDER MANAGEMENT =====
export const serviceOrdersConfig = {
  columns: [
    createIdColumn(),
    { key: 'customer_name', label: 'Khách hàng', render: (val, item) => <span className="font-medium">{val || (item.customer_id ? `ID: ${item.customer_id}` : '-')}</span> },
    { key: 'service_name', label: 'Dịch vụ', render: (val, item) => val || (item.service_id ? `ID: ${item.service_id}` : '-') },
    { key: 'license_plate', label: 'Biển số', render: (val) => val ? <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs font-semibold">{val}</span> : '-' },
    { key: 'receiver_name', label: 'Người nhận', render: (val) => <span className="text-sm">{val || '-'}</span> },
    { key: 'receiver_phone', label: 'SĐT', render: (val) => <span className="text-sm">{val || '-'}</span> },
    { key: 'employee_name', label: 'Nhân viên', render: (val, item) => val || (item.employee_id ? `ID: ${item.employee_id}` : <span className="text-gray-400 italic">Chưa giao</span>) },
    { key: 'status', label: 'Trạng thái', render: (val) => <StatusBadge status={val} type="order" /> },
    { key: 'receive_date', label: 'Ngày nhận', render: (val) => val ? <span className="text-xs">{new Date(val).toLocaleDateString('vi-VN')}</span> : '-' },
  ],
  fieldsForModal: [
    createSelectField('customer_id', 'Khách hàng', '/customers', 'id', 'name', (item) => `${item.name} - ${item.phone}`),
    createSelectField('service_id', 'Dịch vụ', '/services'),
    createTextFieldForModal('license_plate', 'Biển số xe', 'text', true),
    createTextFieldForModal('vehicle_type', 'Loại xe'),
    createTextFieldForModal('receiver_name', 'Tên người nhận', 'text', true),
    createTextFieldForModal('receiver_phone', 'SĐT người nhận', 'text', true),
    createTextAreaField('address', 'Địa chỉ', true),
    { name: 'receive_date', label: 'Ngày nhận', type: 'date', required: true },
    { name: 'delivery_date', label: 'Ngày giao', type: 'date' },
    createTextAreaField('note', 'Ghi chú'),
  ],
  title: 'Đơn dịch vụ',
  apiEndpoint: '/service-orders',
};

// ===== OFFER MANAGEMENT =====
export const offersConfig = {
  columns: [
    createIdColumn(),
    createTextField('name', 'Tên ưu đãi'),
    { key: 'service_id', label: 'ID Dịch vụ', render: (val) => <span className="font-mono text-xs">{val}</span> },
    createImageColumn('image_url', 'Hình ảnh'),
    createDateColumn('created_at', 'Ngày tạo'),
    createDateColumn('updated_at', 'Ngày cập nhật'),
  ],
  fieldsForModal: [
    createTextFieldForModal('name', 'Tên ưu đãi', 'text', true),
    createSelectField('service_id', 'Dịch vụ', '/services'),
    createTextFieldForModal('image_url', 'URL hình ảnh'),
  ],
  title: 'Ưu đãi',
  apiEndpoint: '/offers',
};

// ===== WARRANTY MANAGEMENT =====
export const warrantiesConfig = {
  columns: [
    { key: 'id', label: 'ID', render: (val) => <span className="font-mono text-xs">{val}</span> },
    { key: 'order_id', label: 'ID Đơn hàng', render: (val) => <span className="font-mono text-xs">{val}</span> },
    { key: 'customer_id', label: 'ID Khách hàng', render: (val) => <span className="font-mono text-xs">{val}</span> },
    { key: 'warranty_period', label: 'Thời hạn (tháng)', render: (val) => `${val} tháng` },
    { key: 'start_date', label: 'Ngày bắt đầu', render: (val) => formatDate(val) },
    { key: 'end_date', label: 'Ngày hết hạn', render: (val) => formatDate(val) },
    { key: 'note', label: 'Ghi chú', render: (val) => truncateText(val) },
    { key: 'created_at', label: 'Ngày tạo', render: (val) => formatDate(val) },
  ],
  fieldsForModal: [
    { 
      name: 'order_id', 
      label: 'Đơn hàng', 
      type: 'select', 
      required: true,
      apiEndpoint: '/service-orders',
      valueKey: 'id',
      labelKey: 'id',
      labelFormat: (item) => `#${item.id} - ${item.receiver_name} (${item.license_plate})`
    },
    { 
      name: 'customer_id', 
      label: 'Khách hàng', 
      type: 'select', 
      required: true,
      apiEndpoint: '/customers',
      valueKey: 'id',
      labelKey: 'name',
      labelFormat: (item) => `${item.name} - ${item.phone}`
    },
    { name: 'warranty_period', label: 'Thời hạn (tháng)', type: 'number', min: 1, required: true },
    { name: 'start_date', label: 'Ngày bắt đầu', type: 'date', required: true },
    { name: 'note', label: 'Ghi chú', type: 'textarea' },
  ],
  title: 'Bảo hành',
  apiEndpoint: '/warranties',
};

// ===== NOTIFICATION MANAGEMENT =====
export const notificationsConfig = {
  columns: [
    { key: 'id', label: 'ID', render: (val) => <span className="font-mono text-xs">{val}</span> },
    { key: 'recipient_id', label: 'ID Người nhận', render: (val) => <span className="font-mono text-xs">{val}</span> },
    { key: 'recipient_type', label: 'Loại người nhận', render: (val) => <StatusBadge status={val} type="user" /> },
    { key: 'message', label: 'Nội dung', render: (val) => truncateText(val) },
    { key: 'image_url', label: 'Hình ảnh', render: (val) => <ImagePreview src={val} alt="Thông báo" className="w-12 h-12 rounded" showModal={false} directDisplay={true} /> },
    { key: 'is_read', label: 'Đã đọc', render: (val) => val ? <span className="text-green-600">✓</span> : <span className="text-red-600">✗</span> },
    { key: 'created_at', label: 'Ngày tạo', render: (val) => formatDate(val) },
  ],
  fieldsForModal: [
    { name: 'recipient_id', label: 'ID Người nhận', type: 'number', required: true },
    { name: 'recipient_type', label: 'Loại người nhận', type: 'select', options: [
      { value: 'customer', label: 'Khách hàng' },
      { value: 'employee', label: 'Nhân viên' }
    ], required: true },
    { name: 'message', label: 'Nội dung', type: 'textarea', required: true },
    { name: 'image_url', label: 'URL hình ảnh', type: 'text' },
  ],
  title: 'Thông báo',
  apiEndpoint: '/notifications',
};

// ===== SERVICE ORDER IMAGES =====
export const serviceOrderImagesConfig = {
  columns: [
    { key: 'id', label: 'ID', render: (val) => <span className="font-mono text-xs">{val}</span> },
    { key: 'order_id', label: 'ID Đơn hàng', render: (val) => <span className="font-mono text-xs">{val}</span> },
    { key: 'image_url', label: 'Hình ảnh', render: (val) => <ImagePreview src={val} alt="Hình đơn hàng" className="w-16 h-12 rounded" showModal={false} directDisplay={true} /> },
    { key: 'status_at_time', label: 'Trạng thái lúc chụp', render: (val) => <StatusBadge status={val} type="image_status" /> },
    { key: 'description', label: 'Mô tả', render: (val) => truncateText(val) },
    { key: 'uploaded_by', label: 'Upload bởi', render: (val) => <span className="font-mono text-xs">{val}</span> },
    { key: 'created_at', label: 'Ngày tạo', render: (val) => formatDate(val) },
  ],
  fieldsForModal: [
    { 
      name: 'order_id', 
      label: 'Đơn hàng', 
      type: 'select', 
      required: true,
      apiEndpoint: '/service-orders',
      valueKey: 'id',
      labelKey: 'id',
      labelFormat: (item) => `#${item.id} - ${item.receiver_name} (${item.license_plate})`
    },
    { name: 'image_url', label: 'Hình ảnh', type: 'image', multiple: false, maxFiles: 1, uploadMode: 'both', required: true },
    { name: 'status_at_time', label: 'Trạng thái lúc chụp', type: 'select', options: [
      { value: 'received', label: 'Đã nhận' },
      { value: 'in_progress', label: 'Đang xử lý' },
      { value: 'completed', label: 'Hoàn thành' }
    ], required: true },
    { name: 'description', label: 'Mô tả', type: 'textarea' },
    { 
      name: 'uploaded_by', 
      label: 'Người upload', 
      type: 'select', 
      required: true,
      apiEndpoint: '/employees',
      valueKey: 'id',
      labelKey: 'name',
      labelFormat: (item) => `${item.name} - ${item.phone}`
    },
  ],
  title: 'Hình ảnh đơn hàng',
  apiEndpoint: '/service-order-images',
};

// ===== PRODUCT IMAGES =====
export const productImagesConfig = {
  columns: [
    { key: 'id', label: 'ID', render: (val) => <span className="font-mono text-xs">{val}</span> },
    { key: 'product_id', label: 'ID Sản phẩm', render: (val) => <span className="font-mono text-xs">{val}</span> },
    { key: 'image_url', label: 'Hình ảnh', render: (val) => <ImagePreview src={val} alt="Hình sản phẩm" className="w-20 h-16 rounded border border-gray-200" showModal={false} directDisplay={true} /> },
    { key: 'is_primary', label: 'Ảnh chính', render: (val) => val ? <span className="text-green-600 font-semibold">✓</span> : <span className="text-gray-400">-</span> },
    { key: 'created_at', label: 'Ngày tạo', render: (val) => formatDate(val) },
  ],
  fieldsForModal: [
    { 
      name: 'product_id', 
      label: 'Sản phẩm', 
      type: 'select', 
      required: true,
      apiEndpoint: '/products',
      valueKey: 'id',
      labelKey: 'name'
    },
    { name: 'image_url', label: 'Hình ảnh', type: 'image', multiple: false, maxFiles: 1, uploadMode: 'both', required: true },
    { name: 'is_primary', label: 'Ảnh chính', type: 'checkbox' },
  ],
  title: 'Hình ảnh sản phẩm',
  apiEndpoint: '/products/images',
};

