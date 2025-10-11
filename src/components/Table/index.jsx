// src/components/Table/index.jsx
import { useState } from 'react';
import { Trash2, Edit2, Eye } from 'lucide-react';
import FormModal from './FormModal';
import Pagination from '../Pagination';
import { buttonStyles, actionColors } from '../../styles/colors';

export default function GenericTable({ 
  data = [], 
  columns, 
  onEdit, 
  onDelete, 
  onView, 
  title, 
  api, 
  idKey = 'id', 
  customActions, 
  fieldsForModal = [],
  showPagination = false,
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  limit = 10,
  onPageChange = () => {}
}) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const totalColumns = columns.length + 1; // +1 for actions column
  const colWidth = `${100 / totalColumns}%`;


  const handleEdit = (item) => {
    setSelectedItem(item);
    setIsEdit(true);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm(`Xóa ${title.slice(0, -1).toLowerCase()}?`)) {
      try {
        await api.delete(id);
        onDelete(id);
      } catch (err) {
        console.error('Delete error:', err);
      }
    }
  };

  const handleView = (item) => {
    onView(item);
  };

  const defaultActions = (item) => (
    <div className="flex items-center gap-1 sm:gap-2">
      <button 
        onClick={() => handleView(item)} 
        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-1.5 rounded transition-colors"
        title="Xem"
      >
        <Eye size={16} />
      </button>
      <button 
        onClick={() => handleEdit(item)} 
        className="text-green-600 hover:text-green-700 hover:bg-green-50 p-1.5 rounded transition-colors"
        title="Sửa"
      >
        <Edit2 size={16} />
      </button>
      <button 
        onClick={() => handleDelete(item[idKey])} 
        className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition-colors"
        title="Xóa"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );

  return (
    <div className="flex flex-col h-full w-full bg-white rounded-lg shadow overflow-hidden">
      {/* Header - Fixed */}
      <div className="p-3 sm:p-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold">{title}</h2>
          <button
            onClick={() => { setSelectedItem(null); setIsEdit(false); setShowModal(true); }}
            className={`${buttonStyles.primary} text-xs sm:text-sm whitespace-nowrap`}
          >
            + Thêm mới
          </button>
        </div>
      </div>

      {/* Table Container - Scrollable */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse min-w-max">
          <thead className="bg-gray-200 sticky top-0 z-10">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="p-2 sm:p-3 text-left text-xs sm:text-sm font-semibold whitespace-nowrap">
                  {col.label}
                </th>
              ))}
              <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-semibold whitespace-nowrap">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(data) && data.length > 0 ? data.map((item) => (
              <tr key={item[idKey]} className="border-b hover:bg-gray-50 transition-colors">
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
              <tr>
                <td colSpan={totalColumns} className="p-8 text-center text-gray-400">
                  <div className="flex flex-col items-center justify-center">
                    <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p>Không có dữ liệu</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination - Fixed */}
      {showPagination && (
        <div className="p-3 sm:p-4 border-t border-gray-200 flex-shrink-0">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            limit={limit}
          />
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <FormModal
          item={selectedItem}
          isEdit={isEdit}
          onClose={() => setShowModal(false)}
          onSave={(savedData) => {
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