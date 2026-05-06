import { useCallback, useEffect, useRef, useState } from 'react';

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
  // Ưu tiên meta object mới, fallback về flat fields cũ và pagination object
  const meta = raw.meta || {};
  const pagination = raw.pagination || {};
  const totalItems =
    Number(meta.total ?? raw.total ?? raw.count ?? pagination.totalItems ?? pagination.total ?? fallbackTotal ?? 0) || 0;
  const pageSize = Number(meta.limit ?? raw.limit ?? pagination.pageSize ?? fallbackLimit ?? 10) || fallbackLimit || 10;
  const totalPages =
    Number(meta.totalPages ?? raw.totalPages ?? pagination.totalPages ?? Math.max(1, Math.ceil(totalItems / Math.max(pageSize, 1)))) || 1;
  const currentPage = Number(meta.page ?? raw.page ?? pagination.currentPage ?? fallbackPage ?? 1) || 1;

  return {
    totalItems,
    totalPages: Math.max(1, totalPages),
    currentPage: Math.max(1, currentPage),
  };
}

export default function useListFetch({
  api,
  showPagination,
  limit,
  title,
  transformData,
  onError,
  showError,
  pagination,
  additionalParams,
}) {
  const [allData, setAllData] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const apiRef = useRef(api);
  const transformDataRef = useRef(transformData);
  const onErrorRef = useRef(onError);
  const showErrorRef = useRef(showError);
  const hasLoadedOnceRef = useRef(false);
  const additionalParamsRef = useRef(additionalParams || null);
  const paginationRef = useRef(pagination);

  useEffect(() => {
    apiRef.current = api;
    transformDataRef.current = transformData;
    onErrorRef.current = onError;
    showErrorRef.current = showError;
    additionalParamsRef.current = additionalParams || null;
    paginationRef.current = pagination;
  }, [additionalParams, api, onError, pagination, showError, transformData]);

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
            currentPage: paginationRef.current.currentPage,
            searchTerm: paginationRef.current.searchTerm,
            showPagination,
            additionalParams: normalizedAdditionalParams,
          });
        }

        if (showPagination) {
          params.page = paginationRef.current.currentPage;
          params.limit = limit;
        }

        // ✅ Send search parameter to backend
        // Backend will search across entire database, not just current page
        if (paginationRef.current.searchTerm) {
          params.search = paginationRef.current.searchTerm;
        }

        const response = await apiRef.current.getAll(params);
        const fetchedData = transformDataRef.current(extractListData(response)) || [];

        if (showPagination) {
          const meta = extractPaginationMeta(response, paginationRef.current.currentPage, limit, fetchedData.length);

          setAllData(fetchedData);
          const appliedMeta = paginationRef.current.applyMeta(meta);

          if (appliedMeta.totalPages > 0 && paginationRef.current.currentPage > appliedMeta.totalPages) {
            paginationRef.current.setCurrentPage(appliedMeta.totalPages);
            return;
          }
        } else {
          setAllData(fetchedData);
          paginationRef.current.setClientModeTotals(fetchedData.length);
        }
      } catch (error) {
        if (typeof onErrorRef.current === 'function') {
          onErrorRef.current(error);
        } else {
          showErrorRef.current(error?.message || 'Không thể tải dữ liệu. Vui lòng thử lại.');
        }

        setAllData([]);

        if (showPagination) {
          paginationRef.current.resetPagination();
        } else {
          paginationRef.current.setClientModeTotals(0);
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
    [limit, showPagination, title]
  );

  useEffect(() => {
    fetchData({ isInitial: !hasLoadedOnceRef.current });
  }, [fetchData, pagination?.currentPage, pagination?.searchTerm, additionalParams, limit, showPagination]);

  return {
    allData,
    setAllData,
    isInitialLoading,
    isRefreshing,
    hasLoadedOnceRef,
    fetchData,
  };
}
