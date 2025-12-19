// src/components/features/GenericCrudPage.jsx
import { useState, useEffect, memo, useCallback, useRef } from 'react';
import GenericTable from '../table/Table';

/**
 * Generic CRUD page component that handles standard entity management
 * Pattern giống NotificationManagement để tránh chớp loading
 * Tự quản lý state, không dùng useEntityCrud để tránh loading state ban đầu
 * 
 * @param {Object} props - Configuration for the page
 * @param {Object} props.api - API object with CRUD methods
 * @param {Array} props.columns - Column definitions for the table
 * @param {Array} props.fieldsForModal - Field definitions for the form modal
 * @param {string} props.title - Page/entity title
 * @param {Object} props.options - Additional options (transformData, onError, etc.)
 * @param {React.Component} props.customActions - Custom action buttons
 * @param {boolean} props.showPagination - Whether to show pagination
 * @param {number} props.limit - Items per page
 */
function GenericCrudPage({ 
  api, 
  columns, 
  fieldsForModal, 
  title, 
  options = {},
  customActions,
  showPagination = false,
  limit = 10,
  showSearch = true,
  searchPlaceholder = 'Tìm kiếm...',
  hideTitle = false,
  showActions = true,
  onRowClick = null,
  onView = null,
  onEdit = null,
  tableActionsRef = null,
  showTableHeaderActions = true,
  refreshTrigger = null,
  disableCreate = false
}) {
  const { transformData = (data) => data, onError = (error) => console.error('Error:', error) } = options;
  
  // Tự quản lý state giống NotificationManagement - không có loading state ban đầu
  const [allData, setAllData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasFetched, setHasFetched] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true); // Track initial load để tránh hiển thị empty state ngay

  // Use refs để giữ stable references và tránh infinite loop
  const apiRef = useRef(api);
  const transformDataRef = useRef(transformData);
  const onErrorRef = useRef(onError);

  // Update refs khi props thay đổi
  useEffect(() => {
    apiRef.current = api;
    transformDataRef.current = transformData;
    onErrorRef.current = onError;
  }, [api, transformData, onError]);

  // Fetch data - không set loading state để tránh chớp (giống NotificationManagement)
  // Không dùng useCallback với dependencies để tránh infinite loop
  const fetchData = async (isInitial = false) => {
    if (isInitial) {
      setIsInitialLoading(true);
    }
    
    try {
      console.log(`[GenericCrudPage] Fetching data for ${title}, isInitial:`, isInitial);
      // Add cache busting to ensure fresh data - pass timestamp as param
      const cacheBustParam = { _t: Date.now() };
      console.log(`[GenericCrudPage] Calling getAll with cache bust param:`, cacheBustParam);
      const res = await apiRef.current.getAll(cacheBustParam);
      let fetchedData = [];
      
      // Handle response format
      if (res.data) {
        if (Array.isArray(res.data.data)) {
          fetchedData = res.data.data;
        } else if (Array.isArray(res.data)) {
          fetchedData = res.data;
        }
      }
      
      console.log(`[GenericCrudPage] Fetched ${fetchedData.length} items for ${title}`);
      
      // Log sample data to verify product_count/service_count
      if (fetchedData.length > 0 && (title.includes('Danh mục') || title.includes('Category'))) {
        console.log(`[GenericCrudPage] Sample category data:`, fetchedData[0]);
        if (fetchedData[0].product_count !== undefined) {
          console.log(`[GenericCrudPage] First category product_count:`, fetchedData[0].product_count);
        }
        if (fetchedData[0].service_count !== undefined) {
          console.log(`[GenericCrudPage] First category service_count:`, fetchedData[0].service_count);
        }
      }
      
      // Transform data nếu có
      const transformed = transformDataRef.current(fetchedData);
      console.log(`[GenericCrudPage] Transformed data for ${title}:`, transformed?.length || 0, 'items');
      
      // Log transformed sample to verify counts are preserved
      if (transformed && transformed.length > 0 && (title.includes('Danh mục') || title.includes('Category'))) {
        console.log(`[GenericCrudPage] Sample transformed category:`, transformed[0]);
      }
      
      setAllData(transformed || []);
      setCurrentPage(1);
    } catch (err) {
      console.error(`[GenericCrudPage] Fetch error for ${title}:`, err);
      onErrorRef.current(err);
      setAllData([]);
      setCurrentPage(1);
    } finally {
      if (isInitial) {
        setIsInitialLoading(false);
      }
    }
  };

  // Fetch on mount - chỉ chạy một lần (giống NotificationManagement)
  useEffect(() => {
    if (!hasFetched) {
      fetchData(true); // Pass isInitial = true
      setHasFetched(true);
    }
  }, [hasFetched]);

  // Refresh when refreshTrigger changes
  useEffect(() => {
    if (hasFetched && refreshTrigger !== null && refreshTrigger > 0) {
      console.log(`[GenericCrudPage] Refresh triggered for ${title}, refreshTrigger:`, refreshTrigger);
      // Add delay to ensure backend has updated the counts (backend may need time to recalculate)
      let timeoutId2 = null;
      const timeoutId1 = setTimeout(() => {
        console.log(`[GenericCrudPage] Executing first refresh for ${title} after 1s delay`);
        fetchData();
        
        // Second refresh after another delay to ensure backend has fully updated
        timeoutId2 = setTimeout(() => {
          console.log(`[GenericCrudPage] Executing second refresh for ${title} after additional 1s delay`);
          fetchData();
        }, 1000);
      }, 1000); // First delay: 1 second
      
      return () => {
        clearTimeout(timeoutId1);
        if (timeoutId2) clearTimeout(timeoutId2);
      };
    }
  }, [refreshTrigger, hasFetched, title]);

  // Handle delete
  const handleDelete = useCallback(async (id) => {
    try {
      await apiRef.current.delete(id);
      // Update local state instead of refetching immediately
      setAllData(prevData => prevData.filter(item => item.id !== id));
    } catch (err) {
      console.error('Delete error:', err);
      onErrorRef.current(err);
      // Refresh on error
      fetchData();
    }
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    fetchData();
  }, []);

  // Pagination - giống NotificationManagement: paginate trước khi truyền vào GenericTable
  const paginatedData = useCallback(() => {
    if (!showPagination) return allData;
    const startIndex = (currentPage - 1) * limit;
    return allData.slice(startIndex, startIndex + limit);
  }, [allData, showPagination, currentPage, limit]);

  const totalPages = showPagination ? Math.ceil(allData.length / limit) : 1;

  const handlePageChange = useCallback((page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  // Chỉ render table sau khi đã fetch xong lần đầu để tránh hiển thị empty state rồi nháy
  // Trong lúc initial loading, không render gì hoặc render skeleton nhẹ
  if (isInitialLoading) {
    return (
      <GenericTable
        data={[]}
        columns={columns}
        onEdit={onEdit || handleRefresh}
        onDelete={handleDelete}
        onView={onView || undefined}
        title={title}
        api={api}
        fieldsForModal={fieldsForModal}
        customActions={customActions}
        showPagination={showPagination}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={0}
        limit={limit}
        onPageChange={handlePageChange}
        // Hiển thị skeleton trong lúc initial loading
        loading={true}
        isRefreshing={false}
        showActions={showActions}
        showSearch={showSearch}
        searchPlaceholder={searchPlaceholder}
        hideTitle={hideTitle}
        onRefresh={handleRefresh}
        onRowClick={onRowClick}
        tableActionsRef={tableActionsRef}
        showTableHeaderActions={showTableHeaderActions}
        disableCreate={disableCreate}
      />
    );
  }

  return (
    <GenericTable
      data={paginatedData()}
      columns={columns}
      onEdit={onEdit || handleRefresh}
      onDelete={handleDelete}
      onView={onView || undefined}
      title={title}
      api={api}
      fieldsForModal={fieldsForModal}
      customActions={customActions}
      showPagination={showPagination}
      currentPage={currentPage}
      totalPages={totalPages}
      totalItems={allData.length}
      limit={limit}
      onPageChange={handlePageChange}
      // Sau khi initial load xong, không hiển thị loading nữa
      loading={false}
      isRefreshing={false}
      showActions={showActions}
      showSearch={showSearch}
      searchPlaceholder={searchPlaceholder}
      // GenericTable sẽ tự xử lý search trên paginated data
      hideTitle={hideTitle}
      onRefresh={handleRefresh}
      onRowClick={onRowClick}
      tableActionsRef={tableActionsRef}
      showTableHeaderActions={showTableHeaderActions}
      disableCreate={disableCreate}
    />
  );
}

export default memo(GenericCrudPage);

