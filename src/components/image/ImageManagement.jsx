import { useState, useEffect } from 'react';
import { isValidImageUrl, normalizeImageUrl } from '../../utils/format';
import ImageUploader from './ImageUploader';
import { useLoadingKey } from '../../contexts/LoadingContext';
import { useToast } from '../../contexts/ToastContext';
import { Trash2, Image as ImageIcon, Star, ChevronDown } from 'lucide-react';
import { buttonStyles } from '../../styles/colors';

/**
 * ImageManagement Component - Reusable image management for different entities
 * @param {string} entityType - Type of entity: 'product' or 'service-order'
 * @param {Object} entityAPI - API object for fetching entities
 * @param {Object} imageAPI - API object for image CRUD operations
 * @param {boolean} supportsPrimary - Whether entity supports primary image (default: false)
 */
export default function ImageManagement({ 
  entityType, 
  entityAPI, 
  imageAPI,
  supportsPrimary = false 
}) {
  const [entities, setEntities] = useState([]);
  const [selectedEntityId, setSelectedEntityId] = useState('');
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [images, setImages] = useState([]);
  const [showUploader, setShowUploader] = useState(false);
  const [entitiesLoading, setEntitiesLoading] = useState(false);
  const { success, error: showError } = useToast();

  // Labels based on entity type
  const labels = {
    'product': {
      title: 'Quản lý ảnh sản phẩm',
      selectPlaceholder: '-- Chọn sản phẩm --',
      entityName: 'Sản phẩm',
      noImagesText: 'Chưa có hình ảnh nào',
      selectToViewText: 'Chọn sản phẩm để xem ảnh',
      uploadPromptText: 'Tải ảnh mới lên bằng nút "Tải ảnh lên" ở trên',
      getEntityLabel: (entity) => `${entity.name} (Mã: ${entity.id})`,
      getEntityInfo: (entity) => ({
        name: entity.name,
        extra1: { label: 'Giá', value: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(entity.price) },
      })
    },
    'service-order': {
      title: 'Hình ảnh đơn dịch vụ',
      selectPlaceholder: 'Chọn đơn dịch vụ',
      entityName: 'Đơn dịch vụ',
      noImagesText: 'Không có hình ảnh nào',
      selectToViewText: 'Chọn đơn dịch vụ để xem ảnh',
      uploadPromptText: 'Tải ảnh mới lên bằng nút "Tải ảnh lên" ở trên',
      getEntityLabel: (entity) => `Đơn dịch vụ #${entity.id} - ${entity.receiver_name} (${entity.license_plate}) - ${entity.status}`,
      getEntityInfo: (entity) => ({
        name: `Đơn dịch vụ #${entity.id}`,
        extra1: { label: 'Khách hàng', value: entity.receiver_name },
        extra2: { label: 'SĐT', value: entity.receiver_phone },
        extra3: { label: 'Trạng thái', value: entity.status },
      })
    }
  };

  const label = labels[entityType];
  const { startLoading, stopLoading } = useLoadingKey(`${entityType}-images`, `Đang tải ảnh ${entityType}...`);

  useEffect(() => {
    fetchEntities();
  }, []);

  useEffect(() => {
    if (selectedEntityId) {
      fetchEntityDetails();
    } else {
      setSelectedEntity(null);
      setImages([]);
    }
  }, [selectedEntityId]);

  const fetchEntities = async () => {
    setEntitiesLoading(true);
    try {
      const res = await entityAPI.getAll();
      const entitiesData = res.data.data || res.data || [];
      setEntities(entitiesData);
    } catch (err) {
      console.error('Fetch entities error:', err);
      setEntities([]);
    } finally {
      setEntitiesLoading(false);
    }
  };

  const fetchEntityDetails = async () => {
    if (!selectedEntityId) return;
    
    startLoading(`Đang tải chi tiết ${label.entityName.toLowerCase()}...`);
    try {
      // Get entity info from list
      const entity = entities.find(e => e.id == selectedEntityId);
      if (entity) {
        setSelectedEntity(entity);
      }
      
      // Fetch images
      const imagesRes = await imageAPI.getImages(selectedEntityId);
      const imagesData = imagesRes.data.data || imagesRes.data || [];
      
      const validImages = imagesData
        .filter(img => isValidImageUrl(img.image_url))
        .map(img => ({
          ...img,
          image_url: normalizeImageUrl(img.image_url)
        }));
      
      setImages(validImages);
    } catch (err) {
      console.error('Fetch entity details error:', err);
      
      // Fallback to entity from list
      const entity = entities.find(e => e.id == selectedEntityId);
      if (entity) {
        setSelectedEntity(entity);
        setImages([]);
      } else {
        setSelectedEntity(null);
        setImages([]);
      }
    } finally {
      stopLoading();
    }
  };

  const handleUploadSuccess = async (imageUrls) => {
    if (!selectedEntityId) {
      showError(`Vui lòng chọn ${label.entityName.toLowerCase()}`);
      return;
    }

    try {
      startLoading('Đang tải ảnh lên...');
      const urls = Array.isArray(imageUrls) ? imageUrls : [imageUrls];
      
      // Create record for each image
      for (const imageUrl of urls) {
        // Skip base64 data
        if (imageUrl.startsWith('data:image/')) {
          continue;
        }
        
        const imageData = entityType === 'product' 
          ? {
              product_id: parseInt(selectedEntityId),
              image_url: imageUrl,
              is_primary: images.length === 0 ? 1 : 0,
            }
          : {
              order_id: parseInt(selectedEntityId),
              image_url: imageUrl,
              status_at_time: 'received',
            };
        
        const response = await imageAPI.create(imageData);
        
        if (!response.data.success) {
          throw new Error(response.data.message || 'Failed to create image record');
        }
      }
      
      const validUrls = urls.filter(url => !url.startsWith('data:image/'));
      const skippedCount = urls.length - validUrls.length;
      
      let message = `Upload thành công ${validUrls.length} ảnh!`;
      if (skippedCount > 0) {
        message += ` (Bỏ qua ${skippedCount} ảnh base64)`;
      }
      
      success(message);
      fetchEntityDetails();
      setShowUploader(false);
    } catch (err) {
      console.error('Create image record error:', err);
      showError('Lỗi khi lưu thông tin ảnh: ' + (err.response?.data?.message || err.message));
    } finally {
      stopLoading();
    }
  };

  const handleSetPrimary = async (imageId) => {
    if (!confirm('Đặt làm ảnh chính?')) return;
    
    try {
      startLoading('Đang cập nhật ảnh chính...');
      await imageAPI.update(imageId, { is_primary: true });
      success('Đã đặt làm ảnh chính!');
      fetchEntityDetails();
    } catch (err) {
      console.error('Set primary image error:', err);
      showError('Lỗi khi đặt ảnh chính: ' + (err.response?.data?.message || err.message));
    } finally {
      stopLoading();
    }
  };

  const handleDelete = async (imageId, imageUrl) => {
    if (!confirm('Xóa hình ảnh này?')) return;
    
    try {
      startLoading('Đang xóa ảnh...');
      
      // Delete record in database
      await imageAPI.delete(imageId);
      
      // Delete file on server
      const filename = imageUrl.split('/uploads/')[1];
      if (filename) {
        try {
          const { uploadAPI } = await import('../../services/api');
          await uploadAPI.delete(filename);
        } catch (err) {
          console.warn('Could not delete file from server:', err);
        }
      }
      
      fetchEntityDetails();
    } catch (err) {
      console.error('Delete image error:', err);
      showError('Lỗi khi xóa ảnh');
    } finally {
      stopLoading();
    }
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-lg border border-slate-700/80 bg-slate-900 shadow">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-slate-700 p-4">
        <h2 className="mb-3 text-xl font-bold text-slate-100 sm:text-2xl">{label.title}</h2>
        
        {/* Entity Selection */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 relative">
            <select
              value={selectedEntityId}
              onChange={(e) => setSelectedEntityId(e.target.value)}
              className="w-full appearance-none rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 pr-10 text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1e406b]"
              disabled={entitiesLoading}
            >
              <option value="">
                {entitiesLoading ? `Đang tải danh sách ${label.entityName.toLowerCase()}...` : label.selectPlaceholder}
              </option>
              {entities.map((entity) => (
                <option key={entity.id} value={entity.id}>
                  {label.getEntityLabel(entity)}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-slate-500" />
          </div>
          <button
            onClick={() => setShowUploader(!showUploader)}
            disabled={!selectedEntityId}
            className={`${buttonStyles.success} whitespace-nowrap disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400`}
          >
            {showUploader ? 'Đóng tải lên' : '+ Tải ảnh lên'}
          </button>
        </div>

        {/* Entity Info */}
        {selectedEntity && (
          <div className="mt-3 rounded-lg border border-[#1e406b]/20 bg-[#1e406b]/12 p-3">
            <div className="grid grid-cols-1 gap-2 text-sm text-slate-200 sm:grid-cols-3">
              {(() => {
                const info = label.getEntityInfo(selectedEntity);
                return (
                  <>
                    <div><span className="font-medium">{label.entityName}:</span> {info.name}</div>
                    {info.extra1 && <div><span className="font-medium">{info.extra1.label}:</span> {info.extra1.value}</div>}
                    {info.extra2 && <div><span className="font-medium">{info.extra2.label}:</span> {info.extra2.value}</div>}
                    {info.extra3 && <div><span className="font-medium">{info.extra3.label}:</span> {info.extra3.value}</div>}
                    <div><span className="font-medium">Số ảnh:</span> {images.length}</div>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Upload Section */}
      {showUploader && selectedEntityId && (
        <div className="flex-shrink-0 border-b border-slate-700 bg-slate-900/70 p-4">
          <ImageUploader 
            onUploadSuccess={handleUploadSuccess}
            multiple={true}
            maxFiles={10}
            uploadMode="both"
            allowFileUpload={true}
            allowLinkUpload={true}
          />
        </div>
      )}

      {/* Images Grid - Scrollable */}
      <div className="flex-1 overflow-auto p-4">
        {images.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {images.map((item) => (
              <div 
                key={item.id} 
                className={`group relative overflow-hidden rounded-lg bg-slate-900 shadow-sm transition-all hover:shadow-lg ${
                  supportsPrimary && item.is_primary 
                    ? 'border-4 border-[#e0a02e] ring-2 ring-[#e0a02e]/30' 
                    : 'border-2 border-slate-700 hover:border-[#1e406b]'
                }`}
              >
                <div className="relative aspect-square overflow-hidden bg-slate-900">
                  {/* Hidden img to test load */}
                  <img
                    src={normalizeImageUrl(item.image_url) || item.image_url}
                    alt={selectedEntity?.name || 'Image'}
                    className="hidden"
                    onLoad={(e) => {
                      const container = e.currentTarget.parentElement.querySelector('.image-container');
                      if (container) {
                        const normalizedUrl = normalizeImageUrl(item.image_url) || item.image_url;
                        container.style.backgroundImage = `url(${normalizedUrl})`;
                        container.style.display = 'block';
                      }
                    }}
                    onError={(e) => {
                      const container = e.currentTarget.parentElement.querySelector('.image-container');
                      if (container) {
                        container.style.display = 'none';
                      }
                      const fallback = e.currentTarget.parentElement.querySelector('.fallback-icon');
                      if (fallback) {
                        fallback.style.display = 'flex';
                      }
                    }}
                  />
                  {/* Background image container */}
                  <div 
                    className="image-container w-full h-full bg-cover bg-center bg-no-repeat group-hover:scale-110 transition-transform duration-300"
                    style={{ 
                      backgroundColor: '#0f172a',
                      display: 'none'
                    }}
                  />
                  {/* Fallback icon */}
                  <div className="fallback-icon absolute inset-0 flex items-center justify-center bg-slate-800 text-slate-500" style={{display: 'none'}}>
                    <ImageIcon size={32} />
                  </div>
                </div>
                
                {/* Primary Badge */}
                {supportsPrimary && item.is_primary === 1 && (
                  <div className="absolute top-2 left-2 bg-[#e0a02e] text-[#112552] px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                    <Star size={12} fill="currentColor" />
                    Ảnh chính
                  </div>
                )}
                
                {/* Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all group-hover:bg-black/50">
                  <div className="opacity-0 group-hover:opacity-100 flex gap-2">
                    {supportsPrimary && !item.is_primary && (
                      <button
                        onClick={() => handleSetPrimary(item.id)}
                        className="rounded-full bg-slate-900 p-2 text-[#eecd7e] shadow-sm transition-colors hover:bg-[#c37b1e]/12"
                        title="Đặt làm ảnh chính"
                      >
                        <Star size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => window.open(normalizeImageUrl(item.image_url) || item.image_url, '_blank')}
                      className="rounded-full bg-slate-900 p-2 text-[#eecd7e] shadow-sm transition-colors hover:bg-[#1e406b]/12"
                      title="Xem lớn"
                    >
                      <ImageIcon size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, item.image_url)}
                      className="rounded-full bg-slate-900 p-2 text-[#b48242] shadow-sm transition-colors hover:bg-[#b48242]/12"
                      title="Xóa"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="border-t border-slate-700 bg-slate-900 p-2">
                  <p className="truncate text-xs text-slate-400" title={item.image_url}>
                    Mã: {item.id}
                  </p>
                  {item.created_at && (
                    <p className="text-xs text-slate-500">
                      {new Date(item.created_at).toLocaleDateString('vi-VN')}
                    </p>
                  )}
                  {item.status_at_time && (
                    <span className="mt-1 inline-block rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
                      {item.status_at_time}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Chỉ hiển thị khung "chưa có ảnh" khi không đang mở uploader
          !showUploader && (
            <div className="flex h-full flex-col items-center justify-center text-slate-400">
              <ImageIcon className="w-20 h-20 mb-4" />
              <p className="text-lg font-medium mb-2">
                {selectedEntityId ? label.noImagesText : label.selectToViewText}
              </p>
              <p className="text-sm">
                {selectedEntityId && label.uploadPromptText}
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}

