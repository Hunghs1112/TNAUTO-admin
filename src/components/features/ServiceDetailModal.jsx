// src/components/features/ServiceDetailModal.jsx
import React, { useState, useEffect } from 'react';
import { servicesAPI, serviceCategoriesAPI } from '../../services/api';
import { isValidImageUrl, normalizeImageUrl, formatTimeDuration, formatWarrantyPeriod } from '../../utils/format';
import LoadingSpinner from '../ui/LoadingSpinner';
import ImageUploader from '../image/ImageUploader';
import ImagePreview from '../image/ImagePreview';
import FormField from '../form/FormField';
import { useLoadingKey } from '../../contexts/LoadingContext';
import { useToast } from '../../contexts/ToastContext';
import { servicesConfig } from '../../config/entityConfigs';
import { X, Edit2, Save, XCircle } from 'lucide-react';

/**
 * Service Detail Modal Component
 * Form chi tiết riêng cho dịch vụ với quản lý ảnh tích hợp
 */
export default function ServiceDetailModal({
  isOpen,
  serviceId,
  onClose,
  onRefresh
}) {
  const [selectedService, setSelectedService] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [fieldOptions, setFieldOptions] = useState({});
  const [loadingOptions, setLoadingOptions] = useState(false);

  const { startLoading: startDetailLoading, stopLoading: stopDetailLoading, loading: loadingDetail } = useLoadingKey('service-detail', 'Đang tải chi tiết...');
  const { success, error } = useToast();

  useEffect(() => {
    if (isOpen && serviceId) {
      fetchServiceDetails(serviceId);
    } else {
      // Reset state when modal closes
      setSelectedService(null);
      setIsEditMode(false);
      setFormData({});
    }
  }, [isOpen, serviceId]);

  // Load dynamic options for select fields
  useEffect(() => {
    const loadDynamicOptions = async () => {
      const fieldsWithApi = servicesConfig.fieldsForModal.filter(f => f.type === 'select' && f.apiEndpoint);
      if (fieldsWithApi.length === 0) return;

      setLoadingOptions(true);
      try {
        const optionsData = {};
        
        await Promise.all(fieldsWithApi.map(async (field) => {
          try {
            let response;
            // Load from correct API based on endpoint
            if (field.apiEndpoint === '/service-categories') {
              response = await serviceCategoriesAPI.getAll();
            } else {
              response = await servicesAPI.getAll();
            }
            
            const raw = response.data;
            
            // Chuẩn hóa nhiều kiểu response khác nhau về mảng
            let dataArray = [];
            if (Array.isArray(raw?.data)) {
              dataArray = raw.data;
            } else if (Array.isArray(raw)) {
              dataArray = raw;
            } else if (Array.isArray(raw?.data?.data)) {
              dataArray = raw.data.data;
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

    if (isOpen) {
      loadDynamicOptions();
    }
  }, [isOpen]);

  // Update form data when service is loaded or edit mode changes
  useEffect(() => {
    if (selectedService && isEditMode) {
      setFormData({
        name: selectedService.name || '',
        supplier_name: selectedService.supplier_name || '',
        category_id: selectedService.category_id || '',
        description: selectedService.description || '',
        estimated_time: selectedService.estimated_time || 0,
        warranty_period: selectedService.warranty_period || 0,
        image_url: selectedService.image_url || ''
      });
    }
  }, [selectedService, isEditMode]);

  const fetchServiceDetails = async (id) => {
    startDetailLoading('Đang tải chi tiết dịch vụ...');
    try {
      const serviceRes = await servicesAPI.getById(id);
      const serviceData = serviceRes.data.data || serviceRes.data;
      setSelectedService(serviceData || null);
    } catch (err) {
      console.error('Fetch service details error:', err);
      error('Không thể tải chi tiết dịch vụ: ' + (err.response?.data?.message || err.message));
      setSelectedService(null);
      onClose();
    } finally {
      stopDetailLoading();
    }
  };

  const handleImageUpload = async (imageUrl) => {
    if (!selectedService) {
      error('Vui lòng chọn dịch vụ');
      return;
    }

    try {
      startDetailLoading('Đang cập nhật ảnh...');
      
      const url = Array.isArray(imageUrl) ? imageUrl[0] : imageUrl;
      if (!url || url.startsWith('data:image/')) {
        error('URL ảnh không hợp lệ');
        return;
      }
      
      await servicesAPI.update(selectedService.id, {
        image_url: url
      });
      
      success('Cập nhật ảnh thành công!');
      
      // Refresh service data
      await fetchServiceDetails(selectedService.id);
      onRefresh && onRefresh();
    } catch (err) {
      console.error('Update image error:', err);
      error('Lỗi khi cập nhật ảnh: ' + (err.response?.data?.message || err.message));
    } finally {
      stopDetailLoading();
    }
  };

  const handleDeleteImage = async () => {
    if (!confirm('Xóa hình ảnh này?')) return;
    
    try {
      startDetailLoading('Đang xóa ảnh...');
      
      await servicesAPI.update(selectedService.id, {
        image_url: null
      });
      
      success('Xóa ảnh thành công!');
      
      // Refresh service data
      if (selectedService) {
        await fetchServiceDetails(selectedService.id);
      }
      onRefresh && onRefresh();
    } catch (err) {
      console.error('Delete image error:', err);
      error('Lỗi khi xóa ảnh');
    } finally {
      stopDetailLoading();
    }
  };

  const handleEdit = () => {
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    // Reset form data to original service data
    if (selectedService) {
      setFormData({
        name: selectedService.name || '',
        supplier_name: selectedService.supplier_name || '',
        category_id: selectedService.category_id || '',
        description: selectedService.description || '',
        estimated_time: selectedService.estimated_time || 0,
        warranty_period: selectedService.warranty_period || 0,
        image_url: selectedService.image_url || ''
      });
    }
  };

  const handleSaveService = async () => {
    if (!selectedService) return;

    try {
      startDetailLoading('Đang lưu thông tin dịch vụ...');
      
      // Check if category_id changed
      const categoryChanged = selectedService.category_id !== formData.category_id;
      
      await servicesAPI.update(selectedService.id, formData);
      success('Cập nhật dịch vụ thành công!');
      
      // Refresh service data
      await fetchServiceDetails(selectedService.id);
      setIsEditMode(false);
      onRefresh && onRefresh();
      
      // If category changed, notify ServiceCategories page to refresh
      if (categoryChanged) {
        // Store timestamp in sessionStorage for late listeners
        sessionStorage.setItem('serviceCategoryChanged', Date.now().toString());
        window.dispatchEvent(new CustomEvent('serviceCategoryChanged'));
      }
    } catch (err) {
      console.error('Update service error:', err);
      error('Có lỗi xảy ra khi cập nhật dịch vụ: ' + (err.response?.data?.message || err.message));
    } finally {
      stopDetailLoading();
    }
  };

  const handleFormChange = (fieldName, value) => {
    setFormData({ ...formData, [fieldName]: value });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Service Detail Modal */}
      <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 animate-fade-in">
        <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-5xl max-h-[95vh] flex flex-col shadow-2xl border border-gray-200/50 dark:border-slate-700/50 animate-fade-in">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-slate-700 flex-shrink-0 gradient-header transition-colors duration-300">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 transition-colors duration-300">
                  {selectedService ? `Chi tiết dịch vụ #${selectedService.id}` : 'Đang tải...'}
                </h3>
                {selectedService && (
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {selectedService.name}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-all duration-200 active:scale-95"
                aria-label="Đóng"
              >
                <X size={20} />
              </button>
            </div>
          </div>
          
          {/* Loading State */}
          {loadingDetail && (
            <div className="flex-1 flex items-center justify-center p-8">
              <LoadingSpinner size="lg" message="Đang tải thông tin dịch vụ..." />
            </div>
          )}
          
          {/* Content */}
          {!loadingDetail && selectedService && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white dark:bg-slate-800 transition-colors duration-300 space-y-4">
              {/* Thông tin dịch vụ - Có thể sửa */}
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 border border-gray-200 dark:border-slate-600">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-base sm:text-lg text-gray-700 dark:text-gray-300">
                    Thông tin dịch vụ
                  </h4>
                  {!isEditMode && (
                    <button
                      onClick={handleEdit}
                      className="btn-gradient-primary flex items-center gap-2 px-3 py-1.5 text-sm font-medium"
                    >
                      <Edit2 size={16} />
                      Sửa
                    </button>
                  )}
                </div>

                {isEditMode ? (
                  // Form sửa
                  <div className="space-y-4">
                    {servicesConfig.fieldsForModal.filter(field => field.name !== 'image_url').map((field) => {
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
                          onChange={(e) => {
                            const value = e.target ? e.target.value : e.value || e;
                            handleFormChange(field.name, value);
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
                  </div>
                ) : (
                  // Chế độ xem
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div><span className="font-medium text-gray-700 dark:text-gray-300">Tên:</span> <span className="text-gray-900 dark:text-gray-100">{selectedService.name || '-'}</span></div>
                    <div><span className="font-medium text-gray-700 dark:text-gray-300">Danh mục:</span> <span className="text-gray-900 dark:text-gray-100">{selectedService.category_name || '-'}</span></div>
                    <div className="sm:col-span-2"><span className="font-medium text-gray-700 dark:text-gray-300">Thời gian ước tính:</span> <span className="text-gray-900 dark:text-gray-100">{formatTimeDuration(selectedService.estimated_time)}</span></div>
                    <div className="sm:col-span-2"><span className="font-medium text-gray-700 dark:text-gray-300">Thời gian bảo hành:</span> <span className="text-gray-900 dark:text-gray-100">{formatWarrantyPeriod(selectedService.warranty_period)}</span></div>
                    <div className="sm:col-span-2"><span className="font-medium text-gray-700 dark:text-gray-300">Nhà cung cấp:</span> <span className="text-gray-900 dark:text-gray-100">{selectedService.supplier_name || '-'}</span></div>
                    {selectedService.description && (
                      <div className="sm:col-span-2"><span className="font-medium text-gray-700 dark:text-gray-300">Mô tả:</span> <span className="text-gray-900 dark:text-gray-100">{selectedService.description}</span></div>
                    )}
                  </div>
                )}
              </div>

              {/* Hình ảnh - Có thể thêm/xóa/xem */}
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 border border-gray-200 dark:border-slate-600">
                <h4 className="font-semibold text-base sm:text-lg mb-3 text-gray-700 dark:text-gray-300">
                  Hình ảnh dịch vụ
                </h4>

                {isEditMode ? (
                  <FormField
                    name="image_url"
                    label="Hình ảnh"
                    type="image"
                    value={formData.image_url}
                    onChange={(e) => {
                      const value = e.target ? e.target.value : e.value || e;
                      handleFormChange('image_url', value);
                    }}
                    multiple={false}
                    maxFiles={1}
                    uploadMode="both"
                  />
                ) : (
                  <>
                    {selectedService.image_url && isValidImageUrl(selectedService.image_url) ? (
                      <div className="space-y-3">
                        <div className="relative group inline-block">
                          <ImagePreview
                            src={normalizeImageUrl(selectedService.image_url) || selectedService.image_url}
                            alt="Hình ảnh dịch vụ"
                            className="w-full max-w-md h-auto rounded-lg"
                            showModal={true}
                            directDisplay={true}
                          />
                          <button
                            type="button"
                            onClick={handleDeleteImage}
                            className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                            title="Xóa ảnh"
                          >
                            <X size={16} />
                          </button>
                        </div>
                        <div className="mt-3">
                          <ImageUploader
                            onUploadSuccess={handleImageUpload}
                            multiple={false}
                            maxFiles={1}
                            uploadMode="both"
                            allowFileUpload={true}
                            allowLinkUpload={true}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <p className="text-sm mb-4">Chưa có hình ảnh</p>
                        <ImageUploader
                          onUploadSuccess={handleImageUpload}
                          multiple={false}
                          maxFiles={1}
                          uploadMode="both"
                          allowFileUpload={true}
                          allowLinkUpload={true}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          {!loadingDetail && selectedService && (
            <div className="p-4 sm:p-6 border-t border-gray-200 dark:border-slate-700 flex-shrink-0 bg-white dark:bg-slate-800">
              <div className="flex flex-col sm:flex-row gap-2 justify-end">
                {isEditMode ? (
                  <>
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2.5 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-300 dark:hover:bg-slate-600 transition-all duration-200 font-medium text-sm shadow-sm hover:shadow-md active:scale-[0.98] flex items-center gap-2"
                    >
                      <XCircle size={16} />
                      Hủy
                    </button>
                    <button
                      onClick={handleSaveService}
                      disabled={loadingDetail}
                      className="btn-gradient-primary px-4 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm shadow-sm hover:shadow-md active:scale-[0.98] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save size={16} />
                      Lưu
                    </button>
                  </>
                ) : (
                  <button
                    onClick={onClose}
                    className="px-4 py-2.5 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-300 dark:hover:bg-slate-600 transition-all duration-200 font-medium text-sm shadow-sm hover:shadow-md active:scale-[0.98] flex items-center gap-2"
                  >
                    <X size={16} />
                    Đóng
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
