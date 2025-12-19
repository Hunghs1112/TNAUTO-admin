// src/components/form/FormModal.jsx
import { useState, useEffect } from 'react';
import FormField from './FormField';
import api from '../../services/api';

export default function FormModal({ item, isEdit, onClose, onSave, title, fields = [] }) {
  const [formData, setFormData] = useState({});
  const [fieldOptions, setFieldOptions] = useState({});
  const [loadingOptions, setLoadingOptions] = useState(false);

  useEffect(() => {
    if (isEdit && item) {
      const initialData = { ...item };
      
      // Auto-calculate end_date for warranties if not present or if it seems incorrect
      if (title === 'Bảo hành' || title === 'bảo hành') {
        if (initialData.start_date && initialData.warranty_period) {
          // Always recalculate to ensure correctness
          try {
            let start = new Date(initialData.start_date);
            if (isNaN(start.getTime())) {
              const dateOnly = String(initialData.start_date).split('T')[0].split(' ')[0];
              start = new Date(dateOnly);
            }
            
            if (!isNaN(start.getTime())) {
              const monthsToAdd = Number(initialData.warranty_period);
              
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
              initialData.end_date = `${year}-${month}-${day}`;
              
              console.log(`[Warranty Form] Recalculated end_date on load: ${initialData.end_date}`);
            }
          } catch (error) {
            console.error('Error calculating initial end_date:', error);
          }
        }
      }
      
      setFormData(initialData);
    } else {
      setFormData({});
    }
  }, [item, isEdit, title]);

  useEffect(() => {
    const loadDynamicOptions = async () => {
      const fieldsWithApi = fields.filter(f => f.type === 'select' && f.apiEndpoint);
      if (fieldsWithApi.length === 0) return;

      setLoadingOptions(true);
      try {
        const optionsData = {};
        
        await Promise.all(fieldsWithApi.map(async (field) => {
          try {
            const response = await api.get(field.apiEndpoint);
            const raw = response.data;
            
            // Chuẩn hóa nhiều kiểu response khác nhau về mảng
            let dataArray = [];
            if (Array.isArray(raw?.data)) {
              dataArray = raw.data;
            } else if (Array.isArray(raw)) {
              dataArray = raw;
            } else if (Array.isArray(raw?.data?.data)) {
              dataArray = raw.data.data;
            } else if (Array.isArray(raw?.data?.items)) {
              dataArray = raw.data.items;
            } else if (Array.isArray(raw?.items)) {
              dataArray = raw.items;
            } else {
              // Thử tìm mảng đầu tiên trong object (data hoặc raw)
              const source = raw?.data && typeof raw.data === 'object' ? raw.data : raw;
              if (source && typeof source === 'object') {
                const firstArray = Object.values(source).find(v => Array.isArray(v));
                if (firstArray) {
                  dataArray = firstArray;
                }
              }
            }
            
            optionsData[field.name] = dataArray.map(item => ({
              value: item[field.valueKey || 'id'],
              label: field.labelFormat 
                ? field.labelFormat(item)
                : item[field.labelKey || 'name']
            }));
          } catch (err) {
            console.error(`Error loading options for ${field.name}:`, err);
            optionsData[field.name] = [];
          }
        }));

        setFieldOptions(optionsData);
      } catch (err) {
        console.error('Error loading dynamic options:', err);
      } finally {
        setLoadingOptions(false);
      }
    };

    loadDynamicOptions();
  }, [fields]);

  const handleChange = (fieldName, value) => {
    const newFormData = { ...formData, [fieldName]: value };
    
    // Auto-calculate end_date for warranties when warranty_period or start_date changes
    if (title === 'Bảo hành' || title === 'bảo hành') {
      if (fieldName === 'warranty_period' || fieldName === 'start_date') {
        const warrantyPeriod = fieldName === 'warranty_period' ? value : newFormData.warranty_period;
        const startDate = fieldName === 'start_date' ? value : newFormData.start_date;
        
        // Calculate end_date if both warranty_period and start_date are available
        if (warrantyPeriod && startDate && Number(warrantyPeriod) > 0) {
          try {
            // Parse start_date - handle both date string and datetime string
            let start = new Date(startDate);
            if (isNaN(start.getTime())) {
              // Try parsing as date only (YYYY-MM-DD)
              const dateOnly = startDate.split('T')[0].split(' ')[0];
              start = new Date(dateOnly);
            }
            
            if (!isNaN(start.getTime())) {
              const monthsToAdd = Number(warrantyPeriod);
              
              // Create a new date object to avoid mutation
              const endDate = new Date(start);
              
              // Get current year and month
              const currentYear = endDate.getFullYear();
              const currentMonth = endDate.getMonth();
              const currentDay = endDate.getDate();
              
              // Calculate new year and month
              const newMonth = currentMonth + monthsToAdd;
              const newYear = currentYear + Math.floor(newMonth / 12);
              const finalMonth = newMonth % 12;
              
              // Set the new date
              endDate.setFullYear(newYear, finalMonth, currentDay);
              
              // Handle day overflow (e.g., Jan 31 + 1 month should be Feb 28/29, not Mar 3)
              // If the day doesn't exist in the target month, set to last day of that month
              const lastDayOfMonth = new Date(newYear, finalMonth + 1, 0).getDate();
              if (currentDay > lastDayOfMonth) {
                endDate.setDate(lastDayOfMonth);
              }
              
              // Format as YYYY-MM-DD for date input (without time)
              const year = endDate.getFullYear();
              const month = String(endDate.getMonth() + 1).padStart(2, '0');
              const day = String(endDate.getDate()).padStart(2, '0');
              const formattedEndDate = `${year}-${month}-${day}`;
              
              newFormData.end_date = formattedEndDate;
              
              console.log(`[Warranty Form] Calculated end_date: ${formattedEndDate} (start: ${startDate}, period: ${warrantyPeriod} months)`);
            } else {
              console.error('[Warranty Form] Invalid start_date:', startDate);
            }
          } catch (error) {
            console.error('[Warranty Form] Error calculating end_date:', error);
          }
        } else if (!warrantyPeriod || !startDate) {
          // Clear end_date if either field is missing
          newFormData.end_date = '';
        }
      }
    }
    
    setFormData(newFormData);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Ensure end_date is calculated for warranties before saving
    if ((title === 'Bảo hành' || title === 'bảo hành') && formData.start_date && formData.warranty_period) {
      const finalFormData = { ...formData };
      
      // Recalculate end_date to ensure it's correct
      if (!finalFormData.end_date || finalFormData.warranty_period || finalFormData.start_date) {
        try {
          let start = new Date(finalFormData.start_date);
          if (isNaN(start.getTime())) {
            const dateOnly = String(finalFormData.start_date).split('T')[0].split(' ')[0];
            start = new Date(dateOnly);
          }
          
          if (!isNaN(start.getTime())) {
            const monthsToAdd = Number(finalFormData.warranty_period);
            
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
            finalFormData.end_date = `${year}-${month}-${day}`;
            
            console.log(`[Warranty Form] Final end_date before save: ${finalFormData.end_date}`);
          }
        } catch (error) {
          console.error('[Warranty Form] Error calculating end_date before save:', error);
        }
      }
      
      onSave(finalFormData);
    } else {
      onSave(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg w-full max-w-lg max-h-[90vh] overflow-auto border border-gray-200 dark:border-slate-800 shadow-xl">
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100">
            {isEdit ? `Sửa ${title.slice(0, -1).toLowerCase()}` : `Thêm ${title.slice(0, -1).toLowerCase()}`}
          </h3>
          
          {loadingOptions && (
            <div className="mb-4 text-center text-gray-600 dark:text-gray-400">
              <div className="inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2" />
              Đang tải dữ liệu...
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            {fields.map((field) => {
              const options = field.apiEndpoint && fieldOptions[field.name]
                ? fieldOptions[field.name]
                : field.options || [];

              // For time_duration field, keep as number (seconds) for FormField to handle conversion
              let displayValue = formData[field.name];
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
                  onChange={(e) => {
                    // Handle time_duration field which returns { target: { name, value } }
                    const value = e.target ? e.target.value : e.value || e;
                    handleChange(field.name, value);
                  }}
                  required={field.required}
                  placeholder={field.placeholder}
                  options={options}
                  min={field.min}
                  max={field.max}
                  rows={field.rows}
                  disabled={field.disabled || (field.apiEndpoint && loadingOptions)}
                />
              );
            })}
            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-slate-800">
              <button 
                type="button" 
                onClick={onClose} 
                className="px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors text-sm font-medium"
              >
                Hủy
              </button>
              <button 
                type="submit" 
                className="btn-gradient-primary text-sm" 
                disabled={loadingOptions}
              >
                Lưu
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}