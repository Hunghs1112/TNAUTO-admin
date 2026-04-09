import { useMemo, useState } from 'react';
import { Send } from 'lucide-react';
import { notificationsAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { buttonStyles } from '../../styles/colors';
import ImageUploader from '../image/ImageUploader';
import Modal from '../ui/Modal';

export default function NotificationSendModal({
  isOpen,
  customers = [],
  employees = [],
  onClose,
  onSuccess,
}) {
  const [sendForm, setSendForm] = useState({
    recipient_id: '',
    recipient_type: 'customer',
    message: '',
    image_url: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const { success, error } = useToast();

  const recipients = useMemo(
    () => (sendForm.recipient_type === 'customer' ? customers : employees),
    [customers, employees, sendForm.recipient_type]
  );

  const resetForm = () => {
    setSendForm({
      recipient_id: '',
      recipient_type: 'customer',
      message: '',
      image_url: '',
    });
  };

  const handleClose = () => {
    resetForm();
    onClose?.();
  };

  const handleSendNotification = async () => {
    if (!sendForm.recipient_id || !sendForm.message.trim()) {
      error('Vui lòng chọn người nhận và nhập nội dung thông báo.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await notificationsAPI.send({
        recipient_id: Number(sendForm.recipient_id),
        recipient_type: sendForm.recipient_type,
        title: 'Thông báo mới',
        message: sendForm.message.trim(),
        data: {
          type: 'custom_notification',
          image_url: sendForm.image_url || undefined,
        },
      });

      const notificationId = response.data?.notification_id || response.data?.id;
      success(notificationId ? `Đã gửi thông báo #${notificationId}.` : 'Đã gửi thông báo thành công.');
      resetForm();
      onSuccess?.();
    } catch (sendError) {
      error(sendError?.message || 'Không thể gửi thông báo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Gửi thông báo" size="lg">
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-200">
            Loại người nhận <span className="text-[#e0a02e]">*</span>
          </label>
          <select
            value={sendForm.recipient_type}
            onChange={(event) =>
              setSendForm((prev) => ({ ...prev, recipient_type: event.target.value, recipient_id: '' }))
            }
            className="app-input"
          >
            <option value="customer">Khách hàng</option>
            <option value="employee">Nhân viên</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-200">
            Người nhận <span className="text-[#e0a02e]">*</span>
          </label>
          <select
            value={sendForm.recipient_id}
            onChange={(event) => setSendForm((prev) => ({ ...prev, recipient_id: event.target.value }))}
            className="app-input"
          >
            <option value="">
              {sendForm.recipient_type === 'customer' ? 'Chọn khách hàng' : 'Chọn nhân viên'}
            </option>
            {recipients.map((recipient) => (
              <option key={recipient.id} value={recipient.id}>
                #{recipient.id} - {recipient.name} {recipient.phone ? `- ${recipient.phone}` : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-200">
            Nội dung <span className="text-[#e0a02e]">*</span>
          </label>
          <textarea
            value={sendForm.message}
            onChange={(event) => setSendForm((prev) => ({ ...prev, message: event.target.value }))}
            rows={4}
            placeholder="Nhập nội dung thông báo..."
            className="app-textarea"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-200">Hình ảnh</label>
          <ImageUploader
            onUploadSuccess={(value) =>
              setSendForm((prev) => ({ ...prev, image_url: Array.isArray(value) ? value[0] || '' : value || '' }))
            }
            multiple={false}
            maxFiles={1}
            uploadMode="both"
            allowFileUpload={true}
            allowLinkUpload={true}
          />

          {sendForm.image_url ? (
            <div className="mt-3 rounded-2xl border border-slate-700 bg-slate-900/60 p-3">
              <p className="text-xs font-medium text-slate-400">Ảnh đang chọn</p>
              <p className="mt-1 break-all text-sm text-slate-200">{sendForm.image_url}</p>
              <button
                type="button"
                onClick={() => setSendForm((prev) => ({ ...prev, image_url: '' }))}
                className="mt-2 text-sm font-medium text-[#b48242] hover:text-[#eecd7e]"
              >
                Xóa ảnh
              </button>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col justify-end gap-3 border-t border-slate-700 pt-4 sm:flex-row">
          <button type="button" onClick={handleClose} className={buttonStyles.secondary} disabled={submitting}>
            Hủy
          </button>
          <button type="button" onClick={handleSendNotification} className={buttonStyles.primary} disabled={submitting}>
            <Send size={18} />
            <span>{submitting ? 'Đang gửi...' : 'Gửi thông báo'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
