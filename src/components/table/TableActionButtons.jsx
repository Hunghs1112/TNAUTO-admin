import React from 'react';
import { Edit2, Trash2, Eye } from 'lucide-react';

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
  className = '',
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
      {showView && onView ? (
        <button
          onClick={handleView}
          className="rounded p-1.5 text-[#e0a02e] transition-colors hover:bg-[#1e406b]/12 hover:text-[#eecd7e]"
          title="Xem chi tiết"
        >
          <Eye size={16} />
        </button>
      ) : null}

      {showEdit && onEdit ? (
        <button
          onClick={handleEdit}
          className="rounded p-1.5 text-[#eecd7e] transition-colors hover:bg-[#c37b1e]/12 hover:text-[#f8ecd6]"
          title="Sửa"
        >
          <Edit2 size={16} />
        </button>
      ) : null}

      {showDelete && onDelete ? (
        <button
          onClick={handleDelete}
          className="rounded p-1.5 text-[#b48242] transition-colors hover:bg-[#b48242]/12 hover:text-[#e0a02e]"
          title="Xóa"
        >
          <Trash2 size={16} />
        </button>
      ) : null}

      {customActions && customActions(item)}
    </div>
  );
}
