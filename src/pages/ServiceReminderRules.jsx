import { memo } from 'react';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import PageHeader from '../components/layout/PageHeader';
import { useToast } from '../contexts/ToastContext';
import { buttonStyles } from '../styles/colors';
import useServiceReminderRulesPage, { renderTemplate } from '../hooks/useServiceReminderRulesPage';

function ServiceReminderRules() {
  const { success, error } = useToast();

  const {
    services,
    configsByServiceId,
    loading,
    savingServiceId,
    searchText,
    setSearchText,
    isEditOpen,
    editService,
    form,
    setForm,
    mockPreviewData,
    filteredServices,
    openEdit,
    closeEdit,
    handleToggle,
    handleSave,
  } = useServiceReminderRulesPage({
    showSuccess: success,
    showError: error,
  });

  if (loading) {
    return (
      <div className="app-panel">
        <div className="app-panel-body">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!services.length) {
    return (
      <div className="app-panel">
        <EmptyState title="Không có dịch vụ" description="Chưa có dữ liệu dịch vụ để hiển thị." />
      </div>
    );
  }

  return (
    <div className="app-page">
      <PageHeader
        title="Quy tắc nhắc dịch vụ"
        badge={`${filteredServices.length} dịch vụ`}
      />

      <div className="app-panel">
        <div className="app-panel-header">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="text-lg font-semibold text-slate-100">Danh sách cấu hình</h2>
            <div className="w-full lg:w-80">
              <input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="app-input"
                placeholder="Tìm theo tên hoặc mã dịch vụ..."
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table min-w-full text-sm">
            <thead>
              <tr>
                <th>Dịch vụ</th>
                <th>Trạng thái</th>
                <th>Mốc nhắc</th>
                <th>Giãn cách</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredServices.map((svc) => {
                const cfg = configsByServiceId[String(svc.id)];
                const enabled = !!cfg?.enabled;
                const days = cfg?.reminder_days || cfg?.reminder_days_json;
                const daysText = Array.isArray(days) ? days.join(', ') : typeof days === 'string' ? days : '—';
                const cooldown = cfg?.cooldown_days ?? '—';

                return (
                  <tr key={svc.id} className="text-slate-100">
                    <td className="px-4 py-3 font-medium">{svc.name || svc.service_name || `#${svc.id}`}</td>
                    <td className="px-4 py-3">
                      <button
                        className={enabled ? buttonStyles.success : buttonStyles.secondary}
                        onClick={() => handleToggle(svc.id, !enabled)}
                        disabled={savingServiceId === svc.id}
                      >
                        {savingServiceId === svc.id ? 'Đang cập nhật...' : enabled ? 'Đang bật' : 'Đang tắt'}
                      </button>
                    </td>
                    <td className="px-4 py-3">{daysText}</td>
                    <td className="px-4 py-3">{cooldown} ngày</td>
                    <td className="px-4 py-3">
                      <button className={buttonStyles.primary} onClick={() => openEdit(svc)} disabled={savingServiceId === svc.id}>
                        Chỉnh sửa
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!filteredServices.length ? (
          <div className="app-panel-body">
            <EmptyState title="Không có kết quả" description="Không tìm thấy dữ liệu phù hợp." />
          </div>
        ) : null}
      </div>

      {isEditOpen && (
        <Modal isOpen={isEditOpen} onClose={closeEdit} title="Cấu hình nhắc dịch vụ">
          <div className="space-y-4">
            <div className="text-sm text-slate-300">
              <div className="font-semibold">Dịch vụ:</div>
              <div>{editService?.name || editService?.service_name || ''}</div>
            </div>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={!!form.enabled}
                onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
              />
              <span className="text-sm text-slate-200">Bật nhắc</span>
            </label>

            <div>
              <div className="mb-1 text-sm font-medium text-slate-200">Mốc nhắc (ngày sau)</div>
              <input
                value={form.reminder_days_input}
                onChange={(e) => setForm((f) => ({ ...f, reminder_days_input: e.target.value }))}
                className="app-input"
                placeholder="30,60,90"
              />
              <div className="mt-1 text-xs text-slate-400">Nhập dạng: 30,60,90</div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <div className="mb-1 text-sm font-medium text-slate-200">Giờ gửi</div>
                <input
                  value={form.send_time}
                  onChange={(e) => setForm((f) => ({ ...f, send_time: e.target.value }))}
                  className="app-input"
                  placeholder="08:00"
                />
              </div>
              <div>
                <div className="mb-1 text-sm font-medium text-slate-200">Số ngày giãn cách</div>
                <input
                  type="number"
                  min={0}
                  value={form.cooldown_days}
                  onChange={(e) => setForm((f) => ({ ...f, cooldown_days: e.target.value }))}
                  className="app-input"
                />
              </div>
            </div>

            <div>
              <div className="mb-1 text-sm font-medium text-slate-200">Mẫu tiêu đề</div>
              <input
                value={form.title_template}
                onChange={(e) => setForm((f) => ({ ...f, title_template: e.target.value }))}
                className="app-input"
              />
            </div>

            <div>
              <div className="mb-1 text-sm font-medium text-slate-200">Mẫu nội dung</div>
              <textarea
                value={form.body_template}
                onChange={(e) => setForm((f) => ({ ...f, body_template: e.target.value }))}
                className="app-textarea"
                rows={4}
              />
            </div>

            <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-3">
              <div className="mb-1 text-sm font-semibold text-slate-200">Xem trước</div>
              <div className="text-sm text-slate-300">
                <div className="font-medium">{renderTemplate(form.title_template, mockPreviewData) || '—'}</div>
                <div>{renderTemplate(form.body_template, mockPreviewData) || '—'}</div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button className={buttonStyles.secondary} onClick={closeEdit}>
                Hủy
              </button>
              <button className={buttonStyles.primary} onClick={handleSave} disabled={savingServiceId === editService?.id}>
                {savingServiceId === editService?.id ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default memo(ServiceReminderRules);


