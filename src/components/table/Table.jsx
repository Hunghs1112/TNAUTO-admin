// src/components/table/Table.jsx
import { useState, useMemo, useEffect } from 'react';
import FormModal from '../form/FormModal';
import FormField from '../form/FormField';
import Pagination from '../ui/Pagination';
import TableActionButtons from './TableActionButtons';
import EmptyState from '../ui/EmptyState';
import LoadingSpinner from '../ui/LoadingSpinner';
import { TableSkeleton } from '../ui/SkeletonLoader';
import { buttonStyles } from '../../styles/colors';
import api from '../../services/api';
import { 
  Search, X, Plus, 
  ArrowUpDown, ArrowUp, ArrowDown,
  Eye, RefreshCw, Trash2, Edit2
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
  onRowClick = null
}) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [confirmDelete, setConfirmDelete] = useState(null);
  const { error: showError, success: showSuccess } = useToast();

  // Sorted data
  const sortedData = useMemo(() => {
    if (!enableSort || !sortConfig.key) return data;
    
    const sorted = [...data].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      
      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      
      const comparison = aVal < bVal ? -1 : 1;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
  }, [data, sortConfig, enableSort]);

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
              const response = await api.get(field.apiEndpoint);
              const data = response.data.data || response.data || [];
              
              // Format options based on field config
              optionsData[field.name] = data.map(item => ({
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
        
        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-slate-700">
          <button 
            type="button" 
            onClick={() => {
              setShowDetailModal(false);
              setDetailItem(null);
              setSelectedItem(null);
            }} 
            className={`${buttonStyles.secondary} text-sm`}
          >
            Hủy
          </button>
          <button type="submit" className={`${buttonStyles.primary} text-sm`} disabled={loadingOptions}>
            Lưu
          </button>
        </div>
      </form>
    );
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchTerm(searchInput);
    onSearch && onSearch(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchTerm('');
    onSearch && onSearch('');
  };

  const handleSave = async (savedData) => {
    try {
      console.log('Saving data:', savedData);
      console.log('Image URL in saved data:', savedData.image_url);
      
      // Ensure customer_id is sent (not customer_name) for vehicles
      const dataToSave = { ...savedData };
      if (dataToSave.customer_id && typeof dataToSave.customer_id === 'string' && dataToSave.customer_id.startsWith('ID: ')) {
        // Extract ID from "ID: 123" format
        dataToSave.customer_id = parseInt(dataToSave.customer_id.replace('ID: ', ''));
      }
      
      if (isEdit) {
        await api.update(selectedItem[idKey], dataToSave);
        showSuccess('Cập nhật thành công!');
      } else {
        await api.create(dataToSave);
        showSuccess('Tạo mới thành công!');
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

  // Render sort icon
  const renderSortIcon = (key) => {
    if (!enableSort) return null;
    if (sortConfig.key !== key) return <ArrowUpDown size={14} className="opacity-30 dark:opacity-50" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp size={14} className="text-blue-600 dark:text-blue-400" />
      : <ArrowDown size={14} className="text-blue-600 dark:text-blue-400" />;
  };

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-slate-700 card-shadow transition-colors duration-200">
      {/* Header - Professional Design with Gradient */}
      <div className="gradient-header border-b border-gray-200 dark:border-slate-700 transition-colors duration-300">
        <div className="p-5">
          {/* Title & Actions Row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            {!hideTitle && (
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 transition-colors duration-300">
                  {title}
                </h2>
                <span className="px-2.5 py-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 text-xs font-semibold rounded-md transition-colors duration-300">
                  {totalItems || data.length}
                </span>
              </div>
            )}
            
            {/* Quick Actions */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all hover:scale-105 active:scale-95"
                  title="Làm mới"
                  aria-label="Làm mới dữ liệu"
                >
                  <RefreshCw size={18} />
                </button>
              )}

              <button
                onClick={() => { setSelectedItem(null); setIsEdit(false); setShowModal(true); }}
                className={`${buttonStyles.primary} rounded-lg active:scale-[0.98]`}
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Thêm mới</span>
              </button>
            </div>
          </div>

          {/* Search */}
          {showSearch && (
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-300"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors font-medium text-sm"
              >
                Tìm kiếm
              </button>
            </form>
          )}

          {/* Search Results Info */}
          {searchTerm && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <span className="text-gray-600 dark:text-gray-300">
                Tìm thấy <span className="font-bold text-blue-600 dark:text-blue-400">{data.length}</span> kết quả cho "{searchTerm}"
              </span>
              <button
                onClick={handleClearSearch}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline font-medium transition-colors duration-200"
              >
                Xóa
              </button>
            </div>
          )}
        </div>

        {/* Bulk Actions Bar */}
        {enableBulkActions && selectedRows.size > 0 && (
          <div className="px-6 py-3 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-100 dark:border-blue-800 flex items-center justify-between transition-colors duration-300">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Đã chọn <span className="text-blue-600 dark:text-blue-400 font-bold">{selectedRows.size}</span> mục
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all text-sm font-medium flex items-center gap-2"
              >
                <Trash2 size={16} />
                Xóa tất cả
              </button>
              <button
                onClick={() => setSelectedRows(new Set())}
                className="px-3 py-1.5 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-all text-sm"
              >
                Bỏ chọn
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table Content - Luôn có background phù hợp theme để tránh flash */}
      <div className="flex-1 overflow-auto bg-white dark:bg-slate-800 transition-colors duration-200 relative">
        {/* Loading Overlay - Chỉ hiển thị khi đang refresh (đã có dữ liệu) */}
        {isRefreshing && sortedData.length > 0 && (
          <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/90 backdrop-blur-sm z-20 flex items-center justify-center transition-opacity duration-200">
            <div className="flex flex-col items-center gap-2 bg-white/95 dark:bg-slate-800/95 px-4 py-3 rounded-lg shadow-xl border border-gray-200 dark:border-slate-700">
              <div className="w-8 h-8 border-4 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Đang tải...</span>
            </div>
          </div>
        )}
        
        {/* Skeleton chỉ hiển thị khi loading và chưa có dữ liệu (lần đầu load) */}
        {loading && !isRefreshing && sortedData.length === 0 ? (
          <div className="p-6 bg-white dark:bg-slate-800 transition-colors duration-200">
            <TableSkeleton rows={5} columns={columns.length + (showActions ? 1 : 0)} />
          </div>
        ) : sortedData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse data-table">
              <thead className="gradient-table-header sticky top-0 z-10 border-b-2 border-gray-200 dark:border-slate-700">
                <tr>
                  {enableBulkActions && (
                    <th className="w-12 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedRows.size === sortedData.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="w-4 h-4 rounded-md border-gray-300 dark:border-slate-600 text-blue-600 focus:ring-2 focus:ring-blue-500/50 cursor-pointer bg-white dark:bg-slate-700 transition-all duration-200"
                      />
                    </th>
                  )}
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => col.sortable !== false && handleSort(col.key)}
                      className={`px-4 py-3.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider transition-all duration-200 ${
                        enableSort && col.sortable !== false 
                          ? 'cursor-pointer hover:bg-gray-100/50 dark:hover:bg-slate-700/50 transition-all select-none' 
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
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Thao tác
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-100 dark:divide-slate-700/50 transition-colors duration-300">
                {sortedData.map((item, index) => (
                  <tr
                    key={item[idKey]}
                    onClick={() => onRowClick && onRowClick(item)}
                    className={`
                      group transition-all duration-200
                      ${onRowClick ? 'cursor-pointer' : ''}
                      ${selectedRows.has(item[idKey]) ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' : ''}
                    `}
                  >
                    {enableBulkActions && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedRows.has(item[idKey])}
                          onChange={(e) => handleSelectRow(item[idKey], e.target.checked)}
                          className="w-4 h-4 rounded-md border-gray-300 dark:border-slate-600 text-blue-600 focus:ring-2 focus:ring-blue-500/50 bg-white dark:bg-slate-700 transition-all duration-200 cursor-pointer"
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td 
                        key={col.key} 
                        className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 transition-colors duration-300"
                        onClick={(e) => onRowClick && e.stopPropagation()}
                      >
                        {col.render ? col.render(item[col.key], item) : (
                          <span className="text-gray-700 dark:text-gray-300">{item[col.key] || <span className="text-gray-400 dark:text-gray-500">-</span>}</span>
                        )}
                      </td>
                    ))}
                    {showActions && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          {/* Combined View/Edit Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent row click
                              handleView(item);
                            }}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm hover:shadow-md flex items-center gap-1"
                            title="Xem chi tiết / Sửa"
                          >
                            <Eye size={16} />
                            <Edit2 size={14} className="opacity-70" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent row click
                              handleDelete(item[idKey]);
                            }}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm hover:shadow-md"
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
              <button
                onClick={() => { setSelectedItem(null); setIsEdit(false); setShowModal(true); }}
                className={buttonStyles.primary}
              >
                <Plus size={18} className="inline mr-2" />
                Thêm mục đầu tiên
              </button>
            }
          />
        )}
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 transition-colors duration-300">
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
          item={selectedItem}
          isEdit={isEdit}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
          title={title}
          fields={fieldsForModal}
        />
      )}

      {/* Edit Modal - Form sửa chung cho tất cả các trang */}
      {showDetailModal && detailItem && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-auto border border-gray-200/50 dark:border-slate-700/50 animate-fade-in">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 p-6 flex items-center justify-between z-10 gradient-header transition-colors duration-300">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 transition-colors duration-300">
                Sửa {title?.slice(0, -1).toLowerCase() || 'mục'}
              </h3>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setDetailItem(null);
                  setSelectedItem(null);
                }}
                className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-all duration-200 active:scale-95"
                aria-label="Đóng"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 bg-white dark:bg-slate-800 transition-colors duration-300">
              <FormContent
                item={selectedItem}
                isEdit={true}
                onSave={async (savedData) => {
                  try {
                    console.log('Saving detail data:', savedData);
                    console.log('Image URL in saved data:', savedData.image_url);
                    
                    // Ensure customer_id is sent (not customer_name) for vehicles
                    const dataToSave = { ...savedData };
                    if (dataToSave.customer_id && typeof dataToSave.customer_id === 'string' && dataToSave.customer_id.startsWith('ID: ')) {
                      // Extract ID from "ID: 123" format
                      dataToSave.customer_id = parseInt(dataToSave.customer_id.replace('ID: ', ''));
                    }
                    // If customer_id is displayed as name, use original ID from selectedItem
                    if (dataToSave.customer_id && typeof dataToSave.customer_id === 'string' && !dataToSave.customer_id.startsWith('ID: ')) {
                      dataToSave.customer_id = selectedItem.customer_id;
                    }
                    
                    await api.update(selectedItem[idKey], dataToSave);
                    onEdit && onEdit();
                    showSuccess('Cập nhật thành công!');
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
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6 transform transition-all border border-gray-200/50 dark:border-slate-700/50 animate-fade-in">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center shadow-md">
                <Trash2 className="text-red-600 dark:text-red-400" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 transition-colors duration-300">Xác nhận xóa</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">Hành động này không thể hoàn tác</p>
              </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-6 transition-colors duration-300">
              Bạn có chắc chắn muốn xóa mục này không?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2.5 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-300 dark:hover:bg-slate-600 transition-all duration-200 font-medium shadow-sm hover:shadow-md active:scale-[0.98]"
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
