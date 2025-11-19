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
      setFormData(item);
    } else {
      setFormData({});
    }
  }, [item, isEdit]);

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
    onSave(formData);
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