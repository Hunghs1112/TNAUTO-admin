import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Eye, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import FormModal from '../form/FormModal';
import { TableSkeleton } from '../ui/SkeletonLoader';
import EmptyState from '../ui/EmptyState';
import Pagination from '../ui/Pagination';
import SearchInput from './SearchInput';

function resolveCategoryChangeEvent(title, explicitEventName) {
  if (explicitEventName === null) {
    return null;
  }

  if (explicitEventName) {
    return explicitEventName;
  }

  const normalizedTitle = String(title || '').toLowerCase();

  if (normalizedTitle.includes('sản phẩm')) {
    return 'productCategoryChanged';
  }

  if (normalizedTitle.includes('dịch vụ')) {
    return 'serviceCategoryChanged';
  }

  return null;
}

function normalizeSearchValue(value) {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.join(' ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

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
  showDelete = true,
  deleteConfig = null,
  showSearch = false,
  searchPlaceholder = 'Tìm kiếm...',
  hideTitle = false,
  enableSort = true,
  enableBulkActions = false,
  onRefresh = null,
  onSearchChange = null,
  onRowClick = null,
  serverSideSearch = false,
  tableActionsRef = null,
  showTableHeaderActions = true,
  disableCreate = false,
  categoryChangeEventName,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const { success: showSuccess, error: showError } = useToast();
  const deleteActionLabel = deleteConfig?.actionLabel || 'Xóa';
  const deleteSuccessMessage = deleteConfig?.successMessage || 'Xóa thành công.';
  const deleteConfirmTitle = deleteConfig?.confirmTitle || 'Xác nhận xóa';
  const deleteConfirmDescription =
    deleteConfig?.confirmDescription || 'Bạn có chắc chắn muốn xóa mục này không? Hành động này không thể hoàn tác.';
  const deleteConfirmButtonLabel = deleteConfig?.confirmButtonLabel || deleteActionLabel;

  const categoryChangeEvent = useMemo(
    () => resolveCategoryChangeEvent(title, categoryChangeEventName),
    [categoryChangeEventName, title]
  );

  const filteredData = useMemo(() => {
    let nextData = [...data];
    const normalizedSearchTerm = searchTerm.toLowerCase();

    if (normalizedSearchTerm && !serverSideSearch) {
      nextData = nextData.filter((item) =>
        columns.some((column) => normalizeSearchValue(item[column.key]).toLowerCase().includes(normalizedSearchTerm))
      );
    }

    if (enableSort && sortConfig.key) {
      nextData.sort((leftItem, rightItem) => {
        const leftValue = leftItem[sortConfig.key];
        const rightValue = rightItem[sortConfig.key];

        if (leftValue === rightValue) return 0;
        if (leftValue === null || leftValue === undefined) return 1;
        if (rightValue === null || rightValue === undefined) return -1;

        const comparison = leftValue < rightValue ? -1 : 1;
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }

    return nextData;
  }, [columns, data, enableSort, searchTerm, serverSideSearch, sortConfig]);

  const shouldShowHeader = !hideTitle || showSearch || showTableHeaderActions;

  const openCreateModal = useCallback(() => {
    setSelectedItem(null);
    setIsEdit(false);
    setShowModal(true);
  }, []);

  useEffect(() => {
    if (!tableActionsRef) {
      return undefined;
    }

    tableActionsRef.current = {
      openCreateModal,
      refresh: () => onRefresh?.(),
    };

    return () => {
      tableActionsRef.current = null;
    };
  }, [onRefresh, openCreateModal, tableActionsRef]);

  const handleSearch = useCallback((value) => {
    const nextSearchTerm = String(value || '').trim();
    setSearchTerm(nextSearchTerm);
    onSearchChange?.(nextSearchTerm);
  }, [onSearchChange]);

  const handleSort = useCallback(
    (key) => {
      if (!enableSort) {
        return;
      }

      setSortConfig((prev) => {
        if (prev.key === key && prev.direction === 'asc') {
          return { key, direction: 'desc' };
        }

        if (prev.key === key && prev.direction === 'desc') {
          return { key: null, direction: null };
        }

        return { key, direction: 'asc' };
      });
    },
    [enableSort]
  );

  const handleView = useCallback(
    (item) => {
      if (onView) {
        onView(item);
        return;
      }

      setSelectedItem(item);
      setIsEdit(true);
      setShowModal(true);
    },
    [onView]
  );

  const handleEdit = useCallback(
    (item) => {
      if (onEdit) {
        onEdit(item);
        return;
      }

      setSelectedItem(item);
      setIsEdit(true);
      setShowModal(true);
    },
    [onEdit]
  );

  const handleSelectAll = useCallback(
    (checked) => {
      if (!checked) {
        setSelectedRows(new Set());
        return;
      }

      setSelectedRows(new Set(filteredData.map((item) => item[idKey])));
    },
    [filteredData, idKey]
  );

  const handleSelectRow = useCallback((id, checked) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const dispatchCategoryEvent = useCallback(
    (payload, previousCategoryId = null) => {
      if (!categoryChangeEvent) {
        return;
      }

      const hasCategoryId = payload.category_id !== null && payload.category_id !== undefined && payload.category_id !== '';
      if (!hasCategoryId) {
        return;
      }

      const isNewItem = previousCategoryId === null || previousCategoryId === undefined;
      const categoryChanged = previousCategoryId !== payload.category_id;

      if (!isNewItem && !categoryChanged) {
        return;
      }

      sessionStorage.setItem(categoryChangeEvent, Date.now().toString());
      window.dispatchEvent(new CustomEvent(categoryChangeEvent));
    },
    [categoryChangeEvent]
  );

  const refreshAfterSave = useCallback(() => {
    onRefresh?.();
    window.setTimeout(() => {
      onRefresh?.();
    }, 350);
  }, [onRefresh]);

  const handleSave = useCallback(
    async (formData) => {
      try {
        const payload = { ...formData };

        if (payload.customer_id && typeof payload.customer_id === 'string' && payload.customer_id.startsWith('ID: ')) {
          payload.customer_id = Number(payload.customer_id.replace('ID: ', ''));
        }

        if (isEdit && selectedItem) {
          const previousCategoryId = selectedItem.category_id ?? null;
          await api.update(selectedItem[idKey], payload);
          showSuccess('Cập nhật thành công.');
          dispatchCategoryEvent(payload, previousCategoryId);
        } else {
          await api.create(payload);
          showSuccess('Tạo mới thành công.');
          dispatchCategoryEvent(payload, null);
        }

        setShowModal(false);
        setSelectedItem(null);
        setIsEdit(false);
        refreshAfterSave();
      } catch (error) {
      showError(error?.message || 'Không thể xóa dữ liệu. Vui lòng thử lại.');
      }
    },
    [api, dispatchCategoryEvent, idKey, isEdit, refreshAfterSave, selectedItem, showError, showSuccess]
  );

  const confirmDeleteAction = useCallback(async () => {
    if (!confirmDeleteId) {
      return;
    }

    try {
      await api.delete(confirmDeleteId);
      onDelete?.(confirmDeleteId);
      setConfirmDeleteId(null);
      showSuccess(deleteSuccessMessage);
      onRefresh?.();
    } catch (error) {
      showError(error?.message || 'Kh?ng th? x?a d? li?u. Vui l?ng th? l?i.');
    }
  }, [api, confirmDeleteId, deleteSuccessMessage, onDelete, onRefresh, showError, showSuccess]);

  const handleBulkDelete = useCallback(async () => {
    if (!selectedRows.size) {
      return;
    }

    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${selectedRows.size} mục đã chọn không?`)) {
      return;
    }

    try {
      await Promise.all([...selectedRows].map((id) => api.delete(id)));
      setSelectedRows(new Set());
      showSuccess(`Đã xóa ${selectedRows.size} mục.`);
      onRefresh?.();
    } catch (error) {
      showError(error?.message || 'Không thể xóa hàng loạt. Vui lòng thử lại.');
    }
  }, [api, onRefresh, selectedRows, showError, showSuccess]);

  const renderSortIcon = (key) => {
    if (!enableSort) {
      return null;
    }

    if (sortConfig.key !== key) {
      return <ArrowUpDown size={14} className="opacity-30 dark:opacity-50" />;
    }

    return sortConfig.direction === 'asc' ? (
      <ArrowUp size={14} className="text-blue-600 dark:text-blue-400" />
    ) : (
      <ArrowDown size={14} className="text-blue-600 dark:text-blue-400" />
    );
  };

  const emptyStateType = searchTerm ? 'no-results' : 'no-data';
  const emptyStateTitle = searchTerm ? 'Không tìm thấy kết quả' : 'Không có dữ liệu';
  const emptyStateDescription = searchTerm
    ? 'Không có dữ liệu phù hợp với điều kiện tìm kiếm hiện tại.'
    : `Chưa có ${title?.toLowerCase() || 'dữ liệu'} để hiển thị.`;

  const searchIndicatorLabel = serverSideSearch ? `${data.length} / ${totalItems}` : `${filteredData.length} / ${data.length}`;

  return (
    <div className="app-panel flex h-full flex-col">
      {shouldShowHeader ? (
        <div className="app-panel-header">
          <div className="flex flex-col gap-1">
            {!hideTitle || showTableHeaderActions ? (
              <div className="flex flex-wrap items-center justify-between gap-4">
                {!hideTitle ? (
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{title}</h2>
                    <span className="app-badge">{totalItems || data.length}</span>
                  </div>
                ) : (
                  <div />
                )}

                <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
                  {showSearch ? (
                    <div className="relative w-full max-w-sm">
                      <SearchInput onSearch={handleSearch} placeholder={searchPlaceholder} />
                      {searchTerm ? (
                        <div className="absolute -top-2 right-2 z-20 rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white shadow-lg dark:bg-slate-100 dark:text-slate-900">
                          {searchIndicatorLabel}
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {showTableHeaderActions ? (
                    <div className="flex items-center gap-2">
                      {onRefresh ? (
                        <button type="button" onClick={onRefresh} className="app-icon-button" title="Làm mới">
                          <RefreshCw size={18} />
                        </button>
                      ) : null}
                      {!disableCreate ? (
                        <button type="button" onClick={openCreateModal} className="btn-gradient-primary">
                          <Plus size={18} />
                          <span className="hidden sm:inline">Thêm mới</span>
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {hideTitle && showSearch && !showTableHeaderActions ? (
              <div className="relative">
                <SearchInput onSearch={handleSearch} placeholder={searchPlaceholder} />
                {searchTerm ? (
                  <div className="absolute -top-2 right-2 z-20 rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white shadow-lg dark:bg-slate-100 dark:text-slate-900">
                    {searchIndicatorLabel}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {enableBulkActions && selectedRows.size > 0 ? (
        <div className="flex items-center justify-between border-t border-blue-200 bg-blue-50/80 px-4 py-3 dark:border-blue-900/60 dark:bg-blue-950/30 lg:px-6">
          <span className="text-sm text-slate-700 dark:text-slate-200">
            Đã chọn <span className="font-semibold text-blue-700 dark:text-blue-300">{selectedRows.size}</span> mục
          </span>
          <div className="flex gap-2">
            <button type="button" onClick={handleBulkDelete} className="btn-gradient-error">
              <Trash2 size={16} />
              <span>Xóa đã chọn</span>
            </button>
            <button type="button" onClick={() => setSelectedRows(new Set())} className="btn-gradient-secondary">
              Bỏ chọn
            </button>
          </div>
        </div>
      ) : null}

      <div className="relative flex-1 overflow-auto bg-white dark:bg-slate-900">
        {isRefreshing && filteredData.length > 0 ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/80 backdrop-blur-sm dark:bg-slate-900/80">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
              Đang tải dữ liệu...
            </div>
          </div>
        ) : null}

        {loading && !isRefreshing && filteredData.length === 0 && data.length === 0 ? (
          <div className="p-6">
            <TableSkeleton rows={5} columns={columns.length + (showActions ? 1 : 0)} />
          </div>
        ) : filteredData.length > 0 ? (
          <div className="overflow-x-auto border-t border-slate-200/80 dark:border-slate-800/80">
            <table className="data-table min-w-full">
              <thead className="sticky top-0 z-10">
                <tr>
                  {enableBulkActions ? (
                    <th className="w-12">
                      <input
                        type="checkbox"
                        checked={filteredData.length > 0 && selectedRows.size === filteredData.length}
                        onChange={(event) => handleSelectAll(event.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                  ) : null}

                  {columns.map((column) => (
                    <th
                      key={column.key}
                      onClick={() => column.sortable !== false && handleSort(column.key)}
                      className={
                        enableSort && column.sortable !== false
                          ? 'cursor-pointer transition-colors hover:bg-slate-100/80 dark:hover:bg-slate-800'
                          : undefined
                      }
                    >
                      <div className="flex items-center gap-2">
                        <span>{column.label}</span>
                        {column.sortable !== false ? renderSortIcon(column.key) : null}
                      </div>
                    </th>
                  ))}

                  {showActions ? <th>Thao tác</th> : null}
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item) => (
                  <tr
                    key={item[idKey]}
                    onClick={() => onRowClick?.(item)}
                    className={`${onRowClick ? 'cursor-pointer' : ''} ${
                      selectedRows.has(item[idKey]) ? 'bg-blue-50 dark:bg-blue-950/30' : ''
                    }`}
                  >
                    {enableBulkActions ? (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedRows.has(item[idKey])}
                          onChange={(event) => handleSelectRow(item[idKey], event.target.checked)}
                          onClick={(event) => event.stopPropagation()}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                    ) : null}

                    {columns.map((column) => (
                      <td key={column.key} className="px-4 py-3 text-sm text-slate-900 dark:text-slate-100">
                        {column.render ? (
                          column.render(item[column.key], item)
                        ) : (
                          <span className="text-slate-700 dark:text-slate-300">
                            {item[column.key] || <span className="text-slate-400">-</span>}
                          </span>
                        )}
                      </td>
                    ))}

                    {showActions ? (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {onView ? (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleView(item);
                              }}
                              className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50 dark:hover:bg-blue-950/30"
                              title="Xem chi tiết"
                            >
                              <Eye size={16} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleEdit(item);
                              }}
                              className="rounded-lg p-2 text-amber-600 transition-colors hover:bg-amber-50 dark:hover:bg-amber-950/30"
                              title="Sửa"
                            >
                              <Pencil size={16} />
                            </button>
                          )}

                          {showDelete ? (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setConfirmDeleteId(item[idKey]);
                              }}
                              className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
                              title={deleteActionLabel}
                            >
                              <Trash2 size={16} />
                            </button>
                          ) : null}

                          {customActions ? customActions(item) : null}
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            type={emptyStateType}
            title={emptyStateTitle}
            description={emptyStateDescription}
            action={
              !searchTerm && !disableCreate ? (
                <button type="button" onClick={openCreateModal} className="btn-gradient-primary">
                  <Plus size={18} />
                  <span>Thêm mục đầu tiên</span>
                </button>
              ) : null
            }
          />
        )}
      </div>

      {showPagination && totalPages > 1 ? (
        <div className="border-t border-slate-200/80 bg-slate-50/80 px-4 py-4 dark:border-slate-800/80 dark:bg-slate-900/80 lg:px-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            limit={limit}
            onPageChange={onPageChange}
          />
        </div>
      ) : null}

      {showModal ? (
        <FormModal
          item={selectedItem}
          isEdit={isEdit}
          onClose={() => {
            setShowModal(false);
            setSelectedItem(null);
            setIsEdit(false);
          }}
          onSave={handleSave}
          title={title}
          fields={fieldsForModal}
        />
      ) : null}

      {confirmDeleteId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="app-panel w-full max-w-md">
            <div className="app-panel-body">
              <div className="mb-6 flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-300">
                  <Trash2 size={22} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{deleteConfirmTitle}</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Vui lòng xác nhận trước khi tiếp tục.</p>
                </div>
              </div>

              <p className="mb-6 text-sm leading-6 text-slate-700 dark:text-slate-200">
                {deleteConfirmDescription}
              </p>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={() => setConfirmDeleteId(null)} className="btn-gradient-secondary flex-1">
                  Hủy
                </button>
                <button type="button" onClick={confirmDeleteAction} className="btn-gradient-error flex-1">
                  {deleteConfirmButtonLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
