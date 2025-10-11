// src/pages/Vehicles.jsx
import { useState, useEffect, useCallback } from 'react';
import FormModal from '../components/Table/FormModal';
import { vehiclesAPI } from '../services/api';
import { vehiclesConfig } from '../config/entityConfigs.jsx';
import { buttonStyles } from '../styles/colors';
import { Search, X, Edit2, Trash2 } from 'lucide-react';

export default function Vehicles() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isEdit, setIsEdit] = useState(false);

  const fetchData = useCallback(async (search = '') => {
    setLoading(true);
    try {
      const params = {};
      if (search) {
        params.search = search;
      }
      const res = await vehiclesAPI.getAll(params);
      const vehiclesData = res.data.data || [];
      setData(vehiclesData);
    } catch (err) {
      console.error('Fetch vehicles error:', err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(searchTerm);
  }, [searchTerm, fetchData]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchTerm(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchTerm('');
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setIsEdit(true);
    setShowModal(true);
  };

  const handleAddNew = () => {
    setSelectedItem(null);
    setIsEdit(false);
    setShowModal(true);
  };

  const handleSave = async (formData) => {
    try {
      if (isEdit) {
        await vehiclesAPI.update(selectedItem.id, formData);
      } else {
        await vehiclesAPI.create(formData);
      }
      setShowModal(false);
      fetchData(searchTerm);
    } catch (err) {
      console.error('Save error:', err);
      alert('Lỗi: ' + (err.response?.data?.message || err.message));
    }
  };

  // Custom header with search
  const CustomHeader = () => (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold">{vehiclesConfig.title}</h2>
        
        <div className="flex gap-2 w-full sm:w-auto">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-2 flex-1 sm:flex-none">
            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Tìm biển số, mẫu xe, tên KH..."
                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <button
              type="submit"
              className={`${buttonStyles.primary} text-sm whitespace-nowrap flex items-center gap-1`}
            >
              <Search size={16} />
              <span className="hidden sm:inline">Tìm</span>
            </button>
          </form>
          
          {/* Add New Button */}
          <button
            onClick={handleAddNew}
            className={`${buttonStyles.primary} text-sm whitespace-nowrap`}
          >
            + Thêm xe
          </button>
        </div>
      </div>
      
      {/* Search Result Info */}
      {searchTerm && (
        <div className="text-sm text-gray-600">
          Tìm thấy <span className="font-semibold">{data.length}</span> xe cho "{searchTerm}"
          <button
            onClick={handleClearSearch}
            className="ml-2 text-blue-600 hover:text-blue-700 underline"
          >
            Xóa tìm kiếm
          </button>
        </div>
      )}
    </div>
  );

  if (loading && data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-white rounded-lg shadow overflow-hidden">
      {/* Header with Search */}
      <div className="p-3 sm:p-4 border-b border-gray-200 flex-shrink-0">
        <CustomHeader />
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse min-w-max">
          <thead className="bg-gray-200 sticky top-0 z-10">
            <tr>
              {vehiclesConfig.columns.map((col) => (
                <th key={col.key} className="p-2 sm:p-3 text-left text-xs sm:text-sm font-semibold whitespace-nowrap">
                  {col.label}
                </th>
              ))}
              <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-semibold whitespace-nowrap">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? data.map((item) => (
              <tr key={item.id} className="border-b hover:bg-gray-50 transition-colors">
                {vehiclesConfig.columns.map((col) => (
                  <td key={col.key} className="p-2 sm:p-3 text-xs sm:text-sm">
                    {col.render ? col.render(item[col.key], item) : (item[col.key] || '-')}
                  </td>
                ))}
                <td className="p-2 sm:p-3">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleEdit(item)}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50 p-1.5 rounded transition-colors"
                      title="Sửa"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={async () => {
                        if (window.confirm('Xóa xe này?')) {
                          try {
                            await vehiclesAPI.delete(item.id);
                            fetchData(searchTerm);
                          } catch (err) {
                            console.error('Delete error:', err);
                            alert('Không thể xóa: ' + (err.response?.data?.message || err.message));
                          }
                        }
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition-colors"
                      title="Xóa"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={vehiclesConfig.columns.length + 1} className="p-8 text-center text-gray-400">
                  <div className="flex flex-col items-center justify-center">
                    <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p>{searchTerm ? 'Không tìm thấy xe nào' : 'Chưa có xe nào'}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <FormModal
          item={selectedItem}
          isEdit={isEdit}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
          title={vehiclesConfig.title}
          fields={vehiclesConfig.fieldsForModal}
        />
      )}
    </div>
  );
}

