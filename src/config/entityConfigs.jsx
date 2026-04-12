// src/config/entityConfigs.jsx
import { formatDate, formatCurrency, truncateText, formatTimeDuration, formatWarrantyPeriod } from '../utils/format';
import {
  getServiceOrderAssigneeLabel,
  getServiceOrderStatusLabel,
  isOrderWaitingForClaim,
} from '../utils/serviceOrderFlow';
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

// ===== DEALER MANAGEMENT (ADMIN ONLY) =====
export const dealersConfig = {
  columns: [
    createIdColumn(),
    createTextField('name', 'Tên'),
    createTextField('phone', 'Số điện thoại'),
    createTextField('email', 'Email'),
    createTextField('address', 'Địa chỉ'),
  ],
  fieldsForModal: [
    createTextFieldForModal('name', 'Tên', 'text', true),
    createTextFieldForModal('phone', 'Số điện thoại', 'text', true),
    createTextFieldForModal('password', 'Mật khẩu', 'password', true),
    createTextFieldForModal('email', 'Email', 'email'),
    createTextFieldForModal('address', 'Địa chỉ'),
    { name: 'avatar_url', label: 'Ảnh đại diện', type: 'image', multiple: false, maxFiles: 1, uploadMode: 'both' },
  ],
  title: 'Quản lý đại lý',
  apiEndpoint: '/web/dealers',
};

// ===== CUSTOMER MANAGEMENT (ADMIN ONLY) =====
export const customersConfig = {
  columns: [
    createIdColumn(),
    createTextField('name', 'Tên'),
    createTextField('phone', 'Số điện thoại'),
    createTextField('email', 'Email'),
    createImageColumn('avatar_url', 'Ảnh đại diện', "w-8 h-8 rounded-full object-cover"),
    createDateColumn('created_at', 'Ngày tạo'),
  ],
  fieldsForModal: [
    createTextFieldForModal('name', 'Tên', 'text', true),
    createTextFieldForModal('phone', 'Số điện thoại', 'text', true),
    createTextFieldForModal('email', 'Email', 'email'),
    { name: 'avatar_url', label: 'Ảnh đại diện', type: 'image', multiple: false, maxFiles: 1, uploadMode: 'both' },
  ],
  title: 'Quản lý khách hàng',
  apiEndpoint: '/web/customers',
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
  apiEndpoint: '/web/employees',
};

// ===== SERVICE MANAGEMENT =====
export const servicesConfig = {
  columns: [
    createIdColumn(),
    createTextField('name', 'Tên dịch vụ'),
    createTextField('supplier_name', 'Nhà cung cấp'),
    { key: 'category_name', label: 'Danh mục', render: (val, item) => {
      if (val) return val;
      if (item.category_id) return `ID: ${item.category_id}`;
      return '--';
    }},
    { key: 'description', label: 'Mô tả', render: (val) => truncateText(val) },
    { 
      key: 'estimated_time', 
      label: 'Thời gian ước tính', 
      render: (val) => formatTimeDuration(val) // val is in seconds
    },
    { 
      key: 'warranty_period', 
      label: 'Thời gian bảo hành', 
      render: (val) => formatWarrantyPeriod(val) // val is in seconds
    },
    createImageColumn('image_url', 'Hình ảnh'),
    createDateColumn('created_at', 'Ngày tạo'),
  ],
  fieldsForModal: [
    createTextFieldForModal('name', 'Tên dịch vụ', 'text', true),
    createTextFieldForModal('supplier_name', 'Nhà cung cấp'),
    createSelectField('category_id', 'Danh mục dịch vụ', '/web/service-categories'),
    createTextAreaField('description', 'Mô tả'),
    { 
      name: 'estimated_time', 
      label: 'Thời gian ước tính', 
      type: 'time_duration',
    },
    { 
      name: 'warranty_period', 
      label: 'Thời gian bảo hành', 
      type: 'warranty_period',
    },
    { name: 'image_url', label: 'Hình ảnh', type: 'image', multiple: false, maxFiles: 1, uploadMode: 'both' },
  ],
  title: 'Dịch vụ',
  apiEndpoint: '/web/services',
};

// ===== PRODUCT MANAGEMENT =====
export const productsConfig = {
  columns: [
    createIdColumn(),
    createTextField('name', 'Tên sản phẩm'),
    { key: 'price', label: 'Giá', render: (val) => formatCurrency(val) },
    { key: 'category_name', label: 'Danh mục', render: (val, item) => {
      if (val) return val;
      if (item.category_id) return `ID: ${item.category_id}`;
      return '--';
    }},
    { key: 'description', label: 'Mô tả', render: (val) => truncateText(val) },
    { key: 'primary_image', label: 'Ảnh chính', render: (val) => val?.image_url ? <ImagePreview src={val.image_url} alt="Sản phẩm" className="w-12 h-12 rounded object-cover" showModal={false} directDisplay={true} /> : '-' },
    { key: 'images', label: 'Số ảnh', render: (val) => val ? `${val.length} ảnh` : '0 ảnh' },
    createDateColumn('created_at', 'Ngày tạo'),
  ],
  fieldsForModal: [
    createTextFieldForModal('name', 'Tên sản phẩm', 'text', true),
    { name: 'price', label: 'Giá', type: 'number', min: 0, required: true },
    createSelectField('category_id', 'Danh mục', '/web/categories'),
    createTextAreaField('description', 'Mô tả'),
    { 
      name: 'video_url', 
      label: 'URL video', 
      type: 'text', 
      placeholder: 'https://www.youtube.com/watch?v=xxxxx hoặc https://youtu.be/xxxxx',
    },
  ],
  title: 'Sản phẩm',
  apiEndpoint: '/web/products',
};

// ===== SERVICE CATEGORY MANAGEMENT =====
export const dealerProductsConfig = {
  columns: [
    createIdColumn(),
    createTextField('name', 'Tên sản phẩm dealer'),
    { key: 'price', label: 'Giá', render: (val) => formatCurrency(val) },
    { key: 'category_name', label: 'Danh mục sản phẩm đại lí', render: (val, item) => {
      if (val) return val;
      if (item.category_id) return `ID: ${item.category_id}`;
      return '--';
    }},
    { key: 'description', label: 'Mô tả', render: (val) => truncateText(val) },
    { key: 'primary_image', label: 'Ảnh chính', render: (val) => val?.image_url ? <ImagePreview src={val.image_url} alt="Sản phẩm dealer" className="w-12 h-12 rounded object-cover" showModal={false} directDisplay={true} /> : '-' },
    { key: 'images', label: 'Số ảnh', render: (val) => val ? `${val.length} ảnh` : '0 ảnh' },
    createDateColumn('created_at', 'Ngày tạo'),
  ],
  fieldsForModal: [
    createTextFieldForModal('name', 'Tên sản phẩm dealer', 'text', true),
    { name: 'price', label: 'Giá', type: 'number', min: 0, required: true },
    createSelectField('category_id', 'Danh mục sản phẩm đại lí', '/web/categories'),
    createTextAreaField('description', 'Mô tả'),
    {
      name: 'video_url',
      label: 'URL video',
      type: 'text',
      placeholder: 'https://www.youtube.com/watch?v=xxxxx hoặc https://youtu.be/xxxxx',
    },
  ],
  title: 'Sản phẩm dealer',
  apiEndpoint: '/web/products'
};

export const serviceCategoriesConfig = {
  columns: [
    createIdColumn(),
    createTextField('name', 'Tên danh mục'),
    { key: 'description', label: 'Mô tả', render: (val) => truncateText(val) },
    { key: 'service_count', label: 'Số dịch vụ', render: (val) => val ? `${val} dịch vụ` : '0 dịch vụ' },
    createImageColumn('image_url', 'Hình ảnh'),
    createDateColumn('created_at', 'Ngày tạo'),
  ],
  fieldsForModal: [
    createTextFieldForModal('name', 'Tên danh mục', 'text', true),
    createTextAreaField('description', 'Mô tả'),
    { name: 'image_url', label: 'Hình ảnh', type: 'image', multiple: false, maxFiles: 1, uploadMode: 'both' },
  ],
  title: 'Danh mục dịch vụ',
  apiEndpoint: '/web/service-categories',
};

// ===== CATEGORY MANAGEMENT =====
export const categoriesConfig = {
  columns: [
    createIdColumn(),
    createTextField('name', 'Tên danh mục'),
    { key: 'description', label: 'Mô tả', render: (val) => truncateText(val) },
    { key: 'product_count', label: 'Số sản phẩm', render: (val) => val ? `${val} sản phẩm` : '0 sản phẩm' },
    createImageColumn('image_url', 'Hình ảnh'),
    createDateColumn('created_at', 'Ngày tạo'),
  ],
  fieldsForModal: [
    createTextFieldForModal('name', 'Tên danh mục', 'text', true),
    createTextAreaField('description', 'Mô tả'),
    { name: 'image_url', label: 'Hình ảnh', type: 'image', multiple: false, maxFiles: 1, uploadMode: 'both' },
  ],
  title: 'Danh mục sản phẩm',
  apiEndpoint: '/web/categories',
};

// ===== VEHICLE MANAGEMENT =====
export const dealerCategoriesConfig = {
  columns: [
    createIdColumn(),
    createTextField('name', 'Tên danh mục sản phẩm đại lí'),
    { key: 'description', label: 'Mô tả', render: (val) => truncateText(val) },
    { key: 'product_count', label: 'Số sản phẩm', render: (val) => val ? `${val} sản phẩm` : '0 sản phẩm' },
    createImageColumn('image_url', 'Hình ảnh'),
    createDateColumn('created_at', 'Ngày tạo'),
  ],
  fieldsForModal: [
    createTextFieldForModal('name', 'Tên danh mục sản phẩm đại lí', 'text', true),
    createTextAreaField('description', 'Mô tả'),
    { name: 'image_url', label: 'Hình ảnh', type: 'image', multiple: false, maxFiles: 1, uploadMode: 'both' },
  ],
  title: 'Danh mục sản phẩm đại lí',
  apiEndpoint: '/dealer/categories',
};

export const vehiclesConfig = {
  columns: [
    createIdColumn(),
    { key: 'license_plate', label: 'Biển số xe', render: (val) => val ? <span className="bg-[#e0a02e] text-[#112552] px-2 py-1 rounded font-bold text-sm">{val}</span> : '-' },
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
    {
      name: 'customer_id',
      label: 'Khách hàng',
      type: 'select',
      required: true,
      searchable: true,
      apiEndpoint: '/web/customers',
      apiParams: { limit: 1000 },
      valueKey: 'id',
      labelKey: 'name',
      labelFormat: (item) => `${item.name || 'Khách hàng'}${item.phone ? ` - ${item.phone}` : ''}`,
      placeholder: 'Tìm theo tên hoặc số điện thoại',
    },
    createTextFieldForModal('license_plate', 'Biển số xe', 'text', true),
    createTextFieldForModal('model', 'Mẫu xe'),
    { name: 'image_url', label: 'Hình ảnh xe', type: 'image', multiple: false, maxFiles: 1, uploadMode: 'both' },
  ],
  title: 'Quản lý xe',
  apiEndpoint: '/web/vehicles',
};

// ===== SERVICE ORDER MANAGEMENT =====
export const serviceOrdersConfig = {
  columns: [
    createIdColumn(),
    { key: 'customer_name', label: 'Khách hàng', render: (val, item) => <span className="font-medium">{val || (item.customer_id ? `ID: ${item.customer_id}` : '-')}</span> },
    { key: 'service_name', label: 'Dịch vụ', render: (val, item) => val || (item.service_id ? `ID: ${item.service_id}` : '-') },
    { key: 'license_plate', label: 'Biển số', render: (val) => val ? <span className="bg-[#f8ecd6] text-[#8f5f23] px-2 py-0.5 rounded text-xs font-semibold">{val}</span> : '-' },
    { key: 'receiver_name', label: 'Người nhận', render: (val) => <span className="text-sm">{val || '-'}</span> },
    { key: 'receiver_phone', label: 'SĐT', render: (val) => <span className="text-sm">{val || '-'}</span> },
    {
      key: 'employee_name',
      label: 'Nhân viên',
      render: (val, item) => {
        const order = { ...item, employee_name: val || item.employee_name };
        const label = getServiceOrderAssigneeLabel(order);

        if (isOrderWaitingForClaim(order)) {
          return <span className="font-medium text-[#c37b1e] dark:text-[#eecd7e]">{label}</span>;
        }

        if (order.employee_id || val || item.employee?.name) {
          return <span className="font-medium">{label}</span>;
        }

        return <span className="text-gray-400 italic">{label}</span>;
      },
    },
    {
      key: 'status',
      label: 'Trạng thái đơn',
      render: (val, item) => {
        const order = { ...item, status: val || item.status };

        return (
          <StatusBadge
            status={order.status}
            type="order"
            labelOverride={getServiceOrderStatusLabel(order)}
          />
        );
      },
    },
    { key: 'receive_date', label: 'Ngày nhận', render: (val) => val ? <span className="text-xs">{new Date(val).toLocaleDateString('vi-VN')}</span> : '-' },
  ],
  fieldsForModal: [
    createSelectField('customer_id', 'Khách hàng', '/web/customers', 'id', 'name', (item) => `${item.name} - ${item.phone}`),
    createSelectField('service_id', 'Dịch vụ', '/web/services'),
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
  apiEndpoint: '/web/service-orders',
};

// ===== OFFER MANAGEMENT =====
export const offersConfig = {
  columns: [
    createIdColumn(),
    createTextField('name', 'Tên ưu đãi'),
    { key: 'service_name', label: 'Dịch vụ', render: (val, item) => {
      if (val) return val;
      if (item.service_id) return `ID: ${item.service_id}`;
      return '--';
    }},
    { key: 'content', label: 'Nội dung', render: (val) => truncateText(val) },
    { key: 'primary_image', label: 'Ảnh chính', render: (val) => val?.image_url ? <ImagePreview src={val.image_url} alt="Ưu đãi" className="w-12 h-12 rounded object-cover" showModal={false} directDisplay={true} /> : '-' },
    { key: 'images', label: 'Số ảnh', render: (val) => val ? `${val.length} ảnh` : '0 ảnh' },
    createDateColumn('created_at', 'Ngày tạo'),
    createDateColumn('updated_at', 'Ngày cập nhật'),
  ],
  fieldsForModal: [
    createTextFieldForModal('name', 'Tên ưu đãi', 'text', true),
    createSelectField('service_id', 'Dịch vụ', '/services'),
    createTextAreaField('content', 'Nội dung ưu đãi'),
  ],
  title: 'Ưu đãi',
  apiEndpoint: '/web/offers',
};

// ===== WARRANTY MANAGEMENT =====
export const warrantiesConfig = {
  columns: [
    { key: 'id', label: 'ID', render: (val) => <span className="font-mono text-xs">{val}</span> },
    { 
      key: 'order_id', 
      label: 'Đơn hàng', 
      render: (val, item) => {
        // Ưu tiên order_number hoặc order_id
        if (item.order_number) return `#${item.order_number}`;
        if (val) return `#${val}`;
        return '-';
      }
    },
    { 
      key: 'customer_name', 
      label: 'Khách hàng/Đại lý', 
      render: (val, item) => {
        // Ưu tiên customer_name, sau đó đến dealer_name
        if (val) return <span className="font-medium text-slate-100">{val}</span>;
        if (item.dealer_name) return <span className="font-medium text-[#dfe1e3]">Đại lý: {item.dealer_name}</span>;
        if (item.customer?.name) return <span className="font-medium text-slate-100">{item.customer.name}</span>;
        if (item.dealer?.name) return <span className="font-medium text-[#dfe1e3]">Đại lý: {item.dealer.name}</span>;
        if (item.customer_id) return <span className="text-slate-400">KH ID: {item.customer_id}</span>;
        if (item.dealer_id) return <span className="text-[#dfe1e3]">ĐL ID: {item.dealer_id}</span>;
        return '-';
      }
    },
    { 
      key: 'service_name', 
      label: 'Dịch vụ', 
      render: (val, item) => {
        // Ưu tiên service_name, nếu không có thì dùng service.name hoặc service_id
        if (val) return val;
        if (item.service?.name) return item.service.name;
        if (item.service_id) return <span className="text-slate-400">ID: {item.service_id}</span>;
        return '-';
      }
    },
    { 
      key: 'employee_name', 
      label: 'Nhân viên', 
      render: (val, item) => {
        // Ưu tiên employee_name, nếu không có thì dùng employee.name hoặc employee_id
        if (val) return val;
        if (item.employee?.name) return item.employee.name;
        if (item.employee_id) return <span className="text-slate-400">ID: {item.employee_id}</span>;
        return <span className="text-slate-400 italic">Chưa giao</span>;
      }
    },
    { key: 'warranty_period', label: 'Thời hạn (tháng)', render: (val) => `${val} tháng` },
    { key: 'start_date', label: 'Ngày bắt đầu', render: (val) => formatDate(val) },
    { key: 'end_date', label: 'Ngày hết hạn', render: (val) => formatDate(val) },
    { key: 'note', label: 'Ghi chú', render: (val) => truncateText(val) },
    { key: 'created_at', label: 'Ngày tạo', render: (val) => formatDate(val) },
  ],
  fieldsForModal: [
    { 
      name: 'dealer_id', 
      label: 'Đại lý', 
      type: 'select', 
      required: true,
      apiEndpoint: '/dealers',
      valueKey: 'id',
      labelKey: 'name',
      labelFormat: (item) => `${item.name} - ${item.phone}`
    },
    { 
      name: 'service_id', 
      label: 'Dịch vụ', 
      type: 'select', 
      required: true,
      apiEndpoint: '/services',
      valueKey: 'id',
      labelKey: 'name'
    },
    { name: 'warranty_period', label: 'Thời hạn (tháng)', type: 'number', min: 1, required: true },
    { name: 'start_date', label: 'Ngày bắt đầu', type: 'date', required: true },
    { name: 'end_date', label: 'Ngày hết hạn', type: 'date', disabled: true, placeholder: 'Tự động tính từ ngày bắt đầu và thời hạn' },
    { name: 'note', label: 'Ghi chú', type: 'textarea' },
  ],
  title: 'Bảo hành',
  apiEndpoint: '/web/warranties',
};

// ===== NOTIFICATION MANAGEMENT =====
export const notificationsConfig = {
  columns: [
    { key: 'id', label: 'ID', render: (val) => <span className="font-mono text-xs">{val}</span> },
    { key: 'recipient_id', label: 'ID Người nhận', render: (val) => <span className="font-mono text-xs">{val}</span> },
    { key: 'recipient_type', label: 'Loại người nhận', render: (val) => <StatusBadge status={val} type="user" /> },
    { key: 'message', label: 'Nội dung', render: (val) => truncateText(val) },
    { key: 'image_url', label: 'Hình ảnh', render: (val) => <ImagePreview src={val} alt="Thông báo" className="w-12 h-12 rounded" showModal={false} directDisplay={true} /> },
    { key: 'is_read', label: 'Đã đọc', render: (val) => val ? <span className="text-[#8f5f23]">✓</span> : <span className="text-[#8f5f23]">✗</span> },
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
  apiEndpoint: '/web/notifications',
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
      { value: 'received', label: 'Đã tiếp nhận' },
      { value: 'in_progress', label: 'Đang xử lý' },
      { value: 'ready_for_pickup', label: 'Sẵn sàng bàn giao' },
      { value: 'completed', label: 'Hoàn thành' }
    ], required: true },
    { name: 'description', label: 'Mô tả', type: 'textarea' },
    { 
      name: 'uploaded_by', 
      label: 'Người upload', 
      type: 'select', 
      required: true,
      apiEndpoint: '/web/employees',
      valueKey: 'id',
      labelKey: 'name',
      labelFormat: (item) => `${item.name} - ${item.phone}`
    },
  ],
  title: 'Hình ảnh đơn hàng',
  apiEndpoint: '/web/service-orders/images',
};

// ===== PRODUCT IMAGES =====
export const productImagesConfig = {
  columns: [
    { key: 'id', label: 'ID', render: (val) => <span className="font-mono text-xs">{val}</span> },
    { key: 'product_id', label: 'ID Sản phẩm', render: (val) => <span className="font-mono text-xs">{val}</span> },
    { key: 'image_url', label: 'Hình ảnh', render: (val) => <ImagePreview src={val} alt="Hình sản phẩm" className="w-20 h-16 rounded border border-gray-200" showModal={false} directDisplay={true} /> },
    { key: 'is_primary', label: 'Ảnh chính', render: (val) => val ? <span className="text-[#8f5f23] font-semibold">✓</span> : <span className="text-gray-400">-</span> },
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
