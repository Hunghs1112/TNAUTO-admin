// src/components/layout/PageHeader.jsx
import { memo } from 'react';
import { RefreshCw, Plus } from 'lucide-react';

function PageHeader({ 
  title, 
  onRefresh, 
  onCreate,
  createButtonText = "Thêm mới",
  children 
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm">
      <div 
        className="p-4 lg:p-6 border-b border-gray-200 dark:border-slate-800"
        style={{ background: 'var(--gradient-header)' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h1>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Làm mới dữ liệu"
                aria-label="Làm mới dữ liệu"
              >
                <RefreshCw size={18} />
              </button>
            )}
            {onCreate && (
              <button
                type="button"
                onClick={onCreate}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">{createButtonText}</span>
              </button>
            )}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(PageHeader);

