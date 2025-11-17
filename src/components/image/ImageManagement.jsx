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
    <div className="flex flex-col h-full w-full bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <h2 className="text-xl sm:text-2xl font-bold mb-3">{label.title}</h2>
        
        {/* Entity Selection */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 relative">
            <select
              value={selectedEntityId}
              onChange={(e) => setSelectedEntityId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
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
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
          <button
            onClick={() => setShowUploader(!showUploader)}
            disabled={!selectedEntityId}
            className={`${buttonStyles.success} whitespace-nowrap disabled:bg-gray-300 disabled:cursor-not-allowed`}
          >
            {showUploader ? 'Đóng tải lên' : '+ Tải ảnh lên'}
          </button>
        </div>

        {/* Entity Info */}
        {selectedEntity && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
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
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex-shrink-0">
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
                className={`group relative bg-white rounded-lg overflow-hidden transition-all shadow-sm hover:shadow-md ${
                  supportsPrimary && item.is_primary 
                    ? 'border-4 border-yellow-400 ring-2 ring-yellow-200' 
                    : 'border-2 border-gray-200 hover:border-blue-400'
                }`}
              >
                <div className="aspect-square bg-white relative overflow-hidden">
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
                      backgroundColor: 'white',
                      display: 'none'
                    }}
                  />
                  {/* Fallback icon */}
                  <div className="fallback-icon absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400" style={{display: 'none'}}>
                    <ImageIcon size={32} />
                  </div>
                </div>
                
                {/* Primary Badge */}
                {supportsPrimary && item.is_primary === 1 && (
                  <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                    <Star size={12} fill="currentColor" />
                    Ảnh chính
                  </div>
                )}
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 flex gap-2">
                    {supportsPrimary && !item.is_primary && (
                      <button
                        onClick={() => handleSetPrimary(item.id)}
                        className="bg-white text-amber-600 hover:bg-amber-50 p-2 rounded-full shadow-sm"
                        title="Đặt làm ảnh chính"
                      >
                        <Star size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => window.open(normalizeImageUrl(item.image_url) || item.image_url, '_blank')}
                      className="bg-white text-blue-600 hover:bg-blue-50 p-2 rounded-full shadow-sm"
                      title="Xem lớn"
                    >
                      <ImageIcon size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, item.image_url)}
                      className="bg-white text-red-600 hover:bg-red-50 p-2 rounded-full shadow-sm"
                      title="Xóa"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-2 bg-white border-t border-gray-200">
                  <p className="text-xs text-gray-500 truncate" title={item.image_url}>
                    Mã: {item.id}
                  </p>
                  {item.created_at && (
                    <p className="text-xs text-gray-400">
                      {new Date(item.created_at).toLocaleDateString('vi-VN')}
                    </p>
                  )}
                  {item.status_at_time && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                      {item.status_at_time}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <ImageIcon className="w-20 h-20 mb-4" />
            <p className="text-lg font-medium mb-2">
              {selectedEntityId ? label.noImagesText : label.selectToViewText}
            </p>
            <p className="text-sm">
              {selectedEntityId && label.uploadPromptText}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

