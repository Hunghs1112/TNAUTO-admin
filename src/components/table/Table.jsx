// src/components/table/Table.jsx
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import FormModal from '../form/FormModal';
import FormField from '../form/FormField';
import Pagination from '../ui/Pagination';
import TableActionButtons from './TableActionButtons';
import EmptyState from '../ui/EmptyState';
import LoadingSpinner from '../ui/LoadingSpinner';
import { TableSkeleton } from '../ui/SkeletonLoader';
import SearchInput from './SearchInput';
import httpClient from '../../services/api';
import { 
  Plus, 
  ArrowUpDown, ArrowUp, ArrowDown,
  Eye, RefreshCw, Trash2, Edit2, X
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

/**
 * Modern, feature-rich table component
 * - Responsive design
 * - Sortable columns
 * - Search functionality
 * - Smooth animations
 * - Bulk actions
 */
export default function GenericTable({ 
  data = [], 
  columns, 
  onEdit, 
  onDelete, 
  onView, 
  title, 
  api, 
  idKey = 'id', 
  customActions, 
  fieldsForModal = [],
  showPagination = false,
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  limit = 10,
  onPageChange = () => {},
  loading = false,
  isRefreshing = false,
  showActions = true,
  showSearch = false,
  searchPlaceholder = 'Tìm kiếm...',
  onSearch = null,
  hideTitle = false,
  enableSort = true,
  enableBulkActions = false,
  onRefresh = null,
  onRowClick = null,
  tableActionsRef = null,
  showTableHeaderActions = true,
  disableCreate = false
}) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [formReloadKey, setFormReloadKey] = useState(0); // Key để force reload form options
  const { error: showError, success: showSuccess } = useToast();
  
  // Frontend search handler - no API call
  const handleSearch = useCallback((value) => {
    setSearchTerm(value.toLowerCase().trim());
  }, []);

  // Filter and sort data - Frontend only
  const sortedData = useMemo(() => {
    let filtered = data;
    
    // Frontend search filter
    if (searchTerm) {
      filtered = data.filter((item) => {
        // Search across all columns
        return columns.some((col) => {
          const value = item[col.key];
          if (value === null || value === undefined) return false;
          
          // Convert to string and search (case insensitive)
          const searchValue = String(value).toLowerCase();
          return searchValue.includes(searchTerm);
        });
      });
    }
    
    // Sort if enabled
    if (enableSort && sortConfig.key) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        
        if (aVal === bVal) return 0;
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        
        const comparison = aVal < bVal ? -1 : 1;
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }
    
    return filtered;
  }, [data, searchTerm, sortConfig, enableSort, columns]);

  // Handle sort
  const handleSort = (key) => {
    if (!enableSort) return;
    
    setSortConfig(prev => {
      if (prev.key === key) {
        if (prev.direction === 'asc') return { key, direction: 'desc' };
        if (prev.direction === 'desc') return { key: null, direction: null };
      }
      return { key, direction: 'asc' };
    });
  };

  // Handle selection
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedRows(new Set(sortedData.map(item => item[idKey])));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (id, checked) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedRows(newSelected);
  };

  // Handle actions
  const handleEdit = (item) => {
    // Nếu có callback tùy chỉnh, dùng callback đó
    if (onEdit && typeof onEdit === 'function') {
      onEdit(item);
      return;
    }
    // Nếu không, dùng logic mặc định
    setSelectedItem(item);
    setIsEdit(true);
    setShowModal(true);
    // Tăng reload key để force reload options mỗi khi mở modal
    setFormReloadKey(prev => prev + 1);
  };

  const handleDelete = async (id) => {
    setConfirmDelete(id);
  };

  const confirmDeleteAction = async () => {
    if (!confirmDelete) return;
    
    try {
      await api.delete(confirmDelete);
      onDelete(confirmDelete);
      setConfirmDelete(null);
      showSuccess('Xóa thành công!');
    } catch (err) {
      console.error('Delete error:', err);
      showError('Có lỗi xảy ra khi xóa. Vui lòng thử lại.');
    }
  };

  const handleView = (item) => {
    // Nếu có callback tùy chỉnh (như ServiceOrderManagement có form riêng), gọi nó
    if (onView && typeof onView === 'function') {
      // Kiểm tra xem có phải function rỗng không bằng cách kiểm tra độ dài code
      const funcStr = onView.toString().replace(/\s+/g, '');
      // Function rỗng thường có dạng: () => {} hoặc function() {}
      // Nếu function có ít hơn 10 ký tự sau khi loại bỏ khoảng trắng, có thể là function rỗng
      // Nhưng để an toàn, chúng ta kiểm tra pattern cụ thể
      const isEmptyFunc = funcStr.match(/^\([^)]*\)=>\{\}$/) || 
                         funcStr.match(/^function\([^)]*\)\{\}$/);
      
      if (!isEmptyFunc) {
        // Gọi callback tùy chỉnh và return (không mở modal mặc định)
        onView(item);
        return;
      }
      // Nếu là function rỗng, tiếp tục với logic mặc định
    }
    // Dùng logic mặc định - Form sửa chung cho tất cả các trang khác
    setDetailItem(item);
    setSelectedItem(item);
    setIsEdit(true); // Mở form sửa luôn
    setShowDetailModal(true);
    // Tăng reload key để force reload options mỗi khi mở modal
    setFormReloadKey(prev => prev + 1);
  };

  // Form content component for edit mode
  const FormContent = ({ item, isEdit, onSave, fields = [] }) => {
    const [formData, setFormData] = useState({});
    const [fieldOptions, setFieldOptions] = useState({});
    const [loadingOptions, setLoadingOptions] = useState(false);

    useEffect(() => {
      if (item) {
        setFormData(item);
      } else {
        setFormData({});
      }
    }, [item]);

    // Load dynamic options for select fields with apiEndpoint
    useEffect(() => {
      const loadDynamicOptions = async () => {
        const fieldsWithApi = fields.filter(f => f.type === 'select' && f.apiEndpoint);
        if (fieldsWithApi.length === 0) return;

        setLoadingOptions(true);
        try {
          const optionsData = {};
          
          await Promise.all(fieldsWithApi.map(async (field) => {
            try {
              const response = await httpClient.get(field.apiEndpoint);
              const raw = response.data;
              
              // Chuẩn hóa nhiều kiểu response khác nhau về mảng
              let dataArray = [];
              if (Array.isArray(raw?.data)) {
                dataArray = raw.data;
              } else if (Array.isArray(raw)) {
                dataArray = raw;
              } else if (Array.isArray(raw?.data?.data)) {
                dataArray = raw.data.data;
              } else if (Array.isArray(raw?.data?.items)) {
                dataArray = raw.data.items;
              } else if (Array.isArray(raw?.items)) {
                dataArray = raw.items;
              } else {
                // Thử tìm mảng đầu tiên trong object (data hoặc raw)
                const source = raw?.data && typeof raw.data === 'object' ? raw.data : raw;
                if (source && typeof source === 'object') {
                  const firstArray = Object.values(source).find(v => Array.isArray(v));
                  if (firstArray) {
                    dataArray = firstArray;
                  }
                }
              }
              
              // Format options based on field config
              optionsData[field.name] = dataArray.map(item => ({
                value: item[field.valueKey || 'id'],
                label: field.labelFormat 
                  ? field.labelFormat(item)
                  : item[field.labelKey || 'name']
              }));
            } catch (err) {
              console.error(`Error loading options for ${field.name}:`, err);
              optionsData[field.name] = [];
            }
          }));

          setFieldOptions(optionsData);
        } catch (err) {
          console.error('Error loading dynamic options:', err);
        } finally {
          setLoadingOptions(false);
        }
      };

      loadDynamicOptions();
    }, [fields]);

    const handleChange = (fieldName, e) => {
      // Handle both regular input events and custom events (like image upload)
      let value;
      if (e && typeof e === 'object') {
        if (e.target && e.target.value !== undefined) {
          value = e.target.value;
        } else if (e.value !== undefined) {
          value = e.value;
        } else {
          value = e;
        }
      } else {
        value = e;
      }
      console.log(`Form field ${fieldName} changed to:`, value);
      setFormData({ ...formData, [fieldName]: value });
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      // For disabled customer_id field, ensure we send the original ID, not the displayed name
      const dataToSave = { ...formData };
      if (fields.find(f => f.name === 'customer_id' && f.disabled) && item && item.customer_id) {
        dataToSave.customer_id = item.customer_id;
      }
      onSave(dataToSave);
    };

    return (
      <form onSubmit={handleSubmit}>
        {loadingOptions && (
          <div className="mb-4 text-center text-gray-600 dark:text-gray-300">
            <div className="inline-block w-4 h-4 border-2 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full animate-spin mr-2" />
            Đang tải dữ liệu...
          </div>
        )}
        
        {fields.map((field) => {
          // Use dynamic options if available, otherwise use static options
          const options = field.apiEndpoint && fieldOptions[field.name]
            ? fieldOptions[field.name]
            : field.options || [];

          // Handle image field props
          const imageProps = (field.type === 'image' || field.type === 'image_url') ? {
            multiple: field.multiple || false,
            maxFiles: field.maxFiles || 1,
            uploadMode: field.uploadMode || 'both',
            allowFileUpload: field.allowFileUpload !== false,
            allowLinkUpload: field.allowLinkUpload !== false
          } : {};

          // For disabled customer_id field, show customer name instead of ID
          let displayValue = formData[field.name];
          if (field.name === 'customer_id' && field.disabled && item) {
            // Try to get customer name from various sources
            displayValue = item.customer_name || 
                          (item.customer && item.customer.name) || 
                          `ID: ${item.customer_id}` || 
                          formData[field.name];
          }
          
          // For time_duration field, keep as number (seconds) for FormField to handle conversion
          if (field.type === 'time_duration' && displayValue !== null && displayValue !== undefined) {
            displayValue = typeof displayValue === 'number' ? displayValue : Number(displayValue);
          }

          return (
            <FormField
              key={field.name}
              name={field.name}
              label={field.label}
              type={field.type}
              value={displayValue}
              onChange={(e) => {
                // For image fields, e is already { target: { name, value } }
                // For other fields, e is the event object
                if (field.type === 'image' || field.type === 'image_url') {
                  handleChange(field.name, e);
                } else {
                  handleChange(field.name, e.target.value);
                }
              }}
              required={field.required}
              placeholder={field.placeholder}
              options={options}
              min={field.min}
              max={field.max}
              rows={field.rows}
              disabled={field.disabled || (field.apiEndpoint && loadingOptions)}
              {...imageProps}
            />
          );
        })}
        
            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-slate-800">
              <button 
                type="button" 
                onClick={() => {
                  setShowDetailModal(false);
                  setDetailItem(null);
                  setSelectedItem(null);
                }} 
                className="px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors text-sm font-medium"
              >
                Hủy
              </button>
              <button type="submit" className="btn-gradient-primary text-sm" disabled={loadingOptions}>
                Lưu
              </button>
            </div>
      </form>
    );
  };


  const handleSave = async (savedData) => {
    try {
      console.log('Saving data:', savedData);
      console.log('Image URL in saved data:', savedData.image_url);
      
      const dataToSave = { ...savedData };
      
      // estimated_time is now in seconds (from days/hours input), no conversion needed
      
      // Ensure customer_id is sent (not customer_name) for vehicles
      if (dataToSave.customer_id && typeof dataToSave.customer_id === 'string' && dataToSave.customer_id.startsWith('ID: ')) {
        // Extract ID from "ID: 123" format
        dataToSave.customer_id = parseInt(dataToSave.customer_id.replace('ID: ', ''));
      }
      
      // Check if this is product or service and if category_id is present
      const hasCategoryId = dataToSave.category_id !== null && dataToSave.category_id !== undefined && dataToSave.category_id !== '';
      const isProduct = title && (title.toLowerCase().includes('sản phẩm') || title.toLowerCase().includes('product'));
      const isService = title && (title.toLowerCase().includes('dịch vụ') || title.toLowerCase().includes('service'));
      
      // Store old category_id if editing
      const oldCategoryId = isEdit && selectedItem ? selectedItem.category_id : null;
      
      if (isEdit) {
        await api.update(selectedItem[idKey], dataToSave);
        showSuccess('Cập nhật thành công!');
        
        // If category_id changed, notify Categories/ServiceCategories to refresh
        if (hasCategoryId && oldCategoryId !== dataToSave.category_id) {
          if (isProduct) {
            console.log('[Table] Product category changed, dispatching productCategoryChanged event');
            sessionStorage.setItem('productCategoryChanged', Date.now().toString());
            window.dispatchEvent(new CustomEvent('productCategoryChanged'));
          } else if (isService) {
            console.log('[Table] Service category changed, dispatching serviceCategoryChanged event');
            sessionStorage.setItem('serviceCategoryChanged', Date.now().toString());
            window.dispatchEvent(new CustomEvent('serviceCategoryChanged'));
          }
        }
      } else {
        await api.create(dataToSave);
        showSuccess('Tạo mới thành công!');
        
        // If new item has category_id, notify Categories/ServiceCategories to refresh
        if (hasCategoryId) {
          if (isProduct) {
            console.log('[Table] New product with category, dispatching productCategoryChanged event');
            sessionStorage.setItem('productCategoryChanged', Date.now().toString());
            window.dispatchEvent(new CustomEvent('productCategoryChanged'));
          } else if (isService) {
            console.log('[Table] New service with category, dispatching serviceCategoryChanged event');
            sessionStorage.setItem('serviceCategoryChanged', Date.now().toString());
            window.dispatchEvent(new CustomEvent('serviceCategoryChanged'));
          }
        }
      }
      
      // Close modal and reset form first
      setShowModal(false);
      setSelectedItem(null);
      setIsEdit(false);
      
      // Refresh data - try multiple approaches to ensure data is updated
      // First, try immediate refresh
      if (onRefresh && typeof onRefresh === 'function') {
        console.log('Refreshing data via onRefresh (immediate)...');
        onRefresh();
      } else if (onEdit && typeof onEdit === 'function') {
        console.log('Refreshing data via onEdit (immediate)...');
        onEdit();
      }
      
      // Also try after a delay to ensure API has fully processed
      setTimeout(() => {
        if (onRefresh && typeof onRefresh === 'function') {
          console.log('Refreshing data via onRefresh (delayed)...');
          onRefresh();
        } else if (onEdit && typeof onEdit === 'function') {
          console.log('Refreshing data via onEdit (delayed)...');
          onEdit();
        }
      }, 500); // Delay to ensure API has processed
    } catch (err) {
      console.error('Save error:', err);
      showError('Có lỗi xảy ra khi lưu. Vui lòng thử lại.');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRows.size === 0) return;
    if (!window.confirm(`Xóa ${selectedRows.size} mục đã chọn?`)) return;
    
    try {
      await Promise.all([...selectedRows].map(id => api.delete(id)));
      onEdit && onEdit();
      setSelectedRows(new Set());
      showSuccess(`Đã xóa thành công ${selectedRows.size} mục!`);
    } catch (err) {
      console.error('Bulk delete error:', err);
      showError('Có lỗi xảy ra khi xóa hàng loạt.');
    }
  };

  const handleOpenCreate = useCallback(() => {
    setSelectedItem(null);
    setIsEdit(false);
    setShowModal(true);
  }, []);

  useEffect(() => {
    if (!tableActionsRef) return;

    tableActionsRef.current = {
      openCreateModal: handleOpenCreate,
      refresh: () => {
        if (onRefresh && typeof onRefresh === 'function') {
          onRefresh();
        }
      }
    };

    return () => {
      tableActionsRef.current = null;
    };
  }, [tableActionsRef, handleOpenCreate, onRefresh]);

  // Render sort icon
  const renderSortIcon = (key) => {
    if (!enableSort) return null;
    if (sortConfig.key !== key) return <ArrowUpDown size={14} className="opacity-30 dark:opacity-50" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp size={14} className="text-blue-600 dark:text-blue-400" />
      : <ArrowDown size={14} className="text-blue-600 dark:text-blue-400" />;
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-lg border-2 border-gray-300 dark:border-slate-700 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="border-b-2 border-gray-300 dark:border-slate-700">
        <div 
          className="p-4 lg:p-6"
          style={{ background: 'var(--gradient-header)' }}
        >
          <div className="flex flex-col gap-4">
            {/* Title and Actions Row */}
            {(!hideTitle || showTableHeaderActions) && (
              <div className="flex items-center justify-between gap-4 flex-wrap">
                {!hideTitle && (
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      {title}
                    </h2>
                    <span className="px-2.5 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-bold rounded-md shadow-sm border border-blue-400">
                      {totalItems || data.length}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center gap-3 flex-1 justify-end">
                  {/* Search - Đặt cùng hàng với actions */}
                  {showSearch && (
                    <div className="relative flex-1 max-w-xs">
                      <SearchInput
                        onSearch={handleSearch}
                        placeholder={searchPlaceholder}
                      />
                      
                      {/* Search Results Count Badge */}
                      {searchTerm && (
                        <div className="absolute -top-2 right-2 px-2.5 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-semibold rounded-full shadow-lg animate-fade-in z-20">
                          {sortedData.length} / {data.length}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {showTableHeaderActions && (
                    <div className="flex items-center gap-2">
                      {onRefresh && (
                        <button
                          onClick={onRefresh}
                          className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          title="Làm mới"
                        >
                          <RefreshCw size={18} />
                        </button>
                      )}
                      {!disableCreate && (
                        <button
                          onClick={handleOpenCreate}
                          className="btn-gradient-primary"
                        >
                          <Plus size={18} />
                          <span className="hidden sm:inline">Thêm mới</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Nếu không có title nhưng có search, hiển thị search riêng */}
            {hideTitle && showSearch && (
              <div className="relative">
                <SearchInput
                  onSearch={handleSearch}
                  placeholder={searchPlaceholder}
                />
                
                {/* Search Results Count Badge */}
                {searchTerm && (
                  <div className="absolute -top-2 right-2 px-2.5 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-semibold rounded-full shadow-lg animate-fade-in z-20">
                    {sortedData.length} / {data.length} kết quả
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Bulk Actions */}
        {enableBulkActions && selectedRows.size > 0 && (
          <div className="px-4 lg:px-6 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-t-2 border-blue-300 dark:border-blue-700 flex items-center justify-between shadow-sm">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Đã chọn <span className="font-semibold text-blue-600">{selectedRows.size}</span> mục
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <Trash2 size={16} />
                Xóa tất cả
              </button>
              <button
                onClick={() => setSelectedRows(new Set())}
                className="px-3 py-1.5 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 text-sm transition-colors"
              >
                Bỏ chọn
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto bg-white dark:bg-slate-900 relative">
        {/* Refresh overlay - chỉ hiển thị khi đang refresh và đã có data */}
        {isRefreshing && sortedData.length > 0 && (
          <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-20 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 bg-white dark:bg-slate-800 px-4 py-3 rounded-xl shadow-xl border-2 border-gray-300 dark:border-slate-700">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">Đang tải...</span>
            </div>
          </div>
        )}
        
        {/* Skeleton loader - chỉ hiển thị khi đang loading lần đầu và chưa có data */}
        {/* Tránh hiển thị skeleton nếu đã có data từ lần trước để tránh chớp */}
        {loading && !isRefreshing && sortedData.length === 0 && data.length === 0 ? (
          <div className="p-6">
            <TableSkeleton rows={5} columns={columns.length + (showActions ? 1 : 0)} />
          </div>
        ) : sortedData.length > 0 ? (
          <div className="overflow-x-auto border-t-2 border-gray-300 dark:border-slate-700">
            <table className="w-full data-table border-collapse">
              <thead className="sticky top-0 z-10">
                <tr>
                  {enableBulkActions && (
                    <th className="w-12 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedRows.size === sortedData.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 dark:border-slate-600 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      />
                    </th>
                  )}
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => col.sortable !== false && handleSort(col.key)}
                      className={`px-4 py-3 border-b-2 border-gray-300 dark:border-slate-700 ${
                        enableSort && col.sortable !== false 
                          ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors' 
                          : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{col.label}</span>
                        {col.sortable !== false && renderSortIcon(col.key)}
                      </div>
                    </th>
                  ))}
                  {showActions && (
                    <th className="px-4 py-3">Thao tác</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {sortedData.map((item) => (
                  <tr
                    key={item[idKey]}
                    onClick={() => onRowClick && onRowClick(item)}
                    className={`
                      group border-b border-gray-200 dark:border-slate-700
                      ${onRowClick ? 'cursor-pointer' : ''}
                      ${selectedRows.has(item[idKey]) ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' : ''}
                      hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors
                    `}
                  >
                    {enableBulkActions && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedRows.has(item[idKey])}
                          onChange={(e) => handleSelectRow(item[idKey], e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 dark:border-slate-600 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td 
                        key={col.key} 
                        className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-slate-700 last:border-r-0"
                        onClick={(e) => onRowClick && e.stopPropagation()}
                      >
                        {col.render ? col.render(item[col.key], item) : (
                          <span className="text-gray-700 dark:text-gray-300">{item[col.key] || <span className="text-gray-400">-</span>}</span>
                        )}
                      </td>
                    ))}
                    {showActions && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleView(item);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                            title="Xem / Sửa"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(item[idKey]);
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            title="Xóa"
                          >
                            <Trash2 size={16} />
                          </button>
                          {customActions && customActions(item)}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState 
            title="Không có dữ liệu"
            description={`Chưa có ${title?.toLowerCase()} nào để hiển thị`}
            action={
              !disableCreate ? (
                <button
                  onClick={handleOpenCreate}
                  className="btn-gradient-primary"
                >
                  <Plus size={18} />
                  <span>Thêm mục đầu tiên</span>
                </button>
              ) : null
            }
          />
        )}
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="px-4 lg:px-6 py-4 border-t-2 border-gray-300 dark:border-slate-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            limit={limit}
            onPageChange={onPageChange}
          />
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <FormModal
          key={`modal-${selectedItem?.[idKey] || 'new'}-${formReloadKey}`}
          item={selectedItem}
          isEdit={isEdit}
          onClose={() => setShowModal(false)}
          onSave={async (savedData) => {
            // Check if category_id changed before saving (for products/services)
            const categoryChanged = (savedData.category_id !== undefined && 
                                    selectedItem?.category_id !== undefined &&
                                    selectedItem.category_id !== savedData.category_id);
            
            await handleSave(savedData);
            
            // Reload form options if category changed
            if (categoryChanged) {
              setFormReloadKey(prev => prev + 1);
            }
          }}
          title={title}
          fields={fieldsForModal}
        />
      )}

      {/* Edit Modal */}
      {showDetailModal && detailItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-auto border-2 border-gray-300 dark:border-slate-700">
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b-2 border-gray-300 dark:border-slate-700 p-6 flex items-center justify-between z-10">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Sửa {title?.slice(0, -1).toLowerCase() || 'mục'}
              </h3>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setDetailItem(null);
                  setSelectedItem(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                aria-label="Đóng"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <FormContent
                key={`form-${selectedItem?.[idKey]}-${formReloadKey}`}
                item={selectedItem}
                isEdit={true}
                onSave={async (savedData) => {
                  try {
                    console.log('Saving detail data:', savedData);
                    console.log('Image URL in saved data:', savedData.image_url);
                    
                    // Ensure customer_id is sent (not customer_name) for vehicles
                    const dataToSave = { ...savedData };
                    // estimated_time is now in seconds (from days/hours input), no conversion needed
                    if (dataToSave.customer_id && typeof dataToSave.customer_id === 'string' && dataToSave.customer_id.startsWith('ID: ')) {
                      // Extract ID from "ID: 123" format
                      dataToSave.customer_id = parseInt(dataToSave.customer_id.replace('ID: ', ''));
                    }
                    // If customer_id is displayed as name, use original ID from selectedItem
                    if (dataToSave.customer_id && typeof dataToSave.customer_id === 'string' && !dataToSave.customer_id.startsWith('ID: ')) {
                      dataToSave.customer_id = selectedItem.customer_id;
                    }
                    
                    // Check if this is product or service and if category_id changed
                    const hasCategoryId = dataToSave.category_id !== null && dataToSave.category_id !== undefined && dataToSave.category_id !== '';
                    const isProduct = title && (title.toLowerCase().includes('sản phẩm') || title.toLowerCase().includes('product'));
                    const isService = title && (title.toLowerCase().includes('dịch vụ') || title.toLowerCase().includes('service'));
                    const oldCategoryId = selectedItem ? selectedItem.category_id : null;
                    const categoryChanged = hasCategoryId && oldCategoryId !== dataToSave.category_id;
                    
                    await api.update(selectedItem[idKey], dataToSave);
                    onEdit && onEdit();
                    showSuccess('Cập nhật thành công!');
                    
                    // If category_id changed, notify Categories/ServiceCategories to refresh
                    if (categoryChanged) {
                      if (isProduct) {
                        console.log('[Table Detail] Product category changed, dispatching productCategoryChanged event');
                        sessionStorage.setItem('productCategoryChanged', Date.now().toString());
                        window.dispatchEvent(new CustomEvent('productCategoryChanged'));
                      } else if (isService) {
                        console.log('[Table Detail] Service category changed, dispatching serviceCategoryChanged event');
                        sessionStorage.setItem('serviceCategoryChanged', Date.now().toString());
                        window.dispatchEvent(new CustomEvent('serviceCategoryChanged'));
                      }
                    }
                    
                    // Reload form options if category changed
                    if (categoryChanged) {
                      setFormReloadKey(prev => prev + 1);
                    }
                    
                    setShowDetailModal(false);
                    setDetailItem(null);
                    setSelectedItem(null);
                  } catch (err) {
                    console.error('Save error:', err);
                    showError('Có lỗi xảy ra khi lưu. Vui lòng thử lại.');
                  }
                }}
                fields={fieldsForModal}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full p-6 border-2 border-gray-300 dark:border-slate-700">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <Trash2 className="text-red-600 dark:text-red-400" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Xác nhận xóa</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Hành động này không thể hoàn tác</p>
              </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Bạn có chắc chắn muốn xóa mục này không?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors font-medium"
              >
                Hủy
              </button>
              <button
                onClick={confirmDeleteAction}
                className="btn-gradient-error flex-1"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
