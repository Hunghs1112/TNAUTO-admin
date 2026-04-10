import { memo, useCallback, useEffect, useRef, useState } from 'react';
import PageHeader from '../layout/PageHeader';
import GenericTable from '../table/Table';
import { useToast } from '../../contexts/ToastContext';

function extractListData(response) {
  const raw = response?.data;

  if (Array.isArray(raw?.data)) {
    return raw.data;
  }

  if (Array.isArray(raw)) {
    return raw;
  }

  return [];
}

function extractPaginationMeta(response, fallbackPage, fallbackLimit, fallbackTotal) {
  const raw = response?.data || {};
  const pagination = raw.pagination || {};
  const totalItems =
    Number(raw.total ?? raw.count ?? pagination.totalItems ?? pagination.total ?? fallbackTotal ?? 0) || 0;
  const pageSize = Number(raw.limit ?? pagination.pageSize ?? fallbackLimit ?? 10) || fallbackLimit || 10;
  const totalPages =
    Number(raw.totalPages ?? pagination.totalPages ?? Math.max(1, Math.ceil(totalItems / Math.max(pageSize, 1)))) || 1;
  const currentPage = Number(raw.page ?? pagination.currentPage ?? fallbackPage ?? 1) || 1;

  return {
    totalItems,
    totalPages: Math.max(1, totalPages),
    currentPage: Math.max(1, currentPage),
  };
}

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

  const [allData, setAllData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const internalTableActionsRef = useRef(null);
  const resolvedTableActionsRef = tableActionsRef || internalTableActionsRef;
  const apiRef = useRef(api);
  const transformDataRef = useRef(transformData);
  const onErrorRef = useRef(onError);
  const hasLoadedOnceRef = useRef(false);
  const additionalParamsRef = useRef(additionalParams || null);

  useEffect(() => {
    apiRef.current = api;
    transformDataRef.current = transformData;
    onErrorRef.current = onError;
    additionalParamsRef.current = additionalParams || null;
  }, [additionalParams, api, transformData, onError]);

  const fetchData = useCallback(
    async ({ isInitial = false } = {}) => {
      if (isInitial) {
        setIsInitialLoading(true);
      } else {
        setIsRefreshing(true);
      }

      try {
        const normalizedAdditionalParams =
          additionalParamsRef.current && typeof additionalParamsRef.current === 'object' ? additionalParamsRef.current : {};
        const params = {
          _t: Date.now(),
          ...normalizedAdditionalParams,
        };

        if (import.meta.env.DEV) {
          console.log('[List Params]', {
            title,
            currentPage,
            searchTerm,
            showPagination,
            additionalParams: normalizedAdditionalParams,
          });
        }

        if (showPagination) {
          params.page = currentPage;
        }

        if (searchTerm) {
          params.search = searchTerm;
        }

        const response = await apiRef.current.getAll(params);
        const fetchedData = transformDataRef.current(extractListData(response)) || [];

        if (showPagination) {
          const meta = extractPaginationMeta(response, currentPage, limit, fetchedData.length);

          setAllData(fetchedData);
          setTotalItems(meta.totalItems);
          setTotalPages(meta.totalPages);

          if (meta.totalPages > 0 && currentPage > meta.totalPages) {
            setCurrentPage(meta.totalPages);
            return;
          }

          if (meta.currentPage !== currentPage) {
            setCurrentPage(meta.currentPage);
          }
        } else {
          setAllData(fetchedData);
          setTotalItems(fetchedData.length);
          setTotalPages(1);
          setCurrentPage(1);
        }
      } catch (error) {
        if (typeof onErrorRef.current === 'function') {
          onErrorRef.current(error);
        } else {
          showError(error?.message || 'Không thể tải dữ liệu. Vui lòng thử lại.');
        }

        setAllData([]);
        setTotalItems(0);
        setTotalPages(1);

        if (!showPagination) {
          setCurrentPage(1);
        }
      } finally {
        hasLoadedOnceRef.current = true;

        if (isInitial) {
          setIsInitialLoading(false);
        } else {
          setIsRefreshing(false);
        }
      }
    },
    [currentPage, limit, searchTerm, showError, showPagination, title]
  );

  useEffect(() => {
    fetchData({ isInitial: !hasLoadedOnceRef.current });
  }, [fetchData]);

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
  }, [fetchData, refreshTrigger]);

  const handleDelete = useCallback((id) => {
    setAllData((prev) => prev.filter((item) => item.id !== id));
    setTotalItems((prev) => Math.max(0, prev - 1));
  }, []);

  const handleRefresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const handlePageChange = useCallback(
    (page) => {
      if (page >= 1 && page <= totalPages && page !== currentPage) {
        setCurrentPage(page);
      }
    },
    [currentPage, totalPages]
  );

  const handleSearchChange = useCallback(
    (value) => {
      const nextSearchTerm = String(value || '').trim();
      setSearchTerm(nextSearchTerm);
      setCurrentPage(1);
    },
    []
  );

  const handleCreate = useCallback(() => {
    resolvedTableActionsRef.current?.openCreateModal?.();
  }, [resolvedTableActionsRef]);

  const renderPageHeader = !hideTitle;
  const badgeCount = showPagination ? totalItems : allData.length;

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
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={isInitialLoading ? 0 : totalItems}
        limit={limit}
        onPageChange={handlePageChange}
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
        onSearchChange={showPagination ? handleSearchChange : undefined}
        serverSideSearch={showPagination}
      />
    </div>
  );
}

export default memo(GenericCrudPage);

