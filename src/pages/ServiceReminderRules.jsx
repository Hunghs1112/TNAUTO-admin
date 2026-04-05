// src/pages/ServiceReminderRules.jsx
import { useCallback, useEffect, useMemo, useState, memo } from 'react';
import { servicesAPI, serviceReminderConfigsAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { buttonStyles } from '../styles/colors';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import PageHeader from '../components/layout/PageHeader';

function parseDaysInput(value) {
  if (!value) return [];
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => Number(s))
    .filter((n) => Number.isFinite(n) && n > 0);
}

function uniqueSortedNumbers(nums) {
  return Array.from(new Set(nums)).sort((a, b) => a - b);
}

function renderTemplate(template, mock) {
  if (!template) return '';
  return template
    .replaceAll('{customer_name}', mock.customer_name)
    .replaceAll('{service_name}', mock.service_name)
    .replaceAll('{days_after}', String(mock.days_after))
    .replaceAll('{order_id}', String(mock.order_id));
}

function ServiceReminderRules() {
  const [services, setServices] = useState([]);
  const [configsByServiceId, setConfigsByServiceId] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingServiceId, setSavingServiceId] = useState(null);

  const [searchText, setSearchText] = useState('');

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editService, setEditService] = useState(null);

  const [form, setForm] = useState({
    enabled: true,
    reminder_days_input: '30,60,90',
    send_time: '08:00',
    title_template: 'Nhắc dịch vụ',
    body_template: 'Chào {customer_name} ạ, đã {days_after} ngày từ lần {service_name} gần nhất...',
    cooldown_days: 7,
  });
  const { success, error } = useToast();

  const mockPreviewData = useMemo(
    () => ({
      customer_name: 'Anh/Chị',
      service_name: editService?.name || editService?.service_name || 'Dịch vụ',
      days_after: 30,
      order_id: 1234,
    }),
    [editService]
  );

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [servicesRes, configsRes] = await Promise.all([
        servicesAPI.getAll(),
        serviceReminderConfigsAPI.getAll(),
      ]);

      const servicesList = servicesRes.data?.data || servicesRes.data || [];
      const configsList = configsRes.data?.data || configsRes.data || [];

      const map = {};
      for (const cfg of configsList) {
        if (cfg?.service_id != null) map[String(cfg.service_id)] = cfg;
      }

      setServices(servicesList);
      setConfigsByServiceId(map);
    } catch (err) {
      setServices([]);
      setConfigsByServiceId({});
      error(err?.message || 'Không thể tải cấu hình nhắc dịch vụ.');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const openEdit = (service) => {
    const cfg = configsByServiceId[String(service.id)];
    const reminderDays = cfg?.reminder_days || cfg?.reminder_days_json || cfg?.reminder_days_list || cfg?.reminderDays;

    const normalizedDays = Array.isArray(reminderDays)
      ? reminderDays
      : typeof reminderDays === 'string'
        ? (() => {
            try {
              const parsed = JSON.parse(reminderDays);
              return Array.isArray(parsed) ? parsed : [];
            } catch {
              return [];
            }
          })()
        : [];

    setEditService(service);
    setForm({
      enabled: cfg?.enabled ?? true,
      reminder_days_input: normalizedDays.length ? normalizedDays.join(',') : '30,60,90',
      send_time: cfg?.send_time || '08:00',
      title_template: cfg?.title_template || 'Nhắc dịch vụ',
      body_template:
        cfg?.body_template ||
        'Chào {customer_name} ạ, đã {days_after} ngày từ lần {service_name} gần nhất...',
      cooldown_days: cfg?.cooldown_days ?? 7,
    });
    setIsEditOpen(true);
  };

  const handleToggle = useCallback(
    async (serviceId, enabled) => {
      setSavingServiceId(serviceId);
      try {
        const res = await serviceReminderConfigsAPI.setEnabled(serviceId, enabled);
        const updated = res?.data?.data || res?.data;

        if (updated && (updated.service_id != null || updated.serviceId != null)) {
          const updatedServiceId = updated.service_id ?? updated.serviceId;
          setConfigsByServiceId((prev) => ({
            ...prev,
            [String(updatedServiceId)]: {
              ...(prev[String(updatedServiceId)] || {}),
              ...updated,
            },
          }));
        } else {
          await loadAll();
        }
      } catch (err) {
        error(err?.message || 'Không thể cập nhật trạng thái nhắc dịch vụ.');
      } finally {
        setSavingServiceId(null);
      }
    },
    [error, loadAll]
  );

  const handleSave = useCallback(async () => {
    if (!editService) return;

    const reminder_days = uniqueSortedNumbers(parseDaysInput(form.reminder_days_input));
    if (!reminder_days.length) {
      error('Vui lòng nhập mốc nhắc hợp lệ, ví dụ: 30,60,90.');
      return;
    }

    const payload = {
      enabled: !!form.enabled,
      reminder_days,
      send_time: form.send_time,
      title_template: form.title_template,
      body_template: form.body_template,
      cooldown_days: Number(form.cooldown_days) || 0,
    };

    setSavingServiceId(editService.id);
    try {
      await serviceReminderConfigsAPI.upsert(editService.id, payload);
      setIsEditOpen(false);
      setEditService(null);
      await loadAll();
      success('Đã lưu cấu hình nhắc dịch vụ.');
    } catch (err) {
      error(err?.message || 'Không thể lưu cấu hình nhắc dịch vụ.');
    } finally {
      setSavingServiceId(null);
    }
  }, [editService, error, form, loadAll, success]);

  const filteredServices = useMemo(() => {
    const q = (searchText || '').trim().toLowerCase();
    if (!q) return services;

    return services.filter((svc) => {
      const name = (svc?.name || svc?.service_name || '').toLowerCase();
      const idStr = String(svc?.id ?? '');
      return name.includes(q) || idStr.includes(q);
    });
  }, [services, searchText]);

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
        <EmptyState title="Không có dịch vụ" description="Chưa tải được danh sách dịch vụ để cấu hình nhắc dịch vụ." />
      </div>
    );
  }

  return (
    <div className="app-page">
      <PageHeader
        title="Quy tắc nhắc dịch vụ"
        description="Thiết lập mốc ngày nhắc, khung giờ gửi và nội dung mẫu cho từng dịch vụ trong cùng một cấu trúc giao diện với các màn quản trị khác."
        badge={`${filteredServices.length} dịch vụ`}
      />

      <div className="app-panel">
        <div className="app-panel-header">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Danh sách cấu hình</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Tìm nhanh dịch vụ rồi bật hoặc chỉnh sửa quy tắc nhắc tương ứng.</p>
            </div>
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
                  <tr key={svc.id} className="text-gray-900 dark:text-gray-100">
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
                      <button
                        className={buttonStyles.primary}
                        onClick={() => openEdit(svc)}
                        disabled={savingServiceId === svc.id}
                      >
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
            <EmptyState title="Không có kết quả" description="Không tìm thấy dịch vụ phù hợp với nội dung tìm kiếm." />
          </div>
        ) : null}
      </div>

      {isEditOpen && (
        <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Cấu hình nhắc dịch vụ">
          <div className="space-y-4">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              <div className="font-semibold">Dịch vụ:</div>
              <div>{editService?.name || editService?.service_name || ''}</div>
            </div>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={!!form.enabled}
                onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
              />
              <span className="text-sm text-gray-800 dark:text-gray-200">Bật nhắc</span>
            </label>

            <div>
              <div className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">Mốc nhắc (ngày sau)</div>
              <input
                value={form.reminder_days_input}
                onChange={(e) => setForm((f) => ({ ...f, reminder_days_input: e.target.value }))}
                className="app-input"
                placeholder="30,60,90"
              />
              <div className="text-xs text-gray-500 mt-1">Nhập dạng: 30,60,90</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">Giờ gửi</div>
                <input
                  value={form.send_time}
                  onChange={(e) => setForm((f) => ({ ...f, send_time: e.target.value }))}
                  className="app-input"
                  placeholder="08:00"
                />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">Số ngày giãn cách</div>
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
              <div className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">Mẫu tiêu đề</div>
              <input
                value={form.title_template}
                onChange={(e) => setForm((f) => ({ ...f, title_template: e.target.value }))}
                className="app-input"
              />
            </div>

            <div>
              <div className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">Mẫu nội dung</div>
              <textarea
                value={form.body_template}
                onChange={(e) => setForm((f) => ({ ...f, body_template: e.target.value }))}
                className="app-textarea"
                rows={4}
              />
            </div>

            <div className="p-3 rounded-lg bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700">
              <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">Xem trước</div>
              <div className="text-sm text-gray-700 dark:text-gray-300">
                <div className="font-medium">{renderTemplate(form.title_template, mockPreviewData) || '—'}</div>
                <div>{renderTemplate(form.body_template, mockPreviewData) || '—'}</div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button className={buttonStyles.secondary} onClick={() => setIsEditOpen(false)}>
                Hủy
              </button>
              <button
                className={buttonStyles.primary}
                onClick={handleSave}
                disabled={savingServiceId === editService?.id}
              >
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

