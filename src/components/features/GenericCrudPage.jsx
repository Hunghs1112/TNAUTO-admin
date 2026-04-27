import { memo, useCallback, useEffect, useRef } from 'react';
import useListFetch from '../../hooks/useListFetch';
import useServerPagination from '../../hooks/useServerPagination';
import { useToast } from '../../contexts/ToastContext';
import PageHeader from '../layout/PageHeader';
import GenericTable from '../table/Table';

function GenericCrudPage({
  api,
  columns,
  fieldsForModal,
  title,
  description,
  options = {},
  customActions,
  showPagination = false,
  limit = 10,
  showSearch = true,
  searchPlaceholder = 'Tìm kiếm...',
  hideTitle = false,
  showActions = true,
  showDelete = true,
  deleteConfig = null,
  onRowClick = null,
  onView = null,
  onEdit = null,
  tableActionsRef = null,
  showTableHeaderActions = true,
  refreshTrigger = null,
  disableCreate = false,
  categoryChangeEventName,
  createButtonText = 'Thêm mới',
  additionalParams = null,
}) {
  const { transformData = (data) => data, onError } = options;
  const { error: showError } = useToast();

  const internalTableActionsRef = useRef(null);
  const resolvedTableActionsRef = tableActionsRef || internalTableActionsRef;

  const pagination = useServerPagination({
    showPagination,
    initialPage: 1,
    initialLimit: limit,
    initialTotalItems: 0,
    initialTotalPages: 1,
  });

  const { allData, setAllData, isInitialLoading, isRefreshing, hasLoadedOnceRef, fetchData } = useListFetch({
    api,
    showPagination,
    limit,
    title,
    transformData,
    onError,
    showError,
    pagination,
    additionalParams,
  });

  useEffect(() => {
    if (refreshTrigger === null || refreshTrigger <= 0 || !hasLoadedOnceRef.current) {
      return undefined;
    }

    let delayedRefresh;

    const firstRefresh = setTimeout(() => {
      fetchData();

      delayedRefresh = setTimeout(() => {
        fetchData();
      }, 1000);
    }, 400);

    return () => {
      clearTimeout(firstRefresh);
      clearTimeout(delayedRefresh);
    };
  }, [fetchData, hasLoadedOnceRef, refreshTrigger]);

  const handleDelete = useCallback(
    (id) => {
      setAllData((prev) => prev.filter((item) => item.id !== id));
      pagination.setTotalItems((prev) => Math.max(0, prev - 1));
    },
    [pagination, setAllData]
  );

  const handleRefresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = useCallback(() => {
    resolvedTableActionsRef.current?.openCreateModal?.();
  }, [resolvedTableActionsRef]);

  const renderPageHeader = !hideTitle;
  const badgeCount = showPagination ? pagination.totalItems : allData.length;

  return (
    <div className={renderPageHeader ? 'app-page' : undefined}>
      {renderPageHeader ? (
        <PageHeader
          title={title}
          description={description}
          badge={isInitialLoading ? 'Đang tải' : `${badgeCount} mục`}
          onRefresh={handleRefresh}
          onCreate={disableCreate ? undefined : handleCreate}
          createButtonText={createButtonText}
        />
      ) : null}

      <GenericTable
        data={isInitialLoading ? [] : allData}
        columns={columns}
        onEdit={onEdit || undefined}
        onDelete={handleDelete}
        onView={onView || undefined}
        title={title}
        api={api}
        fieldsForModal={fieldsForModal}
        customActions={customActions}
        showPagination={showPagination}
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        totalItems={isInitialLoading ? 0 : pagination.totalItems}
        limit={limit}
        onPageChange={pagination.handlePageChange}
        loading={isInitialLoading}
        isRefreshing={isRefreshing}
        showActions={showActions}
        showDelete={showDelete}
        deleteConfig={deleteConfig}
        showSearch={showSearch}
        searchPlaceholder={searchPlaceholder}
        hideTitle={renderPageHeader ? true : hideTitle}
        onRefresh={handleRefresh}
        onRowClick={onRowClick}
        tableActionsRef={resolvedTableActionsRef}
        showTableHeaderActions={renderPageHeader ? false : showTableHeaderActions}
        disableCreate={disableCreate}
        categoryChangeEventName={categoryChangeEventName}
        onSearchChange={showPagination ? pagination.handleSearchChange : undefined}
        serverSideSearch={showPagination}
      />
    </div>
  );
}

export default memo(GenericCrudPage);
