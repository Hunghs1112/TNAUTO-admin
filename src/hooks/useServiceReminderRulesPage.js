import { useCallback, useEffect, useMemo, useState } from 'react';
import { serviceReminderConfigsAPI, servicesAPI } from '../services/api';

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

function resolveReminderDays(cfg) {
  const reminderDays = cfg?.reminder_days || cfg?.reminder_days_json || cfg?.reminder_days_list || cfg?.reminderDays;

  if (Array.isArray(reminderDays)) {
    return reminderDays;
  }

  if (typeof reminderDays === 'string') {
    try {
      const parsed = JSON.parse(reminderDays);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
}

export function renderTemplate(template, mock) {
  if (!template) return '';
  return template
    .replaceAll('{customer_name}', mock.customer_name)
    .replaceAll('{service_name}', mock.service_name)
    .replaceAll('{days_after}', String(mock.days_after))
    .replaceAll('{order_id}', String(mock.order_id));
}

export default function useServiceReminderRulesPage({ showSuccess, showError }) {
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
      const [servicesRes, configsRes] = await Promise.all([servicesAPI.getAll(), serviceReminderConfigsAPI.getAll()]);

      const servicesList = servicesRes.data?.data || servicesRes.data || [];
      const configsList = configsRes.data?.data || configsRes.data || [];

      const map = {};
      for (const cfg of configsList) {
        if (cfg?.service_id != null) {
          map[String(cfg.service_id)] = cfg;
        }
      }

      setServices(servicesList);
      setConfigsByServiceId(map);
    } catch (err) {
      setServices([]);
      setConfigsByServiceId({});
      showError(err?.message || 'Không thể tải cấu hình nhắc dịch vụ.');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const openEdit = useCallback(
    (service) => {
      const cfg = configsByServiceId[String(service.id)];
      const normalizedDays = resolveReminderDays(cfg);

      setEditService(service);
      setForm({
        enabled: cfg?.enabled ?? true,
        reminder_days_input: normalizedDays.length ? normalizedDays.join(',') : '30,60,90',
        send_time: cfg?.send_time || '08:00',
        title_template: cfg?.title_template || 'Nhắc dịch vụ',
        body_template: cfg?.body_template || 'Chào {customer_name} ạ, đã {days_after} ngày từ lần {service_name} gần nhất...',
        cooldown_days: cfg?.cooldown_days ?? 7,
      });
      setIsEditOpen(true);
    },
    [configsByServiceId]
  );

  const closeEdit = useCallback(() => {
    setIsEditOpen(false);
    setEditService(null);
  }, []);

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
        showError(err?.message || 'Không thể cập nhật trạng thái nhắc dịch vụ.');
      } finally {
        setSavingServiceId(null);
      }
    },
    [loadAll, showError]
  );

  const handleSave = useCallback(async () => {
    if (!editService) return;

    const reminder_days = uniqueSortedNumbers(parseDaysInput(form.reminder_days_input));
    if (!reminder_days.length) {
      showError('Vui lòng nhập mốc nhắc hợp lệ, ví dụ: 30,60,90.');
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
      closeEdit();
      await loadAll();
      showSuccess('Đã lưu cấu hình nhắc dịch vụ.');
    } catch (err) {
      showError(err?.message || 'Không thể lưu cấu hình nhắc dịch vụ.');
    } finally {
      setSavingServiceId(null);
    }
  }, [closeEdit, editService, form, loadAll, showError, showSuccess]);

  const filteredServices = useMemo(() => {
    const q = (searchText || '').trim().toLowerCase();
    if (!q) return services;

    return services.filter((svc) => {
      const name = (svc?.name || svc?.service_name || '').toLowerCase();
      const idStr = String(svc?.id ?? '');
      return name.includes(q) || idStr.includes(q);
    });
  }, [services, searchText]);

  return {
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
  };
}
