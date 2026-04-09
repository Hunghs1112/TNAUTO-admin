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
            ? 'bg-[#1e406b] text-white' 
            : 'border border-slate-700 bg-slate-900 text-slate-200 hover:border-slate-600 hover:bg-slate-800'
        }`}
      >
        <Filter size={18} />
        {isOpen ? 'Ẩn bộ lọc' : 'Hiện bộ lọc'}
      </button>

      {/* Filter Panel */}
      {isOpen && (
        <div className={`space-y-3 rounded-lg border border-slate-700 bg-slate-900/80 p-4 ${className}`}>
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-semibold text-slate-100">
              <Filter size={18} />
              Bộ lọc
            </h3>
            <button
              onClick={onToggle}
              className="text-slate-400 hover:text-slate-200"
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
          
          <div className="flex gap-2 border-t border-slate-700 pt-2">
            <button 
              onClick={onApply} 
              className="px-4 py-2 bg-[#1e406b] text-white rounded-md hover:bg-[#112552] transition-colors"
            >
              Áp dụng
            </button>
            <button 
              onClick={handleClear} 
              className="rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-slate-200 transition-colors hover:border-slate-600 hover:bg-slate-700"
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>
      )}
    </>
  );
}
