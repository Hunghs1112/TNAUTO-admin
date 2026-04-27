import React, { useEffect, useState } from 'react';
import { Edit2, Plus, Save, X, XCircle } from 'lucide-react';
import { dealerCategoriesAPI, dealerProductsAPI } from '../../services/api';
import { isValidImageUrl, normalizeImageUrl } from '../../utils/format';
import LoadingSpinner from '../ui/LoadingSpinner';
import ImageUploader from '../image/ImageUploader';
import ImageGrid from '../image/ImageGrid';
import FormField from '../form/FormField';
import { useLoadingKey } from '../../contexts/LoadingContext';
import { useToast } from '../../contexts/ToastContext';
import { dealerProductsConfig } from '../../config/entityConfigs';
import useDetailFetchGuard from '../../hooks/useDetailFetchGuard';

function normalizeArrayResponse(response) {
 const raw = response?.data;
 if (Array.isArray(raw?.data)) return raw.data;
 if (Array.isArray(raw)) return raw;
 if (Array.isArray(raw?.data?.data)) return raw.data.data;
 return [];
}

export default function DealerProductDetailModal({
 isOpen,
 productId,
 onClose,
 onRefresh,
}) {
 const [selectedProduct, setSelectedProduct] = useState(null);
 const [productImages, setProductImages] = useState([]);
 const [showImageUploader, setShowImageUploader] = useState(false);
 const [isEditMode, setIsEditMode] = useState(false);
 const [formData, setFormData] = useState({});
 const [fieldOptions, setFieldOptions] = useState({});
 const [loadingOptions, setLoadingOptions] = useState(false);
 const { shouldSkipFetch, beginFetch, completeFetch, failFetch, resetFetchGuard } = useDetailFetchGuard();

 const {
  startLoading: startDetailLoading,
  stopLoading: stopDetailLoading,
  loading: loadingDetail,
 } = useLoadingKey('dealer-product-detail', 'Äang táº£i chi tiáº¿t sáº£n pháº©m dealer...');
 const { success, error } = useToast();

 useEffect(() => {
  if (isOpen && productId) {
   fetchProductDetails(productId);
  } else {
   setSelectedProduct(null);
   setProductImages([]);
   setShowImageUploader(false);
   setIsEditMode(false);
   setFormData({});
   resetFetchGuard();
  }
 }, [isOpen, productId]);

 useEffect(() => {
  const loadCategoryOptions = async () => {
   setLoadingOptions(true);
   try {
    const response = await dealerCategoriesAPI.getAll();
    const categories = normalizeArrayResponse(response);

    setFieldOptions({
     category_id: categories.map((item) => ({
      value: item.id,
      label: item.name,
     })),
    });
   } catch (err) {
    console.error('Error loading dealer category options:', err);
    setFieldOptions({ category_id: [] });
   } finally {
    setLoadingOptions(false);
   }
  };

  if (isOpen) {
   loadCategoryOptions();
  }
 }, [isOpen]);

 useEffect(() => {
  if (selectedProduct && isEditMode) {
   setFormData({
    name: selectedProduct.name || '',
    price: selectedProduct.price ?? '',
    category_id: selectedProduct.category_id || '',
    description: selectedProduct.description || '',
    video_url: selectedProduct.video_url || '',
   });
  }
 }, [selectedProduct, isEditMode]);

 const fetchProductDetails = async (id, { force = false } = {}) => {
  if (shouldSkipFetch(id, force)) return;

  beginFetch();
  startDetailLoading('Äang táº£i chi tiáº¿t sáº£n pháº©m dealer...');
  try {
   const productRes = await dealerProductsAPI.getById(id);
   const productData = productRes.data?.data || productRes.data;
   setSelectedProduct(productData || null);

   const imagesRes = await dealerProductsAPI.getImages(id);
   const imagesData = normalizeArrayResponse(imagesRes);
   const validImages = Array.isArray(imagesData)
    ? imagesData
      .filter((img) => img.image_url && isValidImageUrl(img.image_url))
      .map((img) => ({
       ...img,
       image_url: normalizeImageUrl(img.image_url) || img.image_url,
      }))
      .filter((img) => img.image_url)
    : [];

   setProductImages(validImages);
   completeFetch(id);
  } catch (err) {
   console.error('Fetch dealer product details/images error:', err);
   error('KhÃ´ng thá»ƒ táº£i chi tiáº¿t sáº£n pháº©m dealer: ' + err.message);
   setSelectedProduct(null);
   setProductImages([]);
   failFetch();
   onClose();
  } finally {
   stopDetailLoading();
  }
 };

 const handleImageUpload = async (imageUrls) => {
  if (!selectedProduct) {
   error('Vui lÃ²ng chá»n sáº£n pháº©m dealer');
   return;
  }

  try {
   startDetailLoading('Äang táº£i áº£nh lÃªn...');
   const urls = Array.isArray(imageUrls) ? imageUrls : [imageUrls];
   const validUrls = urls.filter((url) => !url.startsWith('data:image/'));

   if (validUrls.length === 0) {
    error('KhÃ´ng cÃ³ áº£nh há»£p lá»‡ Ä‘á»ƒ táº£i lÃªn');
    return;
   }

   let firstImageUrl = null;
   const isFirstImage = productImages.length === 0;

   for (const imageUrl of validUrls) {
    await dealerProductsAPI.createImage({
     product_id: Number(selectedProduct.id),
     image_url: imageUrl,
     is_primary: isFirstImage && !firstImageUrl ? 1 : 0,
    });

    if (!firstImageUrl) {
     firstImageUrl = imageUrl;
    }
   }

   if (isFirstImage && firstImageUrl) {
    try {
     await dealerProductsAPI.update(selectedProduct.id, {
      image_url: firstImageUrl,
     });
    } catch (updateErr) {
     console.error('Error updating dealer product image_url:', updateErr);
    }
   }

   success(`ThÃªm thÃ nh cÃ´ng ${validUrls.length} áº£nh!`);
   await fetchProductDetails(selectedProduct.id, { force: true });
   setShowImageUploader(false);
   onRefresh && onRefresh();
  } catch (err) {
   console.error('Create dealer image record error:', err);
   error('Lá»—i khi lÆ°u thÃ´ng tin áº£nh: ' + err.message);
  } finally {
   stopDetailLoading();
  }
 };

 const handleDeleteImage = async (imageId) => {
  if (!window.confirm('XÃ³a hÃ¬nh áº£nh nÃ y?')) return;

  try {
   startDetailLoading('Äang xÃ³a áº£nh...');
   const deletedImage = productImages.find((img) => img.id === imageId);
   const isPrimary = deletedImage && Number(deletedImage.is_primary) === 1;

   await dealerProductsAPI.deleteImage(imageId);

   if (isPrimary && productImages.length > 1) {
    const remainingImages = productImages.filter((img) => img.id !== imageId);
    if (remainingImages.length > 0) {
     const newPrimaryImage = remainingImages[0];
     try {
      await dealerProductsAPI.updateImage(newPrimaryImage.id, { is_primary: true });
      await dealerProductsAPI.update(selectedProduct.id, {
       image_url: newPrimaryImage.image_url,
      });
     } catch (updateErr) {
      console.error('Error updating dealer primary image after delete:', updateErr);
     }
    }
   } else if (isPrimary && productImages.length === 1) {
    try {
     await dealerProductsAPI.update(selectedProduct.id, { image_url: null });
    } catch (updateErr) {
     console.error('Error clearing dealer product image_url:', updateErr);
    }
   }

   success('XÃ³a áº£nh thÃ nh cÃ´ng!');
   await fetchProductDetails(selectedProduct.id, { force: true });
   onRefresh && onRefresh();
  } catch (err) {
   console.error('Delete dealer image error:', err);
   error('Lá»—i khi xÃ³a áº£nh: ' + err.message);
  } finally {
   stopDetailLoading();
  }
 };

 const handleSetPrimary = async (imageId) => {
  if (!selectedProduct) return;

  try {
   startDetailLoading('Äang Ä‘áº·t lÃ m áº£nh chÃ­nh...');
   const primaryImage = productImages.find((img) => img.id === imageId);

   if (!primaryImage) {
    error('KhÃ´ng tÃ¬m tháº¥y áº£nh');
    return;
   }

   await dealerProductsAPI.updateImage(imageId, { is_primary: true });

   try {
    await dealerProductsAPI.update(selectedProduct.id, {
     image_url: primaryImage.image_url,
    });
   } catch (updateErr) {
    console.error('Error updating dealer product image_url:', updateErr);
   }

   success('Äáº·t áº£nh chÃ­nh thÃ nh cÃ´ng!');
   await fetchProductDetails(selectedProduct.id, { force: true });
   onRefresh && onRefresh();
  } catch (err) {
   console.error('Set dealer primary image error:', err);
   error('CÃ³ lá»—i xáº£y ra khi Ä‘áº·t áº£nh chÃ­nh: ' + err.message);
  } finally {
   stopDetailLoading();
  }
 };

 const handleCancelEdit = () => {
  setIsEditMode(false);
  if (selectedProduct) {
   setFormData({
    name: selectedProduct.name || '',
    price: selectedProduct.price ?? '',
    category_id: selectedProduct.category_id || '',
    description: selectedProduct.description || '',
    video_url: selectedProduct.video_url || '',
   });
  }
 };

 const handleSaveProduct = async () => {
  if (!selectedProduct) return;

  try {
   startDetailLoading('Äang lÆ°u thÃ´ng tin sáº£n pháº©m dealer...');

   await dealerProductsAPI.update(selectedProduct.id, {
    ...formData,
    video_url: formData.video_url?.trim() ? formData.video_url.trim() : null,
   });

   success('Cáº­p nháº­t sáº£n pháº©m dealer thÃ nh cÃ´ng!');
   await fetchProductDetails(selectedProduct.id, { force: true });
   setIsEditMode(false);
   onRefresh && onRefresh();
  } catch (err) {
   console.error('Update dealer product error:', err);
   error('CÃ³ lá»—i xáº£y ra khi cáº­p nháº­t sáº£n pháº©m dealer: ' + err.message);
  } finally {
   stopDetailLoading();
  }
 };

 const handleFormChange = (fieldName, value) => {
  setFormData((prev) => ({
   ...prev,
   [fieldName]: value,
  }));
 };

 if (!isOpen) return null;

 return (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 backdrop-blur-sm sm:p-4">
   <div className="flex max-h-[95vh] w-full max-w-5xl flex-col rounded-xl border border-slate-700/50 bg-slate-800 shadow-2xl ">
    <div className="gradient-header flex flex-shrink-0 items-start justify-between border-b border-slate-700 p-4 transition-colors duration-300 sm:p-6">
     <div>
      <h3 className="text-lg font-bold text-slate-100 transition-colors duration-300 sm:text-xl">
       {selectedProduct ? `Chi tiáº¿t sáº£n pháº©m dealer #${selectedProduct.id}` : 'Äang táº£i...'}
      </h3>
      {selectedProduct && (
       <p className="mt-1 text-sm text-slate-400">{selectedProduct.name}</p>
      )}
     </div>
     <button
      onClick={onClose}
      className="rounded-lg p-2 text-slate-500 transition-all duration-200 hover:bg-slate-700 hover:text-slate-400 hover:bg-slate-700 hover:text-slate-200"
      aria-label="ÄÃ³ng"
     >
      <X size={20} />
     </button>
    </div>

    {loadingDetail && (
     <div className="flex flex-1 items-center justify-center p-8">
      <LoadingSpinner size="lg" message="Äang táº£i thÃ´ng tin sáº£n pháº©m dealer..." />
     </div>
    )}

    {!loadingDetail && selectedProduct && (
     <div className="flex-1 space-y-4 overflow-y-auto bg-slate-800 p-4 transition-colors duration-300 sm:p-6">
      <div className="rounded-xl border border-slate-600 bg-slate-700/50 p-4 ">
       <div className="mb-3 flex items-center justify-between">
        <h4 className="text-base font-semibold text-slate-300 sm:text-lg">
         ThÃ´ng tin sáº£n pháº©m dealer
        </h4>
        {!isEditMode && (
         <button
          onClick={() => setIsEditMode(true)}
          className="btn-gradient-primary flex items-center gap-2 px-3 py-1.5 text-sm font-medium"
         >
          <Edit2 size={16} />
          Sá»­a
         </button>
        )}
       </div>

       {isEditMode ? (
        <div className="space-y-4">
         {dealerProductsConfig.fieldsForModal
          .filter((field) => field.name !== 'video_url')
          .map((field) => {
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
        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
         <div>
          <span className="font-medium text-slate-300">TÃªn:</span>{' '}
          <span className="text-slate-100">{selectedProduct.name || '-'}</span>
         </div>
         <div>
          <span className="font-medium text-slate-300">GiÃ¡:</span>{' '}
          <span className="text-slate-100">
           {selectedProduct.price !== null && selectedProduct.price !== undefined
            ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedProduct.price)
            : '-'}
          </span>
         </div>
         <div>
          <span className="font-medium text-slate-300">Danh má»¥c:</span>{' '}
          <span className="text-slate-100">{selectedProduct.category_name || '-'}</span>
         </div>
         {selectedProduct.description && (
          <div className="sm:col-span-2">
           <span className="font-medium text-slate-300">MÃ´ táº£:</span>{' '}
           <span className="text-slate-100">{selectedProduct.description}</span>
          </div>
         )}
        </div>
       )}
      </div>

      <div className="rounded-xl border border-slate-600 bg-slate-700/50 p-4 ">
       <div className="mb-3 flex items-center justify-between">
        <h4 className="text-base font-semibold text-slate-300 sm:text-lg">
         HÃ¬nh áº£nh sáº£n pháº©m dealer ({productImages.length})
        </h4>
        <button
         onClick={() => setShowImageUploader((prev) => !prev)}
         className="btn-gradient-primary flex items-center gap-1 px-3 py-1.5 text-sm font-medium"
        >
         <Plus size={16} />
         {showImageUploader ? 'ÄÃ³ng' : 'ThÃªm áº£nh'}
        </button>
       </div>

       {showImageUploader && (
        <div className="mb-4 rounded-lg border border-slate-600 bg-slate-800 p-3 ">
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
        emptyTitle="ChÆ°a cÃ³ hÃ¬nh áº£nh"
        emptyDescription="Sáº£n pháº©m dealer nÃ y chÆ°a cÃ³ hÃ¬nh áº£nh nÃ o"
       />
      </div>
     </div>
    )}

    {!loadingDetail && selectedProduct && (
     <div className="flex-shrink-0 border-t border-slate-600 bg-slate-800 p-4 sm:p-6">
      <div className="flex flex-col justify-end gap-2 sm:flex-row">
       {isEditMode ? (
        <>
         <button
          onClick={handleCancelEdit}
          className="flex items-center gap-2 rounded-xl bg-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 shadow-sm transition-all duration-200 hover:bg-slate-600 hover:shadow-md active:scale-[0.98] bg-slate-700 hover:bg-slate-600"
         >
          <XCircle size={16} />
          Há»§y
         </button>
         <button
          onClick={handleSaveProduct}
          disabled={loadingDetail}
          className="btn-gradient-primary flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
         >
          <Save size={16} />
          LÆ°u
         </button>
        </>
       ) : (
        <button
         onClick={onClose}
         className="flex items-center gap-2 rounded-xl bg-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 shadow-sm transition-all duration-200 hover:bg-slate-600 hover:shadow-md active:scale-[0.98] bg-slate-700 hover:bg-slate-600"
        >
         <X size={16} />
         ÄÃ³ng
        </button>
       )}
      </div>
     </div>
    )}
   </div>
  </div>
 );
}
