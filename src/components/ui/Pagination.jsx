// src/components/ui/Pagination.jsx
import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

/**
 * Modern pagination component with enhanced UX
 * Features: First/Last page jumps, page size selector, info display
 */
export default function Pagination({ 
  currentPage = 1, 
  totalPages = 1, 
  totalItems = 0,
  limit = 10,
  onPageChange,
  showInfo = true,
  showPageSize = false,
  pageSizeOptions = [10, 25, 50, 100],
  onPageSizeChange,
  className = ''
}) {
  if (totalPages <= 1 && !showInfo) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 7;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      // Calculate range around current page
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      
      // Adjust if near start
      if (currentPage <= 3) {
        start = 2;
        end = 5;
      }
      
      // Adjust if near end
      if (currentPage >= totalPages - 2) {
        start = totalPages - 4;
        end = totalPages - 1;
      }
      
      // Add ellipsis after first page if needed
      if (start > 2) {
        pages.push('...');
      }
      
      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      // Add ellipsis before last page if needed
      if (end < totalPages - 1) {
        pages.push('...');
      }
      
      // Always show last page
      pages.push(totalPages);
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();
  const startItem = totalItems > 0 ? (currentPage - 1) * limit + 1 : 0;
  const endItem = Math.min(currentPage * limit, totalItems);

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
      {/* Info Display */}
      {showInfo && (
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 dark:text-gray-300">
            Hiển thị{' '}
            <span className="font-bold text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30">{startItem}</span>
            {' '}-{' '}
            <span className="font-bold text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30">{endItem}</span>
            {' '}trong tổng số{' '}
            <span className="font-bold text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-md bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700">{totalItems}</span>
            {' '}mục
          </span>
          
          {/* Page Size Selector */}
          {showPageSize && onPageSizeChange && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-300">Hiển thị:</label>
              <select
                value={limit}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="px-3 py-1.5 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 transition-colors duration-300"
              >
                {pageSizeOptions.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
      
      {/* Pagination Controls */}
      <div className="flex items-center gap-1">
        {/* First Page */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          title="Trang đầu"
        >
          <ChevronsLeft size={18} />
        </button>
        
        {/* Previous Page */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          title="Trang trước"
        >
          <ChevronLeft size={18} />
        </button>
        
        {/* Page Numbers */}
        <div className="flex items-center gap-1 mx-2">
          {pageNumbers.map((page, index) => (
            page === '...' ? (
              <span 
                key={`ellipsis-${index}`} 
                className="px-2 text-gray-400 dark:text-gray-500"
              >
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`min-w-[2.5rem] h-10 px-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                  page === currentPage
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-500 dark:to-blue-600 text-white shadow-md hover:shadow-lg hover:scale-105 active:scale-95'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-gray-100 hover:shadow-sm active:scale-95'
                }`}
              >
                {page}
              </button>
            )
          ))}
        </div>
        
        {/* Next Page */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          title="Trang sau"
        >
          <ChevronRight size={18} />
        </button>
        
        {/* Last Page */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          title="Trang cuối"
        >
          <ChevronsRight size={18} />
        </button>
      </div>
    </div>
  );
}
