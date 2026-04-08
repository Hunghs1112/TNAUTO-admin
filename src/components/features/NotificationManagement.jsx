import { useCallback, useEffect, useMemo, useState } from 'react';
import { Filter, Send } from 'lucide-react';
import { notificationsAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { buttonStyles } from '../../styles/colors';
import { formatDate, truncateText } from '../../utils/format';
import PageHeader from '../layout/PageHeader';
import GenericTable from '../table/Table';
import EmptyState from '../ui/EmptyState';
import LoadingSpinner from '../ui/LoadingSpinner';
import NotificationDetailModal from './NotificationDetailModal';
import NotificationSendModal from './NotificationSendModal';

const DEFAULT_LIMIT = 50;

const notificationTypeMap = {
  warranty_reminder: 'Nhắc bảo hành',
  service_reminder: 'Nhắc dịch vụ',
  transaction: 'Giao dịch',
  care_content: 'Chăm sóc',
  winback: 'Tái kích hoạt',
  system: 'Hệ thống',
};

const notificationStatusMap = {
  sent: 'Đã gửi',
  failed: 'Thất bại',
  scheduled: 'Đã lên lịch',
  sending: 'Đang gửi',
  canceled: 'Đã hủy',
};


function normalizeDateFilterBoundary(value, boundary) {
  const input = String(value || '').trim();
  if (!input) return '';

  const matchedIso = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (matchedIso) {
    return boundary === 'start' ? `${input}T00:00:00` : `${input}T23:59:59.999`;
  }

  const matchedVn = input.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (matchedVn) {
    const [, day, month, year] = matchedVn;
    const isoDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return boundary === 'start' ? `${isoDate}T00:00:00` : `${isoDate}T23:59:59.999`;
  }

  return input;
}

function buildNotificationParams(limit, offset, filters) {
  const params = { limit, offset };

  Object.entries(filters).forEach(([key, value]) => {
    if (value === '' || value === null || value === undefined) {
      return;
    }

    if (key === 'date_from') {
      params[key] = normalizeDateFilterBoundary(value, 'start');
      return;
    }

    if (key === 'date_to') {
      params[key] = normalizeDateFilterBoundary(value, 'end');
      return;
    }

    params[key] = value;
  });

  return params;
}

function normalizeListResponse(response) {
  const raw = response?.data;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data?.data)) return raw.data.data;
  return [];
}

export default function NotificationManagement() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [offset, setOffset] = useState(0);
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
  const [appliedFilters, setAppliedFilters] = useState({
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

  const { success, error } = useToast();

  const currentPage = useMemo(() => Math.floor(offset / limit) + 1, [limit, offset]);
  const totalPages = useMemo(() => Math.max(1, Math.ceil((total || 0) / limit)), [limit, total]);

  const recipientNameByKey = useMemo(() => {
    const nextMap = {};

    customers.forEach((customer) => {
      nextMap[`customer:${customer.id}`] = customer.name || `#${customer.id}`;
    });

    employees.forEach((employee) => {
      nextMap[`employee:${employee.id}`] = employee.name || `#${employee.id}`;
    });

    return nextMap;
  }, [customers, employees]);

  const columns = useMemo(
    () => [
      { key: 'id', label: 'ID' },
      {
        key: 'title',
        label: 'Tiêu đề',
        render: (value) => truncateText(value || '—', 40),
      },
      {
        key: 'body',
        label: 'Nội dung',
        render: (value, row) => truncateText(value || row.message || '—', 55),
      },
      {
        key: 'recipient_type',
        label: 'Người nhận',
        render: (value, row) => {
          const key = `${value}:${row.recipient_id}`;
          const recipientLabel = value === 'customer' ? 'Khách hàng' : 'Nhân viên';
          const recipientName = recipientNameByKey[key];
          return (
            <span className="text-sm">
              {recipientLabel} #{row.recipient_id}
              {recipientName ? ` - ${recipientName}` : ''}
            </span>
          );
        },
      },
      {
        key: 'type',
        label: 'Loại',
        render: (value) => notificationTypeMap[value] || value || '—',
      },
      {
        key: 'status',
        label: 'Trạng thái',
        render: (value) => (
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              value === 'sent'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                : value === 'failed'
                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                : value === 'scheduled'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                : value === 'sending'
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {notificationStatusMap[value] || value || '—'}
          </span>
        ),
      },
      {
        key: 'created_at',
        label: 'Thời gian',
        render: (value) => formatDate(value || '—'),
      },
    ],
    [recipientNameByKey]
  );

  const loadLookupData = useCallback(async () => {
    try {
      const [customersResponse, employeesResponse] = await Promise.all([
        notificationsAPI.getCustomers(),
        notificationsAPI.getEmployees(),
      ]);

      setCustomers(normalizeListResponse(customersResponse));
      setEmployees(normalizeListResponse(employeesResponse));
    } catch {
      setCustomers([]);
      setEmployees([]);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);

    try {
      const params = buildNotificationParams(limit, offset, appliedFilters);

      const response = await notificationsAPI.getAll(params);
      const nextItems = normalizeListResponse(response);
      const pagination = response.data?.pagination;
      const nextTotal = pagination?.total ?? response.data?.count ?? response.data?.total ?? nextItems.length;

      setItems(nextItems);
      setTotal(Number(nextTotal) || 0);
    } catch (fetchError) {
      setItems([]);
      setTotal(0);
      error(fetchError?.message || 'Không thể tải danh sách thông báo.');
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, error, limit, offset]);

  useEffect(() => {
    loadLookupData();
  }, [loadLookupData]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleDelete = useCallback(
    async (id) => {
      if (!window.confirm('Bạn có chắc chắn muốn xóa thông báo này không?')) {
        return;
      }

      try {
        await notificationsAPI.delete(id);
        success('Đã xóa thông báo.');
        fetchNotifications();
      } catch (deleteError) {
        error(deleteError?.message || 'Không thể xóa thông báo.');
      }
    },
    [error, fetchNotifications, success]
  );

  const handleApplyFilters = () => {
    setOffset(0);
    setAppliedFilters(filters);
  };

  const handleClearFilters = () => {
    const emptyFilters = {
      date_from: '',
      date_to: '',
      type: '',
      status: '',
      recipient_type: '',
      recipient_id: '',
      ref_type: '',
      ref_id: '',
      is_read: '',
    };

    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setOffset(0);
  };

  if (loading && !items.length) {
    return (
      <div className="app-panel">
        <div className="app-panel-body">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="app-page">
      <PageHeader
        title="Quản lý thông báo"
        description="Theo dõi lịch sử gửi, lọc theo đối tượng nhận và gửi thông báo thủ công trong cùng một giao diện thống nhất."
        badge={`${total} thông báo`}
      >
        <button type="button" onClick={() => setShowSendModal(true)} className={buttonStyles.primary}>
          <Send size={18} />
          <span>Gửi thông báo</span>
        </button>
        <button type="button" onClick={() => setShowFilters((prev) => !prev)} className={buttonStyles.secondary}>
          <Filter size={18} />
          <span>{showFilters ? 'Ẩn bộ lọc' : 'Hiện bộ lọc'}</span>
        </button>
      </PageHeader>

      {showFilters ? (
        <section className="app-panel">
          <div className="app-panel-body">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Từ ngày</label>
                <input
                  type="date"
                  value={filters.date_from}
                  onChange={(event) => setFilters((prev) => ({ ...prev, date_from: event.target.value }))}
                  className="app-input"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Đến ngày</label>
                <input
                  type="date"
                  value={filters.date_to}
                  onChange={(event) => setFilters((prev) => ({ ...prev, date_to: event.target.value }))}
                  className="app-input"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Loại thông báo</label>
                <select
                  value={filters.type}
                  onChange={(event) => setFilters((prev) => ({ ...prev, type: event.target.value }))}
                  className="app-input"
                >
                  <option value="">Tất cả</option>
                  <option value="warranty_reminder">Nhắc bảo hành</option>
                  <option value="service_reminder">Nhắc dịch vụ</option>
                  <option value="transaction">Giao dịch</option>
                  <option value="care_content">Chăm sóc</option>
                  <option value="winback">Tái kích hoạt</option>
                  <option value="system">Hệ thống</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Trạng thái</label>
                <select
                  value={filters.status}
                  onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
                  className="app-input"
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
                <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Loại người nhận</label>
                <select
                  value={filters.recipient_type}
                  onChange={(event) => setFilters((prev) => ({ ...prev, recipient_type: event.target.value }))}
                  className="app-input"
                >
                  <option value="">Tất cả</option>
                  <option value="customer">Khách hàng</option>
                  <option value="employee">Nhân viên</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Mã người nhận</label>
                <input
                  value={filters.recipient_id}
                  onChange={(event) => setFilters((prev) => ({ ...prev, recipient_id: event.target.value }))}
                  className="app-input"
                  placeholder="123"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Loại tham chiếu</label>
                <input
                  value={filters.ref_type}
                  onChange={(event) => setFilters((prev) => ({ ...prev, ref_type: event.target.value }))}
                  className="app-input"
                  placeholder="service | warranty | order"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Mã tham chiếu</label>
                <input
                  value={filters.ref_id}
                  onChange={(event) => setFilters((prev) => ({ ...prev, ref_id: event.target.value }))}
                  className="app-input"
                  placeholder="1"
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-end gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Số dòng</label>
                <select
                  value={limit}
                  onChange={(event) => {
                    setLimit(Number(event.target.value));
                    setOffset(0);
                  }}
                  className="app-input"
                >
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-300">Tổng: {total}</div>
              <div className="flex-1" />
              <button type="button" className={buttonStyles.secondary} onClick={handleClearFilters}>
                Xóa lọc
              </button>
              <button type="button" className={buttonStyles.primary} onClick={handleApplyFilters}>
                Áp dụng
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {!items.length ? (
        <div className="app-panel">
          <EmptyState title="Không có dữ liệu" description="Không tìm thấy thông báo phù hợp với bộ lọc hiện tại." />
        </div>
      ) : (
        <GenericTable
          data={items}
          columns={columns}
          onEdit={null}
          onView={(item) => setSelectedNotification(item)}
          onDelete={handleDelete}
          title="Thông báo"
          api={notificationsAPI}
          showPagination={true}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={total}
          limit={limit}
          onPageChange={(page) => setOffset((page - 1) * limit)}
          hideTitle={true}
          showTableHeaderActions={false}
        />
      )}

      <NotificationSendModal
        isOpen={showSendModal}
        customers={customers}
        employees={employees}
        onClose={() => setShowSendModal(false)}
        onSuccess={() => {
          setShowSendModal(false);
          fetchNotifications();
        }}
      />

      <NotificationDetailModal
        isOpen={Boolean(selectedNotification)}
        notification={selectedNotification}
        recipientNameByKey={recipientNameByKey}
        onClose={() => setSelectedNotification(null)}
      />
    </div>
  );
}
