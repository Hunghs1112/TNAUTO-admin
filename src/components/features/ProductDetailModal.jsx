// src/components/features/ProductDetailModal.jsx
import React from 'react';
import { Plus, X, Edit2, Save, XCircle } from 'lucide-react';
import LoadingSpinner from '../ui/LoadingSpinner';
import ImageUploader from '../image/ImageUploader';
import ImageGrid from '../image/ImageGrid';
import FormField from '../form/FormField';
import { useLoadingKey } from '../../contexts/LoadingContext';
import { useToast } from '../../contexts/ToastContext';
import { productsConfig } from '../../config/entityConfigs';
import useProductDetailModal from '../../hooks/useProductDetailModal';

/**
 * Product Detail Modal Component
 * Form chi tiết riêng cho sản phẩm với quản lý ảnh tích hợp
 */
export default function ProductDetailModal({ isOpen, productId, onClose, onRefresh }) {
  const { startLoading: startDetailLoading, stopLoading: stopDetailLoading, loading: loadingDetail } = useLoadingKey(
    'product-detail',
    'Đang tải chi tiết...'
  );
  const { success, error } = useToast();

  const {
    selectedProduct,
    productImages,
    showImageUploader,
    setShowImageUploader,
    isEditMode,
    formData,
    fieldOptions,
    loadingOptions,
    handleImageUpload,
    handleDeleteImage,
    handleSetPrimary,
    handleEdit,
    handleCancelEdit,
    handleSaveProduct,
    handleFormChange,
  } = useProductDetailModal({
    isOpen,
    productId,
    onClose,
    onRefresh,
    showSuccess: success,
    showError: error,
    startLoading: startDetailLoading,
    stopLoading: stopDetailLoading,
  });

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 backdrop-blur-sm sm:p-4 animate-fade-in">
        <div className="animate-fade-in flex max-h-[95vh] w-full max-w-5xl flex-col rounded-xl border border-slate-700/50 bg-slate-800 shadow-2xl">
          <div className="gradient-header border-b border-slate-700 p-4 transition-colors duration-300 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-100 transition-colors duration-300 sm:text-xl">
                  {selectedProduct ? `Chi tiết sản phẩm #${selectedProduct.id}` : 'Đang tải...'}
                </h3>
                {selectedProduct && <p className="mt-1 text-sm text-slate-400">{selectedProduct.name}</p>}
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-slate-500 transition-all duration-200 hover:bg-slate-700 hover:text-slate-200 active:scale-95"
                aria-label="Đóng"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {loadingDetail && (
            <div className="flex flex-1 items-center justify-center p-8">
              <LoadingSpinner size="lg" message="Đang tải thông tin sản phẩm..." />
            </div>
          )}

          {!loadingDetail && selectedProduct && (
            <div className="flex-1 space-y-4 overflow-y-auto bg-slate-800 p-4 transition-colors duration-300 sm:p-6">
              <div className="rounded-xl border border-slate-600 bg-slate-700/50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-base font-semibold text-slate-300 sm:text-lg">Thông tin sản phẩm</h4>
                  {!isEditMode && (
                    <button onClick={handleEdit} className="btn-gradient-primary flex items-center gap-2 px-3 py-1.5 text-sm font-medium">
                      <Edit2 size={16} />
                      Sửa
                    </button>
                  )}
                </div>

                {isEditMode ? (
                  <div className="space-y-4">
                    {productsConfig.fieldsForModal.map((field) => {
                        const options = field.apiEndpoint && fieldOptions[field.name] ? fieldOptions[field.name] : field.options || [];

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
                  <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <span className="font-medium text-slate-300">Tên:</span>{' '}
                      <span className="text-slate-100">{selectedProduct.name || '-'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-slate-300">Giá:</span>{' '}
                      <span className="text-slate-100">
                        {selectedProduct.price
                          ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedProduct.price)
                          : '-'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-slate-300">Danh mục:</span>{' '}
                      <span className="text-slate-100">{selectedProduct.category_name || '-'}</span>
                    </div>
                    {selectedProduct.description && (
                      <div className="sm:col-span-2">
                        <span className="font-medium text-slate-300">Mô tả:</span>{' '}
                        <span className="text-slate-100">{selectedProduct.description}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-slate-600 bg-slate-700/50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-base font-semibold text-slate-300 sm:text-lg">Hình ảnh sản phẩm ({productImages.length})</h4>
                  <button
                    onClick={() => setShowImageUploader(!showImageUploader)}
                    className="btn-gradient-primary flex items-center gap-1 px-3 py-1.5 text-sm font-medium"
                  >
                    <Plus size={16} />
                    {showImageUploader ? 'Đóng' : 'Thêm ảnh'}
                  </button>
                </div>

                {showImageUploader && (
                  <div className="mb-4 rounded-lg border border-slate-600 bg-slate-800 p-3">
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

          {!loadingDetail && selectedProduct && (
            <div className="flex-shrink-0 border-t border-slate-700 bg-slate-800 p-4 sm:p-6">
              <div className="flex flex-col justify-end gap-2 sm:flex-row">
                {isEditMode ? (
                  <>
                    <button
                      onClick={handleCancelEdit}
                      className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-200 shadow-sm transition-all duration-200 hover:bg-slate-700 hover:shadow-md active:scale-[0.98]"
                    >
                      <XCircle size={16} />
                      Hủy
                    </button>
                    <button
                      onClick={handleSaveProduct}
                      disabled={loadingDetail}
                      className="btn-gradient-primary flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Save size={16} />
                      Lưu
                    </button>
                  </>
                ) : (
                  <button
                    onClick={onClose}
                    className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-200 shadow-sm transition-all duration-200 hover:bg-slate-700 hover:shadow-md active:scale-[0.98]"
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
