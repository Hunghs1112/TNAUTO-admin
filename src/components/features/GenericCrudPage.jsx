// src/components/features/GenericCrudPage.jsx
import GenericTable from '../table/Table';
import useEntityCrud from '../../hooks/useEntityCrud';

/**
 * Generic CRUD page component that handles standard entity management
 * Eliminates the need for duplicate page components
 * Now uses global loading context for consistent loading states
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
export default function GenericCrudPage({ 
  api, 
  columns, 
  fieldsForModal, 
  title, 
  options = {},
  customActions,
  showPagination = false,
  limit = 10,
  showSearch = false,
  searchPlaceholder = 'Tìm kiếm...',
  hideTitle = false,
  showActions = true,
  onRowClick = null,
  onView = null,
  onEdit = null
}) {
  // Generate unique loading key based on title (use entity name or fallback)
  const loadingKey = title ? `crud-${title.toLowerCase().replace(/\s+/g, '-')}` : 'crud-page';
  
  const { 
    data, 
    handleRefresh, 
    handleDelete,
    handleSearch,
    loading,
    isRefreshing
  } = useEntityCrud(api, { 
    ...options, 
    loadingKey 
  });

  return (
    <GenericTable
      data={data}
      columns={columns}
      onEdit={onEdit || handleRefresh}
      onDelete={(id) => {
        handleDelete(id);
      }}
      onView={onView || undefined}
      title={title}
      api={api}
      fieldsForModal={fieldsForModal}
      customActions={customActions}
      showPagination={showPagination}
      limit={limit}
      loading={loading}
      isRefreshing={isRefreshing}
      showActions={showActions}
      showSearch={showSearch}
      searchPlaceholder={searchPlaceholder}
      onSearch={handleSearch}
      hideTitle={hideTitle}
      onRefresh={handleRefresh}
      onRowClick={onRowClick}
    />
  );
}

