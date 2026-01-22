// src/components/features/NotificationManagement.jsx
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import GenericTable from '../table/Table';
import { adminNotificationsAPI, notificationsAPI, customersAPI, employeesAPI } from '../../services/api';
import { formatDate, truncateText } from '../../utils/format';
import { buttonStyles } from '../../styles/colors';
import { Send, Filter } from 'lucide-react';
import NotificationSendModal from './NotificationSendModal';
import NotificationDetailModal from './NotificationDetailModal';
import LoadingSpinner from '../ui/LoadingSpinner';
import EmptyState from '../ui/EmptyState';
import Pagination from '../ui/Pagination';

const API_BASE = 'http://103.200.20.253:5000/api';

const DEFAULT_LIMIT = 50;
const DEBOUNCE_DELAY = 500; // 500ms debounce cho filter changes

// Mapping cho loại thông báo
const notificationTypeMap = {
  'warranty_reminder': 'Nhắc nhở bảo hành',
  'service_reminder': 'Nhắc nhở dịch vụ',
  'transaction': 'Giao dịch',
  'care_content': 'Nội dung chăm sóc',
  'winback': 'Winback',
  'system': 'Hệ thống',
};

// Mapping cho trạng thái
const notificationStatusMap = {
  'sent': 'Đã gửi',
  'failed': 'Thất bại',
  'scheduled': 'Đã lên lịch',
  'sending': 'Đang gửi',
  'canceled': 'Đã hủy',
};

/**
 * Notification Management Component
 * Gộp cả quản lý thông báo và nhật ký thông báo
 */
export default function NotificationManagement() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [recipientNameByKey, setRecipientNameByKey] = useState({});
  const [showSendModal, setShowSendModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [offset, setOffset] = useState(0);
  
  // Filter state - gộp từ cả 2 trang
  const [filters, setFilters] = useState({
    date_from: '',
    date_to: '',
    type: '',
    status: '',
    recipient_type: '',
    recipient_id: '',
    ref_type: '',
    ref_id: '',
    is_read: '',
  });

  // Lists for dropdowns
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);

  // Refs để tránh infinite loops
  const recipientNameCacheRef = useRef(new Map());
  const fetchingRecipientsRef = useRef(false);
  const debounceTimerRef = useRef(null);
  const isInitialMountRef = useRef(true);

  const currentPage = useMemo(() => Math.floor(offset / limit) + 1, [offset, limit]);
  const totalPages = useMemo(() => {
    if (!total) return 1;
    return Math.max(1, Math.ceil(total / limit));
  }, [total, limit]);

  // Columns definition với access đến recipientNameByKey
  const columns = useMemo(() => [
    { key: 'id', label: 'ID' },
    { 
      key: 'title', 
      label: 'Tiêu đề', 
      render: (val) => truncateText(val || '—', 40) 
    },
    { 
      key: 'body', 
      label: 'Nội dung', 
      render: (val, row) => truncateText(val || row.message || '—', 50) 
    },
    { 
      key: 'recipient_type', 
      label: 'Người nhận',
      render: (val, row) => {
        const key = `${val}:${row.recipient_id}`;
        const name = recipientNameByKey[key];
        const typeLabel = val === 'customer' ? 'KH' : 'NV';
        
        if (name && name !== '...') {
          return (
            <span className="text-sm">
              {typeLabel} #{row.recipient_id} - {name}
            </span>
          );
        }
        
        return (
          <span className="text-sm">
            {typeLabel} #{row.recipient_id}
          </span>
        );
      }
    },
    { 
      key: 'type', 
      label: 'Loại', 
      render: (val) => notificationTypeMap[val] || val || '—' 
    },
    { 
      key: 'status', 
      label: 'Trạng thái', 
      render: (val) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
          val === 'sent' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
          val === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
          val === 'scheduled' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
          val === 'sending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
          'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
        }`}>
          {notificationStatusMap[val] || val || '—'}
        </span>
      )
    },
    { key: 'created_at', label: 'Thời gian', render: (val) => formatDate(val || '—') },
  ], [recipientNameByKey]);

  const loadCustomersAndEmployees = async () => {
    try {
      const customersRes = await notificationsAPI.getCustomers();
      setCustomers(customersRes.data.data || customersRes.data || []);

      const employeesRes = await notificationsAPI.getEmployees();
      setEmployees(employeesRes.data.data || employeesRes.data || []);
    } catch (err) {
      console.error('Error loading customers/employees:', err);
    }
  };

  const extractDisplayName = (obj) => {
    if (!obj) return '';
    return (
      obj.name ||
      obj.full_name ||
      obj.fullName ||
      obj.username ||
      obj.display_name ||
      obj.displayName ||
      obj.customer_name ||
      obj.employee_name ||
      ''
    );
  };

  // Tối ưu: chỉ fetch recipient names khi cần, với cache và batch
  // Dùng ref để tránh dependency loop
  const recipientNameByKeyRef = useRef(recipientNameByKey);
  useEffect(() => {
    recipientNameByKeyRef.current = recipientNameByKey;
  }, [recipientNameByKey]);

  const fetchRecipientNamesIfNeeded = useCallback(async (notifications) => {
    if (!notifications || notifications.length === 0) return;
    if (fetchingRecipientsRef.current) return; // Đang fetch thì skip

    const missing = [];
    const cache = recipientNameCacheRef.current;
    const currentNames = recipientNameByKeyRef.current;

    for (const n of notifications || []) {
      const type = n?.recipient_type;
      const id = n?.recipient_id;
      if (!type || id == null) continue;

      const key = `${type}:${id}`;
      // Kiểm tra cache trước
      if (cache.has(key)) {
        const cachedName = cache.get(key);
        if (currentNames[key] !== cachedName) {
          setRecipientNameByKey((prev) => ({ ...prev, [key]: cachedName }));
        }
        continue;
      }
      // Kiểm tra state
      if (currentNames[key] != null && currentNames[key] !== '...') continue;
      
      missing.push({ type, id, key });
    }

    if (!missing.length) return;

    // Giới hạn số lượng requests cùng lúc (batch 10 requests mỗi lần)
    const batchSize = 10;
    const batches = [];
    for (let i = 0; i < missing.length; i += batchSize) {
      batches.push(missing.slice(i, i + batchSize));
    }

    fetchingRecipientsRef.current = true;

    // Mark as loading
    setRecipientNameByKey((prev) => {
      const next = { ...prev };
      missing.forEach(({ key }) => {
        if (next[key] == null) next[key] = '...';
      });
      return next;
    });

    // Process từng batch với delay để tránh quá tải
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      
      // Delay giữa các batch
      if (batchIndex > 0) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      await Promise.all(
        batch.map(async ({ type, id, key }) => {
          try {
            // Sử dụng fetch API cơ bản nhất để tránh vấn đề với cache và interceptors
            const endpoint = type === 'customer' ? `${API_BASE}/customers/${id}` : `${API_BASE}/employees/${id}`;
            
            // Gọi API với fetch, thêm timestamp để bypass cache
            const response = await fetch(`${endpoint}?_t=${Date.now()}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
            });
            
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            // Xử lý response data
            const data = result?.data || result;
            const displayName = extractDisplayName(data) || `#${id}`;
            
            // Cache kết quả
            cache.set(key, displayName);
            
            // Update state
            setRecipientNameByKey((prev) => {
              if (prev[key] === displayName) return prev;
              return { ...prev, [key]: displayName };
            });
          } catch (err) {
            console.error('Fetch recipient name error:', type, id, err);
            const fallback = `#${id}`;
            cache.set(key, fallback);
            setRecipientNameByKey((prev) => {
              if (prev[key] === fallback) return prev;
              return { ...prev, [key]: fallback };
            });
          }
        })
      );
    }

    fetchingRecipientsRef.current = false;
  }, []); // Không có dependencies để tránh re-create

  useEffect(() => {
    loadCustomersAndEmployees();
    // Chỉ fetch data lần đầu, không phụ thuộc vào fetchData
    const initialFetch = async () => {
      setLoading(true);
      try {
        const params = { limit, offset: 0 };
        const res = await adminNotificationsAPI.getAll(params);
        const data = res.data?.data || [];
        const normalized = Array.isArray(data) ? data : [];
        const pagination = res.data?.pagination;
        const backendTotal = pagination?.total ?? res.data?.count ?? res.data?.total ?? normalized.length;
        setItems(normalized);
        setTotal(Number(backendTotal) || 0);
        // Fetch recipient names sau, không block UI
        setTimeout(() => fetchRecipientNamesIfNeeded(normalized), 100);
      } catch (err) {
        console.error('Fetch notifications error:', err);
        setItems([]);
        setTotal(0);
      } finally {
        setLoading(false);
        isInitialMountRef.current = false;
      }
    };
    initialFetch();
  }, [fetchRecipientNamesIfNeeded]);

  // Tách fetchData ra khỏi dependency của fetchRecipientNamesIfNeeded
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        limit,
        offset,
      };

      Object.entries(filters).forEach(([k, v]) => {
        if (v === '' || v == null) return;
        params[k] = v;
      });

      const res = await adminNotificationsAPI.getAll(params);
      const data = res.data?.data || [];
      const normalized = Array.isArray(data) ? data : [];
      const pagination = res.data?.pagination;
      const backendTotal = pagination?.total ?? res.data?.count ?? res.data?.total ?? normalized.length;

      setItems(normalized);
      setTotal(Number(backendTotal) || 0);
      
      // Fetch recipient names sau, không block và không trigger re-fetch
      setTimeout(() => {
        fetchRecipientNamesIfNeeded(normalized);
      }, 100);
    } catch (err) {
      console.error('Fetch notifications error:', err);
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [filters, limit, offset]); // Bỏ fetchRecipientNamesIfNeeded khỏi dependencies

  // Debounce filter changes để tránh quá nhiều API calls
  useEffect(() => {
    // Skip lần đầu mount
    if (isInitialMountRef.current) return;

    // Clear timer cũ
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set timer mới
    debounceTimerRef.current = setTimeout(() => {
      fetchData();
    }, DEBOUNCE_DELAY);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [filters, limit, offset, fetchData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleViewDetail = (item) => {
    setSelectedNotification(item);
    setShowDetailModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xác nhận xóa thông báo này?')) return;
    
    try {
      await notificationsAPI.delete(id);
      fetchData();
    } catch (err) {
      console.error('Delete error:', err);
      alert('Lỗi: ' + (err.response?.data?.message || err.message));
    }
  };

  const handlePageChange = (page) => {
    const nextOffset = (page - 1) * limit;
    setOffset(nextOffset);
  };

  const handleApplyFilters = () => {
    setOffset(0);
    // Clear debounce và fetch ngay
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    fetchData();
  };

  const handleClearFilters = () => {
    setFilters({
      date_from: '',
      date_to: '',
      type: '',
      status: '',
      recipient_type: '',
      recipient_id: '',
      ref_type: '',
      ref_id: '',
      is_read: '',
    });
    setOffset(0);
  };

  if (loading) {
    return (
      <div className="p-4">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 bg-transparent">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Thông báo</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSendModal(true)}
            className={buttonStyles.primary}
          >
            <Send size={18} />
            Gửi thông báo
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={buttonStyles.secondary}
          >
            <Filter size={18} />
            {showFilters ? 'Ẩn bộ lọc' : 'Hiện bộ lọc'}
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <div className="text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">Từ ngày</div>
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) => setFilters((f) => ({ ...f, date_from: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
            <div>
              <div className="text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">Đến ngày</div>
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => setFilters((f) => ({ ...f, date_to: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
            <div>
              <div className="text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">Loại thông báo</div>
              <select
                value={filters.type}
                onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              >
                <option value="">Tất cả</option>
                <option value="warranty_reminder">Nhắc nhở bảo hành</option>
                <option value="service_reminder">Nhắc nhở dịch vụ</option>
                <option value="transaction">Giao dịch</option>
                <option value="care_content">Nội dung chăm sóc</option>
                <option value="winback">Winback</option>
                <option value="system">Hệ thống</option>
              </select>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">Trạng thái</div>
              <select
                value={filters.status}
                onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              >
                <option value="">Tất cả</option>
                <option value="scheduled">Đã lên lịch</option>
                <option value="sending">Đang gửi</option>
                <option value="sent">Đã gửi</option>
                <option value="canceled">Đã hủy</option>
                <option value="failed">Thất bại</option>
              </select>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">Loại người nhận</div>
              <select
                value={filters.recipient_type}
                onChange={(e) => setFilters((f) => ({ ...f, recipient_type: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              >
                <option value="">All</option>
                <option value="customer">customer</option>
                <option value="employee">employee</option>
              </select>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">Mã người nhận</div>
              <input
                value={filters.recipient_id}
                onChange={(e) => setFilters((f) => ({ ...f, recipient_id: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                placeholder="123"
              />
            </div>
            <div>
              <div className="text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">Loại tham chiếu</div>
              <input
                value={filters.ref_type}
                onChange={(e) => setFilters((f) => ({ ...f, ref_type: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                placeholder="service | warranty | order"
              />
            </div>
            <div>
              <div className="text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">Mã tham chiếu</div>
              <input
                value={filters.ref_id}
                onChange={(e) => setFilters((f) => ({ ...f, ref_id: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                placeholder="1"
              />
            </div>
          </div>

          <div className="mt-3 flex items-center gap-3 flex-wrap">
            <div>
              <div className="text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">Số dòng</div>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setOffset(0);
                }}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300 mt-5">
              Total: {total}
            </div>
            <div className="flex-1" />
            <button className={buttonStyles.secondary} onClick={handleClearFilters}>
              Xóa lọc
            </button>
            <button className={buttonStyles.primary} onClick={handleApplyFilters}>
              Áp dụng
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {!items.length ? (
        <EmptyState title="Không có dữ liệu" description="Không tìm thấy notifications theo bộ lọc" />
      ) : (
        <GenericTable
          data={items}
          columns={columns}
          onEdit={null}
          onView={handleViewDetail}
          onDelete={handleDelete}
          title="Thông báo"
          api={notificationsAPI}
          showPagination={true}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={total}
          limit={limit}
          onPageChange={handlePageChange}
        />
      )}

      {/* Send Notification Modal */}
      {showSendModal && (
        <NotificationSendModal
          isOpen={showSendModal}
          customers={customers}
          employees={employees}
          onClose={() => setShowSendModal(false)}
          onSuccess={fetchData}
        />
      )}

      {/* Notification Detail Modal */}
      <NotificationDetailModal
        isOpen={showDetailModal}
        notification={selectedNotification}
        recipientNameByKey={recipientNameByKey}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedNotification(null);
        }}
      />
    </div>
  );
}

