import { useEffect, useRef, useState } from 'react';
import { productsAPI, categoriesAPI } from '../services/api';
import { isValidImageUrl, normalizeImageUrl } from '../utils/format';
import { productsConfig } from '../config/entityConfigs';
import useDetailFetchGuard from './useDetailFetchGuard';

// Cache categories ở module level — chỉ fetch 1 lần trong suốt session
let categoriesCache = null;
let categoriesFetchPromise = null;

function getCategoriesCached() {
  if (categoriesCache) return Promise.resolve(categoriesCache);
  if (categoriesFetchPromise) return categoriesFetchPromise;
  categoriesFetchPromise = categoriesAPI.getAll().then((res) => {
    categoriesCache = res;
    categoriesFetchPromise = null;
    return res;
  }).catch((err) => {
    categoriesFetchPromise = null;
    throw err;
  });
  return categoriesFetchPromise;
}

export default function useProductDetailModal({ isOpen, productId, onClose, onRefresh, showSuccess, showError, startLoading, stopLoading }) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productImages, setProductImages] = useState([]);
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [fieldOptions, setFieldOptions] = useState({});
  const [loadingOptions, setLoadingOptions] = useState(false);
  const optionsLoadedRef = useRef(false);
  const { shouldSkipFetch, beginFetch, completeFetch, failFetch, resetFetchGuard } = useDetailFetchGuard();

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
    const loadDynamicOptions = async () => {
      // Đã load rồi thì bỏ qua — dùng cache module-level cho categories
      if (optionsLoadedRef.current) return;

      const fieldsWithApi = productsConfig.fieldsForModal.filter((f) => f.type === 'select' && f.apiEndpoint);
      if (fieldsWithApi.length === 0) return;

      setLoadingOptions(true);
      try {
        const optionsData = {};

        await Promise.all(
          fieldsWithApi.map(async (field) => {
            try {
              let response;
              if (field.apiEndpoint === '/categories') {
                response = await getCategoriesCached();
              } else {
                response = await productsAPI.getAll();
              }

              const raw = response.data;

              let dataArray = [];
              if (Array.isArray(raw?.data)) {
                dataArray = raw.data;
              } else if (Array.isArray(raw)) {
                dataArray = raw;
              } else if (Array.isArray(raw?.data?.data)) {
                dataArray = raw.data.data;
              }

              optionsData[field.name] = dataArray.map((item) => ({
                value: item[field.valueKey || 'id'],
                label: field.labelFormat ? field.labelFormat(item) : item[field.labelKey || 'name'],
              }));
            } catch (err) {
              console.error(`Error loading options for ${field.name}:`, err);
              optionsData[field.name] = [];
            }
          })
        );

        setFieldOptions(optionsData);
        optionsLoadedRef.current = true;
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

  useEffect(() => {
    if (selectedProduct && isEditMode) {
      setFormData({
        name: selectedProduct.name || '',
        price: selectedProduct.price || '',
        category_id: selectedProduct.category_id || '',
        description: selectedProduct.description || '',
        video_url: selectedProduct.video_url || '',
      });
    }
  }, [selectedProduct, isEditMode]);

  const fetchProductDetails = async (id, { force = false } = {}) => {
    if (shouldSkipFetch(id, force)) return;

    beginFetch();
    startLoading('Đang tải chi tiết sản phẩm...');
    try {
      // Fetch product details và images song song, tránh N+1
      const [productRes, imagesRes] = await Promise.all([
        productsAPI.getById(id),
        productsAPI.getImages(id),
      ]);

      const productData = productRes.data.data || productRes.data;
      setSelectedProduct(productData || null);

      const imagesData = imagesRes.data.data || imagesRes.data;
      const validImages = Array.isArray(imagesData)
        ? imagesData
            .filter((img) => img.image_url && isValidImageUrl(img.image_url))
            .map((img) => {
              const normalizedUrl = normalizeImageUrl(img.image_url);
              return {
                ...img,
                image_url: normalizedUrl || img.image_url,
              };
            })
            .filter((img) => img.image_url)
        : [];
      setProductImages(validImages);
      completeFetch(id);
    } catch (err) {
      console.error('Fetch product details/images error:', err);
      showError('Không thể tải chi tiết sản phẩm: ' + (err.response?.data?.message || err.message));
      setSelectedProduct(null);
      setProductImages([]);
      failFetch();
      onClose();
    } finally {
      stopLoading();
    }
  };

  const handleImageUpload = async (imageUrls) => {
    if (!selectedProduct) {
      showError('Vui lòng chọn sản phẩm');
      return;
    }

    try {
      startLoading('Đang tải ảnh lên...');
      const urls = Array.isArray(imageUrls) ? imageUrls : [imageUrls];
      const validUrls = urls.filter((url) => !url.startsWith('data:image/'));

      if (validUrls.length === 0) {
        showError('Không có ảnh hợp lệ để tải lên');
        return;
      }

      let firstImageUrl = null;
      const isFirstImage = productImages.length === 0;

      for (const imageUrl of validUrls) {
        const imageData = {
          product_id: parseInt(selectedProduct.id, 10),
          image_url: imageUrl,
          is_primary: isFirstImage && !firstImageUrl ? 1 : 0,
        };

        await productsAPI.createImage(imageData);

        if (!firstImageUrl) {
          firstImageUrl = imageUrl;
        }
      }

      if (isFirstImage && firstImageUrl) {
        try {
          await productsAPI.update(selectedProduct.id, {
            image_url: firstImageUrl,
          });
        } catch (updateErr) {
          console.error('Error updating product image_url:', updateErr);
        }
      }

      showSuccess(`Thêm thành công ${validUrls.length} ảnh!`);

      await fetchProductDetails(selectedProduct.id, { force: true });
      setShowImageUploader(false);
      onRefresh?.();
    } catch (err) {
      console.error('Create image record error:', err);
      showError('Lỗi khi lưu thông tin ảnh: ' + (err.response?.data?.message || err.message));
    } finally {
      stopLoading();
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm('Xóa hình ảnh này?')) return;

    try {
      startLoading('Đang xóa ảnh...');

      const deletedImage = productImages.find((img) => img.id === imageId);
      const isPrimary = deletedImage && deletedImage.is_primary === 1;

      await productsAPI.deleteImage(imageId);

      if (isPrimary && productImages.length > 1) {
        const remainingImages = productImages.filter((img) => img.id !== imageId);
        if (remainingImages.length > 0) {
          const newPrimaryImage = remainingImages[0];
          try {
            await productsAPI.updateImage(newPrimaryImage.id, { is_primary: 1 });

            await productsAPI.update(selectedProduct.id, {
              image_url: newPrimaryImage.image_url,
            });
          } catch (updateErr) {
            console.error('Error updating primary image after delete:', updateErr);
          }
        }
      } else if (isPrimary && productImages.length === 1) {
        try {
          await productsAPI.update(selectedProduct.id, {
            image_url: null,
          });
        } catch (updateErr) {
          console.error('Error clearing product image_url:', updateErr);
        }
      }

      showSuccess('Xóa ảnh thành công!');

      if (selectedProduct) {
        await fetchProductDetails(selectedProduct.id, { force: true });
      }
      onRefresh?.();
    } catch (err) {
      console.error('Delete image error:', err);
      showError('Lỗi khi xóa ảnh');
    } finally {
      stopLoading();
    }
  };

  const handleSetPrimary = async (imageId) => {
    if (!selectedProduct) return;

    try {
      startLoading('Đang đặt làm ảnh chính...');

      const primaryImage = productImages.find((img) => img.id === imageId);
      if (!primaryImage) {
        showError('Không tìm thấy ảnh');
        return;
      }

      await productsAPI.updateImage(imageId, { is_primary: 1 });

      const otherImages = productImages.filter((img) => img.id !== imageId && img.is_primary === 1);
      for (const img of otherImages) {
        await productsAPI.updateImage(img.id, { is_primary: 0 });
      }

      try {
        await productsAPI.update(selectedProduct.id, {
          image_url: primaryImage.image_url,
        });
      } catch (updateErr) {
        console.error('Error updating product image_url:', updateErr);
      }

      showSuccess('Đặt ảnh chính thành công!');
      await fetchProductDetails(selectedProduct.id, { force: true });
      onRefresh?.();
    } catch (err) {
      console.error('Set primary image error:', err);
      showError('Có lỗi xảy ra khi đặt ảnh chính: ' + (err.response?.data?.message || err.message));
    } finally {
      stopLoading();
    }
  };

  const handleEdit = () => {
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    if (selectedProduct) {
      setFormData({
        name: selectedProduct.name || '',
        price: selectedProduct.price || '',
        category_id: selectedProduct.category_id || '',
        description: selectedProduct.description || '',
        video_url: selectedProduct.video_url || '',
      });
    }
  };

  const handleSaveProduct = async () => {
    if (!selectedProduct) return;

    try {
      startLoading('Đang lưu thông tin sản phẩm...');

      const categoryChanged = selectedProduct.category_id !== formData.category_id;

      await productsAPI.update(selectedProduct.id, formData);
      showSuccess('Cập nhật sản phẩm thành công!');

      await fetchProductDetails(selectedProduct.id, { force: true });
      setIsEditMode(false);
      onRefresh?.();

      if (categoryChanged) {
        sessionStorage.setItem('productCategoryChanged', Date.now().toString());
        window.dispatchEvent(new CustomEvent('productCategoryChanged'));
      }
    } catch (err) {
      console.error('Update product error:', err);
      showError('Có lỗi xảy ra khi cập nhật sản phẩm: ' + (err.response?.data?.message || err.message));
    } finally {
      stopLoading();
    }
  };

  const handleFormChange = (fieldName, value) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  };

  return {
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
  };
}
