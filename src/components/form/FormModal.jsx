import { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import FormField from './FormField';

function normalizeArrayResponse(raw) {
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data?.data)) return raw.data.data;
  if (Array.isArray(raw?.data?.items)) return raw.data.items;
  if (Array.isArray(raw?.items)) return raw.items;

  const source = raw?.data && typeof raw.data === 'object' ? raw.data : raw;
  if (source && typeof source === 'object') {
    const firstArray = Object.values(source).find((value) => Array.isArray(value));
    if (firstArray) {
      return firstArray;
    }
  }

  return [];
}

function isWarrantyForm(title) {
  return String(title || '').toLowerCase().includes('bao hanh') || String(title || '').toLowerCase().includes('bảo hành');
}

function calculateWarrantyEndDate(startDate, warrantyPeriod) {
  if (!startDate || !warrantyPeriod || Number(warrantyPeriod) <= 0) {
    return '';
  }

  let start = new Date(startDate);
  if (Number.isNaN(start.getTime())) {
    const dateOnly = String(startDate).split('T')[0].split(' ')[0];
    start = new Date(dateOnly);
  }

  if (Number.isNaN(start.getTime())) {
    return '';
  }

  const monthsToAdd = Number(warrantyPeriod);
  const endDate = new Date(start);
  const currentYear = endDate.getFullYear();
  const currentMonth = endDate.getMonth();
  const currentDay = endDate.getDate();

  const newMonth = currentMonth + monthsToAdd;
  const newYear = currentYear + Math.floor(newMonth / 12);
  const finalMonth = newMonth % 12;

  endDate.setFullYear(newYear, finalMonth, currentDay);

  const lastDayOfMonth = new Date(newYear, finalMonth + 1, 0).getDate();
  if (currentDay > lastDayOfMonth) {
    endDate.setDate(lastDayOfMonth);
  }

  const year = endDate.getFullYear();
  const month = String(endDate.getMonth() + 1).padStart(2, '0');
  const day = String(endDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function FormModal({ item, isEdit, onClose, onSave, title, fields = [] }) {
  const [formData, setFormData] = useState({});
  const [fieldOptions, setFieldOptions] = useState({});
  const [loadingOptions, setLoadingOptions] = useState(false);

  const warrantyForm = useMemo(() => isWarrantyForm(title), [title]);

  useEffect(() => {
    if (!isEdit || !item) {
      setFormData({});
      return;
    }

    const nextData = { ...item };
    if (warrantyForm) {
      nextData.end_date =
        calculateWarrantyEndDate(nextData.start_date, nextData.warranty_period) || nextData.end_date || '';
    }

    setFormData(nextData);
  }, [isEdit, item, warrantyForm]);

  useEffect(() => {
    const loadDynamicOptions = async () => {
      const fieldsWithApi = fields.filter((field) => field.type === 'select' && field.apiEndpoint);
      if (!fieldsWithApi.length) {
        return;
      }

      setLoadingOptions(true);
      try {
        const entries = await Promise.all(
          fieldsWithApi.map(async (field) => {
            try {
              const response = await api.get(field.apiEndpoint);
              const items = normalizeArrayResponse(response.data);

              return [
                field.name,
                items.map((entry) => ({
                  value: entry[field.valueKey || 'id'],
                  label: field.labelFormat ? field.labelFormat(entry) : entry[field.labelKey || 'name'],
                })),
              ];
            } catch {
              return [field.name, []];
            }
          })
        );

        setFieldOptions(Object.fromEntries(entries));
      } finally {
        setLoadingOptions(false);
      }
    };

    loadDynamicOptions();
  }, [fields]);

  const handleChange = (fieldName, value) => {
    setFormData((prev) => {
      const nextData = { ...prev, [fieldName]: value };

      if (warrantyForm && (fieldName === 'warranty_period' || fieldName === 'start_date')) {
        nextData.end_date = calculateWarrantyEndDate(nextData.start_date, nextData.warranty_period);
      }

      return nextData;
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const payload = { ...formData };
    if (warrantyForm) {
      payload.end_date = calculateWarrantyEndDate(payload.start_date, payload.warranty_period) || payload.end_date || '';
    }

    onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-3 backdrop-blur-sm sm:flex sm:items-center sm:justify-center sm:p-4">
      <div className="app-panel my-4 flex max-h-[calc(100vh-1.5rem)] w-full max-w-2xl flex-col sm:my-0 sm:max-h-[90vh]">
        <div className="app-panel-header shrink-0">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {isEdit ? `Sửa ${title.toLowerCase()}` : `Thêm ${title.toLowerCase()}`}
          </h3>
        </div>

        <div className="app-panel-body flex min-h-0 flex-1 flex-col overflow-hidden">
          {loadingOptions ? (
            <div className="mb-4 flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-300">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              <span>Đang tải dữ liệu...</span>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
              {fields.map((field) => {
                const options = field.apiEndpoint ? fieldOptions[field.name] || [] : field.options || [];

                let displayValue = formData[field.name];
                if (field.name === 'customer_id' && field.disabled && item) {
                  displayValue = item.customer_name || item.customer?.name || item.customer_id || formData[field.name];
                }

                if (field.type === 'time_duration' && displayValue !== null && displayValue !== undefined) {
                  displayValue = typeof displayValue === 'number' ? displayValue : Number(displayValue);
                }

                return (
                  <FormField
                    key={field.name}
                    name={field.name}
                    label={field.label}
                    type={field.type}
                    value={displayValue}
                    onChange={(event) => {
                      const nextValue = event?.target ? event.target.value : event?.value ?? event;
                      handleChange(field.name, nextValue);
                    }}
                    required={field.required}
                    placeholder={field.placeholder}
                    options={options}
                    min={field.min}
                    max={field.max}
                    rows={field.rows}
                    disabled={field.disabled || (field.apiEndpoint && loadingOptions)}
                    multiple={field.multiple}
                    maxFiles={field.maxFiles}
                    uploadMode={field.uploadMode}
                    allowFileUpload={field.allowFileUpload}
                    allowLinkUpload={field.allowLinkUpload}
                  />
                );
              })}
            </div>

            <div className="mt-4 flex shrink-0 flex-col justify-end gap-3 border-t border-slate-200 pt-4 sm:flex-row dark:border-slate-800">
              <button type="button" onClick={onClose} className="btn-gradient-secondary">
                Hủy
              </button>
              <button type="submit" className="btn-gradient-primary" disabled={loadingOptions}>
                Lưu
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

