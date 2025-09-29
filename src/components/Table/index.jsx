// src/components/Table/index.jsx
import { useState, useEffect } from 'react';
import { Trash2, Edit2, Eye } from 'lucide-react';
import FormModal from './FormModal';

export default function GenericTable({ data = [], columns, onEdit, onDelete, onView, title, api, idKey = 'id', customActions, fieldsForModal = [] }) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    console.log(`${title} data loaded:`, data);
  }, [data]);

  const handleEdit = (item) => {
    setSelectedItem(item);
    setIsEdit(true);
    setShowModal(true);
    console.log('Edit item:', item);
  };

  const handleDelete = async (id) => {
    if (window.confirm(`Xóa ${title.slice(0, -1).toLowerCase()}?`)) {
      try {
        await api.delete(id);
        onDelete(id);
        console.log('Deleted:', id);
      } catch (err) {
        console.error('Delete error:', err);
      }
    }
  };

  const handleView = (item) => {
    console.log('View item:', item);
    onView(item);
  };

  const defaultActions = (item) => (
    <div className="flex space-x-1 sm:space-x-2">
      <button onClick={() => handleView(item)} className="text-blue-500 hover:text-blue-700 p-1 sm:p-1" title="Xem"><Eye size={16} /></button>
      <button onClick={() => handleEdit(item)} className="text-green-500 hover:text-green-700 p-1 sm:p-1" title="Sửa"><Edit2 size={16} /></button>
      <button onClick={() => handleDelete(item[idKey])} className="text-red-500 hover:text-red-700 p-1 sm:p-1" title="Xóa"><Trash2 size={16} /></button>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden w-full h-full">
      <div className="p-2 sm:p-4 lg:p-6 h-full">
        <h2 className="text-xl sm:text-2xl font-bold mb-4">{title}</h2>
        <div className="overflow-x-auto w-full h-full">
          <table className="w-full table-auto border-collapse min-w-full">
            <thead>
              <tr className="bg-gray-200">
                {columns.map((col) => <th key={col.key} className="p-2 sm:p-3 text-left text-xs sm:text-sm font-semibold">{col.label}</th>)}
                <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-semibold">Thao tác</th>
              </tr>
            </thead>
            <tbody className="h-full">
              {Array.isArray(data) ? data.map((item) => (
                <tr key={item[idKey]} className="border-b hover:bg-gray-50">
                  {columns.map((col) => (
                    <td key={col.key} className="p-2 sm:p-3 text-xs sm:text-sm">
                      {col.render ? col.render(item[col.key], item) : (item[col.key] || '-')}
                    </td>
                  ))}
                  <td className="p-2 sm:p-3">
                    {customActions ? customActions(item) : defaultActions(item)}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={columns.length + 1} className="p-3 text-center text-gray-500 text-sm">Không có dữ liệu</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <button
          onClick={() => { setSelectedItem(null); setIsEdit(false); setShowModal(true); }}
          className="mt-4 bg-amber-300 text-black px-4 py-2 rounded hover:bg-blue-600 text-sm w-full sm:w-auto"
        >
          Thêm mới
        </button>
      </div>
      {showModal && (
        <FormModal
          item={selectedItem}
          isEdit={isEdit}
          onClose={() => setShowModal(false)}
          onSave={(savedData) => {
            console.log('Saving:', isEdit ? 'update' : 'create', savedData);
            if (isEdit) {
              api.update(selectedItem[idKey], savedData).then(() => onEdit());
            } else {
              api.create(savedData).then(() => onEdit());
            }
            setShowModal(false);
          }}
          title={title}
          fields={fieldsForModal}
        />
      )}
    </div>
  );
}