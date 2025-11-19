// src/components/ui/ActionButtons.jsx
import React from 'react';
import { Plus, RefreshCw, Download, Upload } from 'lucide-react';

export default function ActionButtons({ 
  onCreate, 
  onRefresh, 
  onExport, 
  onImport,
  showCreate = true,
  showRefresh = true,
  showExport = false,
  showImport = false,
  createLabel = 'Thêm mới',
  refreshLabel = 'Làm mới',
  exportLabel = 'Xuất dữ liệu',
  importLabel = 'Nhập dữ liệu',
  className = ''
}) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {showCreate && onCreate && (
        <button onClick={onCreate} className="btn-gradient-primary">
          <Plus size={18} />
          {createLabel}
        </button>
      )}
      
      {showRefresh && onRefresh && (
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
        >
          <RefreshCw size={18} />
          {refreshLabel}
        </button>
      )}
      
      {showExport && onExport && (
        <button onClick={onExport} className="btn-gradient-success">
          <Download size={18} />
          {exportLabel}
        </button>
      )}
      
      {showImport && onImport && (
        <button onClick={onImport} className="btn-gradient-secondary">
          <Upload size={18} />
          {importLabel}
        </button>
      )}
    </div>
  );
}