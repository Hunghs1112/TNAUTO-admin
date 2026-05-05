import { useCallback, useMemo, useState } from 'react';

export default function useServerPagination({
  showPagination = false,
  initialPage = 1,
  initialLimit = 10,
  initialTotalItems = 0,
  initialTotalPages = 1,
}) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalItems, setTotalItems] = useState(initialTotalItems);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [searchTerm, setSearchTerm] = useState('');

  const handlePageChange = useCallback(
    (page) => {
      if (!showPagination) {
        return;
      }

      if (page >= 1 && page <= totalPages && page !== currentPage) {
        setCurrentPage(page);
      }
    },
    [currentPage, showPagination, totalPages]
  );

  const handleSearchChange = useCallback(
    (value) => {
      const nextSearchTerm = String(value || '').trim();
      setSearchTerm(nextSearchTerm);
      setCurrentPage(1);
    },
    []
  );

  const resetPagination = useCallback(() => {
    setCurrentPage(1);
    setTotalItems(0);
    setTotalPages(1);
  }, []);

  const applyMeta = useCallback((meta) => {
    const nextTotalItems = Number(meta?.totalItems ?? 0) || 0;
    const nextTotalPages = Math.max(1, Number(meta?.totalPages ?? 1) || 1);
    const nextCurrentPage = Math.max(1, Number(meta?.currentPage ?? 1) || 1);

    setTotalItems(nextTotalItems);
    setTotalPages(nextTotalPages);
    setCurrentPage(nextCurrentPage);

    return {
      totalItems: nextTotalItems,
      totalPages: nextTotalPages,
      currentPage: nextCurrentPage,
    };
  }, []);

  const setClientModeTotals = useCallback((count) => {
    setTotalItems(count);
    setTotalPages(1);
    setCurrentPage(1);
  }, []);

  const state = useMemo(
    () => ({
      currentPage,
      totalItems,
      totalPages,
      searchTerm,
    }),
    [currentPage, searchTerm, totalItems, totalPages]
  );

  return {
    ...state,
    setCurrentPage,
    setTotalItems,
    setTotalPages,
    setSearchTerm,
    handlePageChange,
    handleSearchChange,
    resetPagination,
    applyMeta,
    setClientModeTotals,
    pageSize: initialLimit,
  };
}
