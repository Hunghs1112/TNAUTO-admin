// src/components/form/FormField.jsx
import React from 'react';
import ImageUploader from '../image/ImageUploader';
import ImagePreview from '../image/ImagePreview';
import { formatTimeDuration, parseTimeDuration, secondsToDaysHours, daysHoursToSeconds, formatWarrantyPeriod, monthsToSeconds, secondsToMonths } from '../../utils/format';

/**
 * Reusable form field component
 * Supports different input types with validation
 */
export default function FormField({ 
  name, 
  label, 
  type = 'text', 
  value, 
  onChange, 
  required = false, 
  placeholder = '', 
  options = [], 
  min, 
  max,
  rows = 3,
  className = '',
  disabled = false,
  // ImageUploader specific props
  multiple = false,
  maxFiles = 1,
  uploadMode = 'both',
  allowFileUpload = true,
  allowLinkUpload = true
}) {
  const baseInputClass = "w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 disabled:bg-gray-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md focus:shadow-lg";
  
  // Normalize value to ensure it's always defined (not undefined)
  // For number inputs, use empty string if undefined (React will handle it)
  // For checkbox, use false
  // For others, use empty string
  const normalizedValue = value ?? (type === 'checkbox' ? false : (type === 'number' ? '' : ''));

  const renderInput = () => {
    switch (type) {
      case 'select':
        return (
          <select
            name={name}
            value={normalizedValue}
            onChange={onChange}
            required={required}
            disabled={disabled}
            className={`${baseInputClass} ${className}`}
          >
            <option value="">-- Chọn {label.toLowerCase()} --</option>
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      
      case 'textarea':
        return (
          <textarea
            name={name}
            value={normalizedValue}
            onChange={onChange}
            required={required}
            placeholder={placeholder}
            rows={rows}
            disabled={disabled}
            className={`${baseInputClass} ${className}`}
          />
        );
      
      case 'checkbox':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              name={name}
              checked={normalizedValue}
              onChange={onChange}
              disabled={disabled}
              className="w-4 h-4 text-blue-600 dark:text-blue-400 border-gray-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500/50 bg-white dark:bg-slate-700 transition-all duration-200 cursor-pointer"
            />
            <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              {label}
            </label>
          </div>
        );
      
      case 'number':
        return (
          <input
            type="number"
            name={name}
            value={normalizedValue}
            onChange={onChange}
            required={required}
            placeholder={placeholder}
            min={min}
            max={max}
            disabled={disabled}
            className={`${baseInputClass} ${className}`}
          />
        );
      
      case 'date':
        return (
          <input
            type="date"
            name={name}
            value={normalizedValue}
            onChange={onChange}
            required={required}
            disabled={disabled}
            className={`${baseInputClass} ${className}`}
          />
        );
      
      case 'email':
        return (
          <input
            type="email"
            name={name}
            value={normalizedValue}
            onChange={onChange}
            required={required}
            placeholder={placeholder}
            disabled={disabled}
            className={`${baseInputClass} ${className}`}
          />
        );
      
      case 'password':
        return (
          <input
            type="password"
            name={name}
            value={normalizedValue}
            onChange={onChange}
            required={required}
            placeholder={placeholder}
            disabled={disabled}
            className={`${baseInputClass} ${className}`}
          />
        );
      
      case 'time_duration':
        // Convert seconds to days and hours for display
        let currentDays = 0;
        let currentHours = 0;
        if (normalizedValue !== null && normalizedValue !== undefined && normalizedValue !== '' && typeof normalizedValue === 'number') {
          const converted = secondsToDaysHours(normalizedValue);
          currentDays = converted.days;
          currentHours = converted.hours;
        }
        
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Số ngày
                </label>
                <input
                  type="number"
                  name={`${name}_days`}
                  value={currentDays}
                  onChange={(e) => {
                    const days = e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0;
                    const hours = currentHours || 0;
                    const totalSeconds = daysHoursToSeconds(days, hours);
                    onChange({ 
                      target: { 
                        name, 
                        value: totalSeconds
                      } 
                    });
                  }}
                  min="0"
                  placeholder="0"
                  disabled={disabled}
                  className={`${baseInputClass} ${className}`}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Số giờ
                </label>
                <input
                  type="number"
                  name={`${name}_hours`}
                  value={currentHours}
                  onChange={(e) => {
                    const hours = e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0;
                    const days = currentDays || 0;
                    const totalSeconds = daysHoursToSeconds(days, hours);
                    onChange({ 
                      target: { 
                        name, 
                        value: totalSeconds
                      } 
                    });
                  }}
                  min="0"
                  max="23"
                  placeholder="0"
                  disabled={disabled}
                  className={`${baseInputClass} ${className}`}
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Nhập số ngày và số giờ. Giá trị sẽ được chuyển đổi thành giây để lưu vào cơ sở dữ liệu.
            </p>
          </div>
        );
      
      case 'warranty_period':
        // Convert seconds to months for display
        let currentMonths = 0;
        if (normalizedValue !== null && normalizedValue !== undefined && normalizedValue !== '' && typeof normalizedValue === 'number') {
          currentMonths = secondsToMonths(normalizedValue);
        }
        
        return (
          <div className="space-y-3">
            <div>
              <input
                type="number"
                name={name}
                value={currentMonths}
                onChange={(e) => {
                  const months = e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0;
                  const totalSeconds = monthsToSeconds(months);
                  onChange({ 
                    target: { 
                      name, 
                      value: totalSeconds
                    } 
                  });
                }}
                min="0"
                placeholder="0"
                disabled={disabled}
                className={`${baseInputClass} ${className}`}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Nhập số tháng bảo hành. Giá trị sẽ được chuyển đổi thành giây để lưu vào cơ sở dữ liệu.
            </p>
          </div>
        );
      
      case 'image':
      case 'image_url':
        return (
          <div className="space-y-2">
            <ImageUploader
              onUploadSuccess={(url) => {
                // Chỉ cập nhật giá trị form khi upload thành công (sau khi bấm nút "Tải lên")
                // Handle both single and multiple uploads
                const newValue = multiple 
                  ? (Array.isArray(value) ? [...value, ...(Array.isArray(url) ? url : [url])] : (Array.isArray(url) ? url : [url]))
                  : (Array.isArray(url) ? url[0] : url);
                onChange({ target: { name, value: newValue } });
              }}
              multiple={multiple}
              maxFiles={maxFiles}
              uploadMode={uploadMode}
              allowFileUpload={allowFileUpload}
              allowLinkUpload={allowLinkUpload}
            />
            {value && (
              <div className="mt-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">Ảnh hiện tại:</p>
                {multiple && Array.isArray(value) ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {value.map((url, index) => (
                      <div key={index} className="relative group">
                        <ImagePreview
                          src={url}
                          alt={`Preview ${index + 1}`}
                          className="w-full aspect-square rounded-lg"
                          showModal={true}
                          directDisplay={true}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newValue = value.filter((_, i) => i !== index);
                            onChange({ target: { name, value: newValue } });
                          }}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                          title="Xóa ảnh"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="relative group inline-block">
                    <ImagePreview
                      src={value}
                      alt="Preview"
                      className="w-32 h-32 sm:w-40 sm:h-40 rounded-lg"
                      showModal={true}
                      directDisplay={true}
                    />
                    <button
                      type="button"
                      onClick={() => onChange({ target: { name, value: multiple ? [] : '' } })}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                      title="Xóa ảnh"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      
      default:
        return (
          <input
            type="text"
            name={name}
            value={normalizedValue}
            onChange={onChange}
            required={required}
            placeholder={placeholder}
            disabled={disabled}
            className={`${baseInputClass} ${className}`}
          />
        );
    }
  };

  if (type === 'checkbox') {
    return renderInput();
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 transition-colors duration-300">
        {label} {required && <span className="text-red-500 dark:text-red-400">*</span>}
      </label>
      {renderInput()}
    </div>
  );
}