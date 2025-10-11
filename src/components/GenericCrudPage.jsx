// src/components/GenericCrudPage.jsx
import GenericTable from './Table';
import useEntityCrud from '../hooks/useEntityCrud';

/**
 * Generic CRUD page component that handles standard entity management
 * Eliminates the need for duplicate page components
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
  limit = 10
}) {
  const { 
    data, 
    loading, 
    handleRefresh, 
    handleDelete,
  } = useEntityCrud(api, options);

  if (loading && data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Đang tải...</p>
      </div>
    );
  }

  return (
    <GenericTable
      data={data}
      columns={columns}
      onEdit={handleRefresh}
      onDelete={(id) => {
        handleDelete(id);
      }}
      onView={() => {}}
      title={title}
      api={api}
      fieldsForModal={fieldsForModal}
      customActions={customActions}
      showPagination={showPagination}
      limit={limit}
    />
  );
}

