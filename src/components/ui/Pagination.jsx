import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

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
  className = '',
}) {
  if (totalPages <= 1 && !showInfo) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i += 1) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 3) {
        start = 2;
        end = 5;
      }

      if (currentPage >= totalPages - 2) {
        start = totalPages - 4;
        end = totalPages - 1;
      }

      if (start > 2) pages.push('...');
      for (let i = start; i <= end; i += 1) pages.push(i);
      if (end < totalPages - 1) pages.push('...');

      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();
  const startItem = totalItems > 0 ? (currentPage - 1) * limit + 1 : 0;
  const endItem = Math.min(currentPage * limit, totalItems);

  return (
    <div className={`flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between ${className}`}>
      {showInfo ? (
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
          <span>
            Hiển thị <span className="font-semibold text-[#eecd7e]">{startItem}</span> -{' '}
            <span className="font-semibold text-[#eecd7e]">{endItem}</span> /{' '}
            <span className="font-semibold text-white">{totalItems}</span>
          </span>

          {showPageSize && onPageSizeChange ? (
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-400">Mỗi trang</label>
              <select
                value={limit}
                onChange={(event) => onPageSizeChange(Number(event.target.value))}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-100 focus:border-[#e0a02e] focus:outline-none focus:ring-2 focus:ring-[#1e406b]/30"
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-300 transition hover:border-[#e0a02e]/40 hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          title="Trang đầu"
        >
          <ChevronsLeft size={16} />
        </button>

        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-300 transition hover:border-[#e0a02e]/40 hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          title="Trang trước"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="mx-1 flex items-center gap-1">
          {pageNumbers.map((page, index) =>
            page === '...' ? (
              <span key={`ellipsis-${index}`} className="px-1 text-slate-500">
                ...
              </span>
            ) : (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page)}
                className={`min-w-[2.25rem] rounded-lg px-2.5 py-1.5 text-sm font-medium transition ${
                  page === currentPage
                    ? 'bg-gradient-to-r from-[#1e406b] to-[#c37b1e] text-white shadow-[0_8px_22px_-12px_rgba(17,37,82,0.9)]'
                    : 'border border-slate-700 bg-slate-900 text-slate-300 hover:border-[#e0a02e]/40 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {page}
              </button>
            )
          )}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-300 transition hover:border-[#e0a02e]/40 hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          title="Trang sau"
        >
          <ChevronRight size={16} />
        </button>

        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-300 transition hover:border-[#e0a02e]/40 hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          title="Trang cuối"
        >
          <ChevronsRight size={16} />
        </button>
      </div>
    </div>
  );
}
