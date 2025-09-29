// src/components/Table/FormModal.jsx
import { useState, useEffect } from 'react';

export default function FormModal({ item, isEdit, onClose, onSave, title, fields = [] }) {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (isEdit && item) {
      setFormData(item);
      console.log('Form loaded for edit:', item);
    } else {
      setFormData({});
    }
  }, [item, isEdit]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submit:', formData);
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg w-full max-w-sm sm:max-w-md md:max-w-lg max-h-dvh overflow-auto m-2 sm:m-4">
        <div className="p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-bold mb-4">{isEdit ? `Sửa ${title.slice(0, -1).toLowerCase()}` : `Thêm ${title.slice(0, -1).toLowerCase()}`}</h3>
          <form onSubmit={handleSubmit}>
            {fields.map((field) => (
              <div key={field.name} className="mb-4">
                <label className="block text-sm font-bold mb-2">{field.label}</label>
                {field.type === 'textarea' ? (
                  <textarea
                    name={field.name}
                    value={formData[field.name] || ''}
                    onChange={handleChange}
                    className="w-full p-2 border rounded resize-none h-24 text-sm"
                    required
                  />
                ) : (
                  <input
                    name={field.name}
                    type={field.type || 'text'}
                    value={formData[field.name] || ''}
                    onChange={handleChange}
                    className="w-full p-2 border rounded text-sm"
                    required
                  />
                )}
              </div>
            ))}
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
              <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 rounded text-sm">Hủy</button>
              <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded text-sm">Lưu</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}