// src/components/form/FilterPanel.jsx
import React from 'react';
import { Filter, X } from 'lucide-react';
import FormField from './FormField';

/**
 * Reusable filter panel component
 * Supports different filter types and configurations
 */
export default function FilterPanel({ 
  isOpen, 
  onToggle, 
  filters, 
  onFilterChange, 
  onApply, 
  onClear,
  filterConfigs = [],
  className = ''
}) {
  const handleFilterChange = (name, value) => {
    onFilterChange({ ...filters, [name]: value });
  };

  const handleClear = () => {
    const clearedFilters = {};
    filterConfigs.forEach(config => {
      clearedFilters[config.name] = config.type === 'checkbox' ? false : '';
    });
    onFilterChange(clearedFilters);
    setTimeout(() => {
      onClear();
    }, 100);
  };

  return (
    <>
      {/* Filter Toggle Button */}
      <button
        onClick={onToggle}
        className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
          isOpen 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        <Filter size={18} />
        {isOpen ? 'Ẩn bộ lọc' : 'Hiện bộ lọc'}
      </button>

      {/* Filter Panel */}
      {isOpen && (
        <div className={`bg-gray-50 rounded-lg p-4 space-y-3 ${className}`}>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-700 flex items-center gap-2">
              <Filter size={18} />
              Bộ lọc
            </h3>
            <button
              onClick={onToggle}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filterConfigs.map(config => (
              <FormField
                key={config.name}
                name={config.name}
                label={config.label}
                type={config.type}
                value={filters[config.name] || ''}
                onChange={(e) => handleFilterChange(config.name, config.type === 'checkbox' ? e.target.checked : e.target.value)}
                options={config.options}
                placeholder={config.placeholder}
                className={config.className}
              />
            ))}
          </div>
          
          <div className="flex gap-2 pt-2 border-t border-gray-200">
            <button 
              onClick={onApply} 
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Áp dụng
            </button>
            <button 
              onClick={handleClear} 
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>
      )}
    </>
  );
}
