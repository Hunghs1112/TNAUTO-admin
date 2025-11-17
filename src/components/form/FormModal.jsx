// src/components/form/FormModal.jsx
import { useState, useEffect } from 'react';
import { buttonStyles } from '../../styles/colors';
import FormField from './FormField';
import api from '../../services/api';

export default function FormModal({ item, isEdit, onClose, onSave, title, fields = [] }) {
  const [formData, setFormData] = useState({});
  const [fieldOptions, setFieldOptions] = useState({});
  const [loadingOptions, setLoadingOptions] = useState(false);

  useEffect(() => {
    if (isEdit && item) {
      setFormData(item);
      console.log('Form loaded for edit:', item);
    } else {
      setFormData({});
    }
  }, [item, isEdit]);

  // Load dynamic options for select fields with apiEndpoint
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
            const data = response.data.data || response.data || [];
            
            // Format options based on field config
            optionsData[field.name] = data.map(item => ({
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
    setFormData({ ...formData, [fieldName]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submit:', formData);
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 transition-colors duration-300 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-sm sm:max-w-md md:max-w-lg max-h-dvh overflow-auto m-2 sm:m-4 border border-gray-200/50 dark:border-slate-700/50 shadow-2xl transition-colors duration-300 animate-fade-in">
        <div className="p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-bold mb-6 text-gray-900 dark:text-gray-100 transition-colors duration-300">
            {isEdit ? `Sửa ${title.slice(0, -1).toLowerCase()}` : `Thêm ${title.slice(0, -1).toLowerCase()}`}
          </h3>
          
          {loadingOptions && (
            <div className="mb-4 text-center text-gray-600 dark:text-gray-300">
              <div className="inline-block w-4 h-4 border-2 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full animate-spin mr-2" />
              Đang tải dữ liệu...
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            {fields.map((field) => {
              // Use dynamic options if available, otherwise use static options
              const options = field.apiEndpoint && fieldOptions[field.name]
                ? fieldOptions[field.name]
                : field.options || [];

              return (
                <FormField
                  key={field.name}
                  name={field.name}
                  label={field.label}
                  type={field.type}
                  value={formData[field.name]}
                  onChange={(e) => handleChange(field.name, e.target.value)}
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
            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-slate-700">
              <button type="button" onClick={onClose} className={`${buttonStyles.secondary} text-sm`}>
                Hủy
              </button>
              <button type="submit" className={`${buttonStyles.primary} text-sm`} disabled={loadingOptions}>
                Lưu
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}