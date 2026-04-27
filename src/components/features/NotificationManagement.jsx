import { useMemo } from 'react';
import { Filter, Send } from 'lucide-react';
import { notificationsAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { buttonStyles } from '../../styles/colors';
import { formatDate, truncateText } from '../../utils/format';
import useNotificationManagement from '../../hooks/useNotificationManagement';
import PageHeader from '../layout/PageHeader';
import GenericTable from '../table/Table';
import EmptyState from '../ui/EmptyState';
import LoadingSpinner from '../ui/LoadingSpinner';
import NotificationDetailModal from './NotificationDetailModal';
import NotificationSendModal from './NotificationSendModal';

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

export default function NotificationManagement() {
  const { success, error } = useToast();

  const {
    loading,
    items,
    total,
    customers,
    employees,
    showSendModal,
    setShowSendModal,
    showFilters,
    setShowFilters,
    selectedNotification,
    setSelectedNotification,
    currentPage,
    setCurrentPage,
    totalPages,
    limit,
    changeLimit,
    filters,
    setFilters,
    recipientNameByKey,
    fetchNotifications,
    handleDelete,
    handleApplyFilters,
    handleClearFilters,
  } = useNotificationManagement({
    showSuccess: success,
    showError: error,
    initialLimit: 50,
  });

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
                ? 'bg-[#8f5f23]/15 text-[#eecd7e]'
                : value === 'failed'
                  ? 'bg-[#b48242]/15 text-[#b48242]'
                  : value === 'scheduled'
                    ? 'bg-[#1e406b]/15 text-[#eecd7e]'
                    : value === 'sending'
                      ? 'bg-[#c37b1e]/15 text-[#eecd7e]'
                      : 'bg-slate-700/60 text-slate-300'
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
                <label className="mb-1 block text-xs font-semibold text-slate-300">Từ ngày</label>
                <input
                  type="date"
                  value={filters.date_from}
                  onChange={(event) => setFilters((prev) => ({ ...prev, date_from: event.target.value }))}
                  className="app-input"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-300">Đến ngày</label>
                <input
                  type="date"
                  value={filters.date_to}
                  onChange={(event) => setFilters((prev) => ({ ...prev, date_to: event.target.value }))}
                  className="app-input"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-300">Loại thông báo</label>
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
                <label className="mb-1 block text-xs font-semibold text-slate-300">Trạng thái</label>
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
                <label className="mb-1 block text-xs font-semibold text-slate-300">Loại người nhận</label>
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
                <label className="mb-1 block text-xs font-semibold text-slate-300">Mã người nhận</label>
                <input
                  value={filters.recipient_id}
                  onChange={(event) => setFilters((prev) => ({ ...prev, recipient_id: event.target.value }))}
                  className="app-input"
                  placeholder="123"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-300">Loại tham chiếu</label>
                <input
                  value={filters.ref_type}
                  onChange={(event) => setFilters((prev) => ({ ...prev, ref_type: event.target.value }))}
                  className="app-input"
                  placeholder="service | warranty | order"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-300">Mã tham chiếu</label>
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
                <label className="mb-1 block text-xs font-semibold text-slate-300">Số dòng</label>
                <select
                  value={limit}
                  onChange={(event) => changeLimit(event.target.value)}
                  className="app-input"
                >
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              <div className="text-sm text-slate-300">Tổng: {total}</div>
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
          onPageChange={setCurrentPage}
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
