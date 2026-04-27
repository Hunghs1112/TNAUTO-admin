import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Eye, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import useTableInteraction from '../../hooks/useTableInteraction';
import { useToast } from '../../contexts/ToastContext';
import FormModal from '../form/FormModal';
import Modal from '../ui/Modal';
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

  const {
    searchTerm,
    sortConfig,
    selectedRows,
    setSelectedRows,
    filteredData,
    handleSearch,
    handleSort,
    handleSelectAll,
    handleSelectRow,
  } = useTableInteraction({
    data,
    columns,
    idKey,
    enableSort,
    serverSideSearch,
    onSearchChange,
  });

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
      showError(error?.message || 'Không thể xóa dữ liệu. Vui lòng thử lại.');
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
      return <ArrowUpDown size={14} className="opacity-40" />;
    }

    return sortConfig.direction === 'asc' ? (
      <ArrowUp size={14} className="text-[#eecd7e]" />
    ) : (
      <ArrowDown size={14} className="text-[#eecd7e]" />
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
                    <h2 className="text-2xl font-bold text-slate-100">{title}</h2>
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
                        <div className="absolute -top-2 right-2 z-20 rounded-full border border-slate-700 bg-slate-900/95 px-2.5 py-1 text-xs font-semibold text-slate-100 shadow-lg">
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
                  <div className="absolute -top-2 right-2 z-20 rounded-full border border-slate-700 bg-slate-900/95 px-2.5 py-1 text-xs font-semibold text-slate-100 shadow-lg">
                    {searchIndicatorLabel}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {enableBulkActions && selectedRows.size > 0 ? (
        <div className="flex items-center justify-between border-t border-[#1e406b]/60 bg-[#112552]/30 px-4 py-3 lg:px-6">
          <span className="text-sm text-slate-200">
            Đã chọn <span className="font-semibold text-[#eecd7e]">{selectedRows.size}</span> mục
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

      <div className="relative flex-1 overflow-auto bg-slate-950">
        {isRefreshing && filteredData.length > 0 ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/72 backdrop-blur-sm">
            <div className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-medium text-slate-200 shadow-lg">
              Đang tải dữ liệu...
            </div>
          </div>
        ) : null}

        {loading && !isRefreshing && filteredData.length === 0 && data.length === 0 ? (
          <div className="p-6">
            <TableSkeleton rows={5} columns={columns.length + (showActions ? 1 : 0)} />
          </div>
        ) : filteredData.length > 0 ? (
          <div className="overflow-x-auto border-t border-slate-800/80">
            <table className="data-table min-w-full">
              <thead className="sticky top-0 z-10">
                <tr>
                  {enableBulkActions ? (
                    <th className="w-12">
                      <input
                        type="checkbox"
                        checked={filteredData.length > 0 && selectedRows.size === filteredData.length}
                        onChange={(event) => handleSelectAll(event.target.checked)}
                        className="h-4 w-4 rounded border-slate-600 text-[#e0a02e] focus:ring-[#1e406b]"
                      />
                    </th>
                  ) : null}

                  {columns.map((column) => (
                    <th
                      key={column.key}
                      onClick={() => column.sortable !== false && handleSort(column.key)}
                      className={
                        enableSort && column.sortable !== false
                          ? 'cursor-pointer transition-colors hover:bg-slate-800/80'
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
                      selectedRows.has(item[idKey]) ? 'bg-[#112552]/30' : ''
                    }`}
                  >
                    {enableBulkActions ? (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedRows.has(item[idKey])}
                          onChange={(event) => handleSelectRow(item[idKey], event.target.checked)}
                          onClick={(event) => event.stopPropagation()}
                          className="h-4 w-4 rounded border-slate-600 text-[#e0a02e] focus:ring-[#1e406b]"
                        />
                      </td>
                    ) : null}

                    {columns.map((column) => (
                      <td key={column.key} className="px-4 py-3 text-sm text-slate-100">
                        {column.render ? (
                          column.render(item[column.key], item)
                        ) : (
                          <span className="text-slate-200">
                            {item[column.key] || <span className="text-slate-500">-</span>}
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
                              className="rounded-lg p-2 text-[#dfe1e3] transition-colors hover:bg-[#1e406b]/12"
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
                              className="rounded-lg p-2 text-[#e0a02e] transition-colors hover:bg-[#c37b1e]/12"
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
                              className="rounded-lg p-2 text-[#b48242] transition-colors hover:bg-[#b48242]/12"
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
        <div className="border-t border-slate-800/80 bg-slate-950/70 px-4 py-4 lg:px-6">
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
        <Modal
          isOpen={Boolean(confirmDeleteId)}
          onClose={() => setConfirmDeleteId(null)}
          title={deleteConfirmTitle}
          size="sm"
          placement="top"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#b48242]/15 text-[#b48242]">
                <Trash2 size={22} />
              </div>
              <div>
                <p className="text-sm text-slate-300">Vui lòng xác nhận trước khi tiếp tục.</p>
                <p className="mt-2 text-sm leading-6 text-slate-200">{deleteConfirmDescription}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={() => setConfirmDeleteId(null)} className="btn-gradient-secondary flex-1">
                Hủy
              </button>
              <button type="button" onClick={confirmDeleteAction} className="btn-gradient-error flex-1">
                {deleteConfirmButtonLabel}
              </button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}