// src/components/table/TableActionButtons.jsx
import React from 'react';
import { Edit2, Trash2, Eye } from 'lucide-react';

/**
 * Action buttons component for table rows
 * Shows edit, delete, and custom action buttons
 */
export default function TableActionButtons({ 
  item, 
  onEdit, 
  onDelete, 
  onView,
  idKey = 'id',
  customActions,
  showEdit = true,
  showDelete = true,
  showView = false,
  className = ''
}) {
  const handleEdit = () => {
    onEdit && onEdit(item);
  };

  const handleDelete = () => {
    onDelete && onDelete(item[idKey]);
  };

  const handleView = () => {
    onView && onView(item);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showView && onView && (
        <button 
          onClick={handleView}
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-1.5 rounded transition-colors"
          title="Xem chi tiết"
        >
          <Eye size={16} />
        </button>
      )}
      
      {showEdit && onEdit && (
        <button 
          onClick={handleEdit}
          className="text-green-600 hover:text-green-700 hover:bg-green-50 p-1.5 rounded transition-colors"
          title="Sửa"
        >
          <Edit2 size={16} />
        </button>
      )}
      
      {showDelete && onDelete && (
        <button 
          onClick={handleDelete}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition-colors"
          title="Xóa"
        >
          <Trash2 size={16} />
        </button>
      )}
      
      {/* Custom Actions */}
      {customActions && customActions(item)}
    </div>
  );
}

