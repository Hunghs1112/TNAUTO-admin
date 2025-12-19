// src/components/features/ProductDetailModal.jsx
import React, { useState, useEffect } from 'react';
import { productsAPI, categoriesAPI } from '../../services/api';
import { isValidImageUrl, normalizeImageUrl } from '../../utils/format';
import LoadingSpinner from '../ui/LoadingSpinner';
import ImageUploader from '../image/ImageUploader';
import ImageGrid from '../image/ImageGrid';
import FormField from '../form/FormField';
import ProductVideo from '../video/ProductVideo';
import { useLoadingKey } from '../../contexts/LoadingContext';
import { useToast } from '../../contexts/ToastContext';
import { productsConfig } from '../../config/entityConfigs';
import { Plus, X, Edit2, Save, XCircle } from 'lucide-react';

/**
 * Product Detail Modal Component
 * Form chi tiết riêng cho sản phẩm với quản lý ảnh tích hợp
 */
export default function ProductDetailModal({
  isOpen,
  productId,
  onClose,
  onRefresh
}) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productImages, setProductImages] = useState([]);
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [fieldOptions, setFieldOptions] = useState({});
  const [loadingOptions, setLoadingOptions] = useState(false);

  const { startLoading: startDetailLoading, stopLoading: stopDetailLoading, loading: loadingDetail } = useLoadingKey('product-detail', 'Đang tải chi tiết...');
  const { success, error } = useToast();

  useEffect(() => {
    if (isOpen && productId) {
      fetchProductDetails(productId);
    } else {
      // Reset state when modal closes
      setSelectedProduct(null);
      setProductImages([]);
      setShowImageUploader(false);
      setIsEditMode(false);
      setFormData({});
    }
  }, [isOpen, productId]);

  // Load dynamic options for select fields
  useEffect(() => {
    const loadDynamicOptions = async () => {
      const fieldsWithApi = productsConfig.fieldsForModal.filter(f => f.type === 'select' && f.apiEndpoint);
      if (fieldsWithApi.length === 0) return;

      setLoadingOptions(true);
      try {
        const optionsData = {};
        
        await Promise.all(fieldsWithApi.map(async (field) => {
          try {
            let response;
            // Load from correct API based on endpoint
            if (field.apiEndpoint === '/categories') {
              response = await categoriesAPI.getAll();
            } else {
              response = await productsAPI.getAll();
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

  // Update form data when product is loaded or edit mode changes
  useEffect(() => {
    if (selectedProduct && isEditMode) {
      setFormData({
        name: selectedProduct.name || '',
        price: selectedProduct.price || '',
        category_id: selectedProduct.category_id || '',
        description: selectedProduct.description || ''
      });
    }
  }, [selectedProduct, isEditMode]);

  const fetchProductDetails = async (id) => {
    startDetailLoading('Đang tải chi tiết sản phẩm...');
    try {
      const productRes = await productsAPI.getById(id);
      const productData = productRes.data.data || productRes.data;
      setSelectedProduct(productData || null);

      // Fetch images
      const imagesRes = await productsAPI.getImages(id);
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
      setProductImages(validImages);
    } catch (err) {
      console.error('Fetch product details/images error:', err);
      error('Không thể tải chi tiết sản phẩm: ' + (err.response?.data?.message || err.message));
      setSelectedProduct(null);
      setProductImages([]);
      onClose();
    } finally {
      stopDetailLoading();
    }
  };

  const handleImageUpload = async (imageUrls) => {
    if (!selectedProduct) {
      error('Vui lòng chọn sản phẩm');
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
      let isFirstImage = productImages.length === 0;
      
      for (const imageUrl of validUrls) {
        const imageData = {
          product_id: parseInt(selectedProduct.id),
          image_url: imageUrl,
          is_primary: isFirstImage && !firstImageUrl ? 1 : 0 // Đặt ảnh đầu tiên làm ảnh chính
        };
        
        const createdImage = await productsAPI.createImage(imageData);
        
        // Lưu URL ảnh đầu tiên để cập nhật product.image_url
        if (!firstImageUrl) {
          firstImageUrl = imageUrl;
        }
      }
      
      // Nếu đây là ảnh đầu tiên hoặc sản phẩm chưa có image_url, cập nhật product.image_url
      if (isFirstImage && firstImageUrl) {
        try {
          await productsAPI.update(selectedProduct.id, {
            image_url: firstImageUrl
          });
          console.log('Updated product image_url to:', firstImageUrl);
        } catch (updateErr) {
          console.error('Error updating product image_url:', updateErr);
          // Không throw error vì ảnh đã được tạo thành công
        }
      }
      
      success(`Thêm thành công ${validUrls.length} ảnh!`);
      
      // Refresh danh sách ảnh và thông tin sản phẩm
      await fetchProductDetails(selectedProduct.id);
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
      const deletedImage = productImages.find(img => img.id === imageId);
      const isPrimary = deletedImage && deletedImage.is_primary === 1;
      
      await productsAPI.deleteImage(imageId);
      
      // Nếu xóa ảnh chính và còn ảnh khác, đặt ảnh đầu tiên làm ảnh chính
      if (isPrimary && productImages.length > 1) {
        const remainingImages = productImages.filter(img => img.id !== imageId);
        if (remainingImages.length > 0) {
          const newPrimaryImage = remainingImages[0];
          try {
            // Đặt ảnh đầu tiên làm ảnh chính
            await productsAPI.updateImage(newPrimaryImage.id, { is_primary: 1 });
            
            // Cập nhật product.image_url
            await productsAPI.update(selectedProduct.id, {
              image_url: newPrimaryImage.image_url
            });
            console.log('Updated product image_url to new primary:', newPrimaryImage.image_url);
          } catch (updateErr) {
            console.error('Error updating primary image after delete:', updateErr);
            // Không throw error vì ảnh đã được xóa thành công
          }
        }
      } else if (isPrimary && productImages.length === 1) {
        // Nếu xóa ảnh chính và không còn ảnh nào, xóa image_url của product
        try {
          await productsAPI.update(selectedProduct.id, {
            image_url: null
          });
          console.log('Cleared product image_url (no images left)');
        } catch (updateErr) {
          console.error('Error clearing product image_url:', updateErr);
        }
      }
      
      success('Xóa ảnh thành công!');
      
      // Refresh danh sách ảnh
      if (selectedProduct) {
        await fetchProductDetails(selectedProduct.id);
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
    if (!selectedProduct) return;

    try {
      startDetailLoading('Đang đặt làm ảnh chính...');
      
      // Tìm ảnh được chọn làm ảnh chính
      const primaryImage = productImages.find(img => img.id === imageId);
      if (!primaryImage) {
        error('Không tìm thấy ảnh');
        return;
      }
      
      // Update primary image
      await productsAPI.updateImage(imageId, { is_primary: 1 });
      
      // Update other images to remove primary
      const otherImages = productImages.filter(img => img.id !== imageId && img.is_primary === 1);
      for (const img of otherImages) {
        await productsAPI.updateImage(img.id, { is_primary: 0 });
      }
      
      // Cập nhật product.image_url với URL của ảnh chính
      try {
        await productsAPI.update(selectedProduct.id, {
          image_url: primaryImage.image_url
        });
        console.log('Updated product image_url to primary image:', primaryImage.image_url);
      } catch (updateErr) {
        console.error('Error updating product image_url:', updateErr);
        // Không throw error vì ảnh chính đã được đặt thành công
      }
      
      success('Đặt ảnh chính thành công!');
      await fetchProductDetails(selectedProduct.id);
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
    // Reset form data to original product data
    if (selectedProduct) {
      setFormData({
        name: selectedProduct.name || '',
        price: selectedProduct.price || '',
        category_id: selectedProduct.category_id || '',
        description: selectedProduct.description || '',
        video_url: selectedProduct.video_url || ''
      });
    }
  };

  const handleSaveProduct = async () => {
    if (!selectedProduct) return;

    try {
      startDetailLoading('Đang lưu thông tin sản phẩm...');
      
      // Check if category_id changed
      const categoryChanged = selectedProduct.category_id !== formData.category_id;
      
      // Gửi video_url như người dùng nhập (backend sẽ validate)
      // Backend cần hỗ trợ TikTok URLs với query params
      await productsAPI.update(selectedProduct.id, formData);
      success('Cập nhật sản phẩm thành công!');
      
      // Refresh product data
      await fetchProductDetails(selectedProduct.id);
      setIsEditMode(false);
      onRefresh && onRefresh();
      
      // If category changed, notify Categories page to refresh
      if (categoryChanged) {
        console.log('[ProductDetailModal] Category changed, dispatching productCategoryChanged event');
        // Store timestamp in sessionStorage for late listeners
        sessionStorage.setItem('productCategoryChanged', Date.now().toString());
        window.dispatchEvent(new CustomEvent('productCategoryChanged'));
      }
    } catch (err) {
      console.error('Update product error:', err);
      error('Có lỗi xảy ra khi cập nhật sản phẩm: ' + (err.response?.data?.message || err.message));
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
      {/* Product Detail Modal */}
      <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 animate-fade-in">
        <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-5xl max-h-[95vh] flex flex-col shadow-2xl border border-gray-200/50 dark:border-slate-700/50 animate-fade-in">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-slate-700 flex-shrink-0 gradient-header transition-colors duration-300">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 transition-colors duration-300">
                  {selectedProduct ? `Chi tiết sản phẩm #${selectedProduct.id}` : 'Đang tải...'}
                </h3>
                {selectedProduct && (
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {selectedProduct.name}
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
              <LoadingSpinner size="lg" message="Đang tải thông tin sản phẩm..." />
            </div>
          )}
          
          {/* Content */}
          {!loadingDetail && selectedProduct && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white dark:bg-slate-800 transition-colors duration-300 space-y-4">
              {/* Thông tin sản phẩm - Có thể sửa */}
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 border border-gray-200 dark:border-slate-600">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-base sm:text-lg text-gray-700 dark:text-gray-300">
                    Thông tin sản phẩm
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
                    {productsConfig.fieldsForModal.filter(field => field.name !== 'video_url').map((field) => {
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
                    <div><span className="font-medium text-gray-700 dark:text-gray-300">Tên:</span> <span className="text-gray-900 dark:text-gray-100">{selectedProduct.name || '-'}</span></div>
                    <div><span className="font-medium text-gray-700 dark:text-gray-300">Giá:</span> <span className="text-gray-900 dark:text-gray-100">{selectedProduct.price ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedProduct.price) : '-'}</span></div>
                    <div><span className="font-medium text-gray-700 dark:text-gray-300">Danh mục:</span> <span className="text-gray-900 dark:text-gray-100">{selectedProduct.category_name || '-'}</span></div>
                    {selectedProduct.description && (
                      <div className="sm:col-span-2"><span className="font-medium text-gray-700 dark:text-gray-300">Mô tả:</span> <span className="text-gray-900 dark:text-gray-100">{selectedProduct.description}</span></div>
                    )}
                  </div>
                )}
              </div>

              {/* Video sản phẩm - Section riêng */}
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 border border-gray-200 dark:border-slate-600">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-base sm:text-lg text-gray-700 dark:text-gray-300">
                    Video sản phẩm
                  </h4>
                  {!isEditMode && (
                    <button
                      onClick={handleEdit}
                      className="btn-gradient-primary flex items-center gap-2 px-3 py-1.5 text-sm font-medium"
                    >
                      <Edit2 size={16} />
                      {selectedProduct.video_url ? 'Sửa' : 'Thêm'}
                    </button>
                  )}
                </div>

                {isEditMode ? (
                  // Form sửa video
                  <div className="space-y-3">
                    <FormField
                      name="video_url"
                      label="Video URL"
                      type="text"
                      value={formData.video_url || ''}
                      onChange={(e) => {
                        const value = e.target ? e.target.value : e.value || e;
                        handleFormChange('video_url', value);
                      }}
                      placeholder="https://www.youtube.com/watch?v=xxxxx hoặc https://youtu.be/xxxxx"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      <strong>Hỗ trợ:</strong> YouTube, Vimeo, TikTok, Facebook, Instagram, hoặc direct video URL (.mp4, .webm, .ogg, .mov). Để trống để xóa video.
                    </p>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 space-y-0.5">
                      <div>• YouTube: youtube.com/watch?v=... hoặc youtu.be/...</div>
                      <div>• Vimeo: vimeo.com/...</div>
                      <div>• TikTok: tiktok.com/@username/video/...</div>
                      <div>• Facebook: facebook.com/... hoặc fb.watch/...</div>
                      <div>• Instagram: instagram.com/p/... hoặc instagram.com/reel/...</div>
                    </div>
                    {formData.video_url && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Preview:</p>
                        <ProductVideo videoUrl={formData.video_url} />
                      </div>
                    )}
                  </div>
                ) : (
                  // Chế độ xem
                  selectedProduct.video_url ? (
                    <ProductVideo videoUrl={selectedProduct.video_url} />
                  ) : (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                      Chưa có video nào
                    </div>
                  )
                )}
              </div>

              {/* Hình ảnh - Có thể thêm/xóa/xem/đặt ảnh chính */}
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 border border-gray-200 dark:border-slate-600">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-base sm:text-lg text-gray-700 dark:text-gray-300">
                    Hình ảnh sản phẩm ({productImages.length})
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
                  images={productImages}
                  onDelete={handleDeleteImage}
                  onSetPrimary={handleSetPrimary}
                  emptyTitle="Chưa có hình ảnh"
                  emptyDescription="Sản phẩm này chưa có hình ảnh nào"
                />
              </div>
            </div>
          )}

          {/* Footer */}
          {!loadingDetail && selectedProduct && (
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
                      onClick={handleSaveProduct}
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

