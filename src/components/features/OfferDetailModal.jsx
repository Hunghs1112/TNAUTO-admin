// src/components/features/OfferDetailModal.jsx
import React, { useState, useEffect } from 'react';
import { offersAPI, servicesAPI } from '../../services/api';
import { isValidImageUrl, normalizeImageUrl } from '../../utils/format';
import LoadingSpinner from '../ui/LoadingSpinner';
import ImageUploader from '../image/ImageUploader';
import ImageGrid from '../image/ImageGrid';
import FormField from '../form/FormField';
import { useLoadingKey } from '../../contexts/LoadingContext';
import { useToast } from '../../contexts/ToastContext';
import { offersConfig } from '../../config/entityConfigs';
import { Plus, X, Edit2, Save, XCircle } from 'lucide-react';

/**
 * Offer Detail Modal Component
 * Form chi tiết riêng cho ưu đãi với quản lý ảnh tích hợp
 */
export default function OfferDetailModal({
  isOpen,
  offerId,
  onClose,
  onRefresh
}) {
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [offerImages, setOfferImages] = useState([]);
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [fieldOptions, setFieldOptions] = useState({});
  const [loadingOptions, setLoadingOptions] = useState(false);

  const { startLoading: startDetailLoading, stopLoading: stopDetailLoading, loading: loadingDetail } = useLoadingKey('offer-detail', 'Đang tải chi tiết...');
  const { success, error } = useToast();

  useEffect(() => {
    if (isOpen && offerId) {
      fetchOfferDetails(offerId);
    } else {
      // Reset state when modal closes
      setSelectedOffer(null);
      setOfferImages([]);
      setShowImageUploader(false);
      setIsEditMode(false);
      setFormData({});
    }
  }, [isOpen, offerId]);

  // Load dynamic options for select fields
  useEffect(() => {
    const loadDynamicOptions = async () => {
      const fieldsWithApi = offersConfig.fieldsForModal.filter(f => f.type === 'select' && f.apiEndpoint);
      if (fieldsWithApi.length === 0) return;

      setLoadingOptions(true);
      try {
        const optionsData = {};
        
        await Promise.all(fieldsWithApi.map(async (field) => {
          try {
            let response;
            // Load from correct API based on endpoint
            if (field.apiEndpoint === '/services') {
              response = await servicesAPI.getAll();
            } else {
              response = await offersAPI.getAll();
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

  // Update form data when offer is loaded or edit mode changes
  useEffect(() => {
    if (selectedOffer && isEditMode) {
      setFormData({
        name: selectedOffer.name || '',
        service_id: selectedOffer.service_id || '',
        content: selectedOffer.content || ''
      });
    }
  }, [selectedOffer, isEditMode]);

  const fetchOfferDetails = async (id) => {
    startDetailLoading('Đang tải chi tiết ưu đãi...');
    try {
      const offerRes = await offersAPI.getById(id);
      const offerData = offerRes.data.data || offerRes.data;
      setSelectedOffer(offerData || null);

      // Fetch images
      try {
        const imagesRes = await offersAPI.getImages(id);
        const imagesData = imagesRes.data.data || imagesRes.data;
        const validImages = Array.isArray(imagesData) 
          ? imagesData
              .filter(img => img.image_url && isValidImageUrl(img.image_url))
              .map(img => {
                const normalizedUrl = normalizeImageUrl(img.image_url);
                return {
                  ...img,
                  image_url: normalizedUrl || img.image_url
                };
              })
              .filter(img => img.image_url)
          : [];
        setOfferImages(validImages);
      } catch (imgErr) {
        console.error('Fetch offer images error:', imgErr);
        // Nếu API chưa sẵn sàng, sử dụng images từ offer data hoặc image_url
        if (offerData?.images && Array.isArray(offerData.images)) {
          const validImages = offerData.images
            .filter(img => img.image_url && isValidImageUrl(img.image_url))
            .map(img => {
              const normalizedUrl = normalizeImageUrl(img.image_url);
              return {
                ...img,
                image_url: normalizedUrl || img.image_url
              };
            });
          setOfferImages(validImages);
        } else if (offerData?.image_url && isValidImageUrl(offerData.image_url)) {
          // Fallback: tạo một ảnh từ image_url nếu có
          setOfferImages([{
            id: 'temp',
            image_url: normalizeImageUrl(offerData.image_url) || offerData.image_url,
            is_primary: 1
          }]);
        } else {
          setOfferImages([]);
        }
      }
    } catch (err) {
      console.error('Fetch offer details/images error:', err);
      error('Không thể tải chi tiết ưu đãi: ' + (err.response?.data?.message || err.message));
      setSelectedOffer(null);
      setOfferImages([]);
      onClose();
    } finally {
      stopDetailLoading();
    }
  };

  const handleImageUpload = async (imageUrls) => {
    if (!selectedOffer) {
      error('Vui lòng chọn ưu đãi');
      return;
    }

    try {
      startDetailLoading('Đang tải ảnh lên...');
      const urls = Array.isArray(imageUrls) ? imageUrls : [imageUrls];
      const validUrls = urls.filter(url => !url.startsWith('data:image/'));
      
      if (validUrls.length === 0) {
        error('Không có ảnh hợp lệ để tải lên');
        return;
      }
      
      let firstImageUrl = null;
      let isFirstImage = offerImages.length === 0;
      
      for (const imageUrl of validUrls) {
        const imageData = {
          offer_id: parseInt(selectedOffer.id),
          image_url: imageUrl,
          is_primary: isFirstImage && !firstImageUrl ? 1 : 0 // Đặt ảnh đầu tiên làm ảnh chính
        };
        
        const createdImage = await offersAPI.createImage(imageData);
        
        // Lưu URL ảnh đầu tiên để cập nhật offer.image_url
        if (!firstImageUrl) {
          firstImageUrl = imageUrl;
        }
      }
      
      // Nếu đây là ảnh đầu tiên hoặc ưu đãi chưa có image_url, cập nhật offer.image_url
      if (isFirstImage && firstImageUrl) {
        try {
          await offersAPI.update(selectedOffer.id, {
            image_url: firstImageUrl
          });
        } catch (updateErr) {
          console.error('Error updating offer image_url:', updateErr);
          // Không throw error vì ảnh đã được tạo thành công
        }
      }
      
      success(`Thêm thành công ${validUrls.length} ảnh!`);
      
      // Refresh danh sách ảnh và thông tin ưu đãi
      await fetchOfferDetails(selectedOffer.id);
      setShowImageUploader(false);
      onRefresh && onRefresh();
    } catch (err) {
      console.error('Create image record error:', err);
      error('Lỗi khi lưu thông tin ảnh: ' + (err.response?.data?.message || err.message));
    } finally {
      stopDetailLoading();
    }
  };

  const handleDeleteImage = async (imageId, imageUrl) => {
    if (!confirm('Xóa hình ảnh này?')) return;
    
    try {
      startDetailLoading('Đang xóa ảnh...');
      
      // Kiểm tra xem ảnh này có phải là ảnh chính không
      const deletedImage = offerImages.find(img => img.id === imageId);
      const isPrimary = deletedImage && deletedImage.is_primary === 1;
      
      // Nếu là ảnh tạm (từ image_url), chỉ cập nhật offer
      if (imageId === 'temp') {
        await offersAPI.update(selectedOffer.id, {
          image_url: null
        });
      } else {
        await offersAPI.deleteImage(imageId);
      }
      
      // Nếu xóa ảnh chính và còn ảnh khác, đặt ảnh đầu tiên làm ảnh chính
      if (isPrimary && offerImages.length > 1) {
        const remainingImages = offerImages.filter(img => img.id !== imageId);
        if (remainingImages.length > 0) {
          const newPrimaryImage = remainingImages[0];
          // Bỏ qua ảnh tạm
          if (newPrimaryImage.id !== 'temp') {
            try {
              // Đặt ảnh đầu tiên làm ảnh chính
              await offersAPI.updateImage(newPrimaryImage.id, { is_primary: 1 });
              
              // Cập nhật offer.image_url
              await offersAPI.update(selectedOffer.id, {
                image_url: newPrimaryImage.image_url
              });
            } catch (updateErr) {
              console.error('Error updating primary image after delete:', updateErr);
              // Không throw error vì ảnh đã được xóa thành công
            }
          }
        }
      } else if (isPrimary && offerImages.length === 1) {
        // Nếu xóa ảnh chính và không còn ảnh nào, xóa image_url của offer
        try {
          await offersAPI.update(selectedOffer.id, {
            image_url: null
          });
        } catch (updateErr) {
          console.error('Error clearing offer image_url:', updateErr);
        }
      }
      
      success('Xóa ảnh thành công!');
      
      // Refresh danh sách ảnh
      if (selectedOffer) {
        await fetchOfferDetails(selectedOffer.id);
      }
      onRefresh && onRefresh();
    } catch (err) {
      console.error('Delete image error:', err);
      error('Lỗi khi xóa ảnh');
    } finally {
      stopDetailLoading();
    }
  };

  const handleSetPrimary = async (imageId) => {
    if (!selectedOffer) return;

    try {
      startDetailLoading('Đang đặt làm ảnh chính...');
      
      // Tìm ảnh được chọn làm ảnh chính
      const primaryImage = offerImages.find(img => img.id === imageId);
      if (!primaryImage) {
        error('Không tìm thấy ảnh');
        return;
      }
      
      // Bỏ qua ảnh tạm
      if (imageId === 'temp') {
        error('Không thể đặt ảnh tạm làm ảnh chính');
        return;
      }
      
      // Update primary image
      await offersAPI.updateImage(imageId, { is_primary: 1 });
      
      // Update other images to remove primary
      const otherImages = offerImages.filter(img => img.id !== imageId && img.is_primary === 1);
      for (const img of otherImages) {
        if (img.id !== 'temp') {
          await offersAPI.updateImage(img.id, { is_primary: 0 });
        }
      }
      
      // Cập nhật offer.image_url với URL của ảnh chính
      try {
        await offersAPI.update(selectedOffer.id, {
          image_url: primaryImage.image_url
        });
      } catch (updateErr) {
        console.error('Error updating offer image_url:', updateErr);
        // Không throw error vì ảnh chính đã được đặt thành công
      }
      
      success('Đặt ảnh chính thành công!');
      await fetchOfferDetails(selectedOffer.id);
      onRefresh && onRefresh();
    } catch (err) {
      console.error('Set primary image error:', err);
      error('Có lỗi xảy ra khi đặt ảnh chính: ' + (err.response?.data?.message || err.message));
    } finally {
      stopDetailLoading();
    }
  };

  const handleEdit = () => {
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    // Reset form data to original offer data
    if (selectedOffer) {
      setFormData({
        name: selectedOffer.name || '',
        service_id: selectedOffer.service_id || '',
        content: selectedOffer.content || ''
      });
    }
  };

  const handleSaveOffer = async () => {
    if (!selectedOffer) return;

    try {
      startDetailLoading('Đang lưu thông tin ưu đãi...');
      
      await offersAPI.update(selectedOffer.id, formData);
      success('Cập nhật ưu đãi thành công!');
      
      // Refresh offer data
      await fetchOfferDetails(selectedOffer.id);
      setIsEditMode(false);
      onRefresh && onRefresh();
    } catch (err) {
      console.error('Update offer error:', err);
      error('Có lỗi xảy ra khi cập nhật ưu đãi: ' + (err.response?.data?.message || err.message));
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
      {/* Offer Detail Modal */}
      <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 animate-fade-in">
        <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-5xl max-h-[95vh] flex flex-col shadow-2xl border border-gray-200/50 dark:border-slate-700/50 animate-fade-in">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-slate-700 flex-shrink-0 gradient-header transition-colors duration-300">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 transition-colors duration-300">
                  {selectedOffer ? `Chi tiết ưu đãi #${selectedOffer.id}` : 'Đang tải...'}
                </h3>
                {selectedOffer && (
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {selectedOffer.name}
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
              <LoadingSpinner size="lg" message="Đang tải thông tin ưu đãi..." />
            </div>
          )}
          
          {/* Content */}
          {!loadingDetail && selectedOffer && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white dark:bg-slate-800 transition-colors duration-300 space-y-4">
              {/* Thông tin ưu đãi - Có thể sửa */}
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 border border-gray-200 dark:border-slate-600">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-base sm:text-lg text-gray-700 dark:text-gray-300">
                    Thông tin ưu đãi
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
                    {offersConfig.fieldsForModal.filter(field => field.name !== 'image_url').map((field) => {
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
                    <div><span className="font-medium text-gray-700 dark:text-gray-300">Tên:</span> <span className="text-gray-900 dark:text-gray-100">{selectedOffer.name || '-'}</span></div>
                    <div><span className="font-medium text-gray-700 dark:text-gray-300">Dịch vụ:</span> <span className="text-gray-900 dark:text-gray-100">{selectedOffer.service_name || (selectedOffer.service_id ? `ID: ${selectedOffer.service_id}` : '-')}</span></div>
                    {selectedOffer.content && (
                      <div className="sm:col-span-2"><span className="font-medium text-gray-700 dark:text-gray-300">Nội dung:</span> <span className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{selectedOffer.content}</span></div>
                    )}
                  </div>
                )}
              </div>

              {/* Hình ảnh - Có thể thêm/xóa/xem/đặt ảnh chính */}
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 border border-gray-200 dark:border-slate-600">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-base sm:text-lg text-gray-700 dark:text-gray-300">
                    Hình ảnh ưu đãi ({offerImages.length})
                  </h4>
                  <button
                    onClick={() => setShowImageUploader(!showImageUploader)}
                    className="btn-gradient-primary flex items-center gap-1 px-3 py-1.5 text-sm font-medium"
                  >
                    <Plus size={16} />
                    {showImageUploader ? 'Đóng' : 'Thêm ảnh'}
                  </button>
                </div>

                {/* Image Uploader */}
                {showImageUploader && (
                  <div className="mb-4 p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600">
                    <ImageUploader 
                      onUploadSuccess={handleImageUpload}
                      multiple={true}
                      maxFiles={10}
                      uploadMode="both"
                      allowFileUpload={true}
                      allowLinkUpload={true}
                    />
                  </div>
                )}

                {/* Image Grid */}
                <ImageGrid
                  images={offerImages}
                  onDelete={handleDeleteImage}
                  onSetPrimary={handleSetPrimary}
                  emptyTitle="Chưa có hình ảnh"
                  emptyDescription="Ưu đãi này chưa có hình ảnh nào"
                />
              </div>
            </div>
          )}

          {/* Footer */}
          {!loadingDetail && selectedOffer && (
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
                      onClick={handleSaveOffer}
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


