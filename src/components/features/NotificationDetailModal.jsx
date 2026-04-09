import { formatDate } from '../../utils/format';
import Modal from '../ui/Modal';

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

export default function NotificationDetailModal({
  isOpen,
  notification,
  recipientNameByKey = {},
  onClose,
}) {
  if (!isOpen || !notification) {
    return null;
  }

  const recipientKey =
    notification.recipient_type && notification.recipient_id
      ? `${notification.recipient_type}:${notification.recipient_id}`
      : null;
  const recipientName = recipientKey ? recipientNameByKey[recipientKey] : null;
  const recipientTypeLabel = notification.recipient_type === 'customer' ? 'Khách hàng' : 'Nhân viên';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chi tiết thông báo" size="lg">
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-200">ID</label>
            <div className="rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-slate-100">
              {notification.id}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-200">Trạng thái</label>
            <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm">
              <span className="rounded-full bg-[#1e406b]/15 px-3 py-1 text-xs font-semibold text-[#eecd7e]">
                {notificationStatusMap[notification.status] || notification.status || '—'}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  notification.is_read
                    ? 'bg-[#8f5f23]/15 text-[#eecd7e]'
                    : 'bg-[#c37b1e]/15 text-[#eecd7e]'
                }`}
              >
                {notification.is_read ? 'Đã đọc' : 'Chưa đọc'}
              </span>
            </div>
          </div>
        </div>

        {notification.title ? (
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-200">Tiêu đề</label>
            <div className="rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-slate-100">
              {notification.title}
            </div>
          </div>
        ) : null}

        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-200">Nội dung</label>
          <div className="rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-slate-100">
            {notification.body || notification.message || '—'}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-200">Người nhận</label>
            <div className="rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-slate-100">
              {recipientTypeLabel} #{notification.recipient_id}
              {recipientName ? ` - ${recipientName}` : ''}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-200">Loại thông báo</label>
            <div className="rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-slate-100">
              {notificationTypeMap[notification.type] || notification.type || '—'}
            </div>
          </div>
        </div>

        {(notification.ref_type || notification.ref_id) ? (
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-200">Tham chiếu</label>
            <div className="rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-slate-100">
              {notification.ref_type && notification.ref_id
                ? `${notification.ref_type}: ${notification.ref_id}`
                : notification.ref_type || notification.ref_id || '—'}
            </div>
          </div>
        ) : null}

        {notification.image_url ? (
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-200">Hình ảnh</label>
            <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-3">
              <img
                src={notification.image_url}
                alt="Ảnh thông báo"
                className="max-h-[320px] rounded-2xl object-contain"
              />
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {notification.created_at ? (
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-200">Ngày tạo</label>
              <div className="rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-slate-100">
                {formatDate(notification.created_at)}
              </div>
            </div>
          ) : null}

          {notification.sent_at ? (
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-200">Ngày gửi</label>
              <div className="rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-slate-100">
                {formatDate(notification.sent_at)}
              </div>
            </div>
          ) : null}

          {notification.scheduled_at ? (
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-200">Lịch gửi</label>
              <div className="rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-slate-100">
                {formatDate(notification.scheduled_at)}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
