// src/components/features/NotificationFilters.jsx
import { Filter } from 'lucide-react';
import { buttonStyles } from '../../styles/colors';

/**
 * Notification Filters Component
 * Tách từ Notifications.jsx để tái sử dụng
 */
export default function NotificationFilters({ 
  filters, 
  onFiltersChange, 
  onApply, 
  onClear 
}) {
  return (
    <div className="bg-slate-900/80 rounded-lg p-4 space-y-3 border border-slate-700 transition-colors duration-300">
      <h3 className="font-semibold text-slate-100 flex items-center gap-2">
        <Filter size={18} />
        Bộ lọc
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">User Type</label>
          <select
            value={filters.recipient_type}
            onChange={(e) => onFiltersChange({ ...filters, recipient_type: e.target.value })}
            className="w-full px-3 py-2 border border-slate-600 rounded-md focus:ring-2 focus:ring-[#1e406b] focus:border-transparent bg-slate-800 text-slate-100 transition-colors duration-300"
          >
            <option value="">Tất cả</option>
            <option value="customer">Khách hàng</option>
            <option value="employee">Nhân viên</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Trạng thái</label>
          <select
            value={filters.is_read}
            onChange={(e) => onFiltersChange({ ...filters, is_read: e.target.value })}
            className="w-full px-3 py-2 border border-slate-600 rounded-md focus:ring-2 focus:ring-[#1e406b] focus:border-transparent bg-slate-800 text-slate-100 transition-colors duration-300"
          >
            <option value="">Tất cả</option>
            <option value="0">Chưa đọc</option>
            <option value="1">Đã đọc</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">User ID</label>
          <input
            type="number"
            value={filters.recipient_id}
            onChange={(e) => onFiltersChange({ ...filters, recipient_id: e.target.value })}
            placeholder="Nhập User ID"
            className="w-full px-3 py-2 border border-slate-600 rounded-md focus:ring-2 focus:ring-[#1e406b] focus:border-transparent bg-slate-800 text-slate-100 placeholder:text-slate-500 transition-colors duration-300"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onApply} className={buttonStyles.primary}>
          Áp dụng
        </button>
        <button onClick={onClear} className={buttonStyles.secondary}>
          Xóa bộ lọc
        </button>
      </div>
    </div>
  );
}

