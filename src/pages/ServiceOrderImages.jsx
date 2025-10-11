// src/pages/ServiceOrderImages.jsx
import { useState, useEffect } from 'react';
import { serviceOrderImagesAPI } from '../services/api';
import { formatDate, isValidImageUrl, normalizeImageUrl } from '../utils/format';
import ImageUploader from '../components/ImageUploader';
import { Trash2, Image as ImageIcon } from 'lucide-react';
import { buttonStyles, actionColors } from '../styles/colors';

export default function ServiceOrderImages() {
  const [images, setImages] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [showUploader, setShowUploader] = useState(false);

  useEffect(() => {
    if (selectedOrderId) fetchImages();
  }, [selectedOrderId]);

  const fetchImages = async () => {
    if (!selectedOrderId) return;
    
    setLoading(true);
    try {
      const res = await serviceOrderImagesAPI.getByOrder(selectedOrderId);
      console.log('Fetched images for order', selectedOrderId, ':', res.data);
      const imagesData = res.data.data || res.data || [];
      // Filter và normalize URL ảnh (loại bỏ file path local, chuyển đổi URL)
      const validImages = Array.isArray(imagesData) 
        ? imagesData
            .filter(img => isValidImageUrl(img.image_url))
            .map(img => ({
              ...img,
              image_url: normalizeImageUrl(img.image_url)
            }))
        : [];
      console.log('Valid images:', validImages.length, 'of', imagesData.length, '(filtered local paths)');
      setImages(validImages);
    } catch (err) {
      console.error('Fetch images error:', err);
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = async (imageUrls) => {
    if (!selectedOrderId) {
      alert('Vui lòng nhập ID đơn hàng');
      return;
    }

    try {
      // Nếu là array (multiple upload), xử lý từng ảnh
      const urls = Array.isArray(imageUrls) ? imageUrls : [imageUrls];
      
      // Tạo record cho mỗi ảnh
      for (const imageUrl of urls) {
        await serviceOrderImagesAPI.create({
          order_id: parseInt(selectedOrderId),
          image_url: imageUrl,
          status_at_time: 'received',
        });
      }
      
      console.log('Created image records for order', selectedOrderId);
      alert(`Upload thành công ${urls.length} ảnh!`);
      fetchImages();
      setShowUploader(false);
    } catch (err) {
      console.error('Create image record error:', err);
      alert('Lỗi khi lưu thông tin ảnh: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id, imageUrl) => {
    if (!confirm('Xóa hình ảnh này?')) return;
    
    try {
      // Xóa record trong database
      await serviceOrderImagesAPI.delete(id);
      
      // Lấy filename từ URL để xóa file trên server
      const filename = imageUrl.split('/uploads/')[1];
      if (filename) {
        try {
          const { uploadAPI } = await import('../services/api');
          await uploadAPI.delete(filename);
          console.log('Deleted file:', filename);
        } catch (err) {
          console.warn('Could not delete file from server:', err);
        }
      }
      
      console.log('Deleted image', id);
      fetchImages();
    } catch (err) {
      console.error('Delete image error:', err);
      alert('Lỗi khi xóa ảnh');
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <h2 className="text-xl sm:text-2xl font-bold mb-3">Hình ảnh đơn hàng dịch vụ</h2>
        
        {/* Order ID Input */}
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="number"
            placeholder="Nhập mã đơn hàng"
            value={selectedOrderId}
            onChange={(e) => setSelectedOrderId(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => fetchImages()}
            disabled={!selectedOrderId}
            className={`${buttonStyles.primary} whitespace-nowrap disabled:bg-gray-300 disabled:cursor-not-allowed`}
          >
            Tải ảnh
          </button>
          <button
            onClick={() => setShowUploader(!showUploader)}
            disabled={!selectedOrderId}
            className={`${buttonStyles.success} whitespace-nowrap disabled:bg-gray-300 disabled:cursor-not-allowed`}
          >
            {showUploader ? 'Đóng tải lên' : '+ Tải ảnh lên'}
          </button>
        </div>
      </div>

      {/* Upload Section */}
      {showUploader && selectedOrderId && (
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex-shrink-0">
          <ImageUploader 
            onUploadSuccess={handleUploadSuccess}
            multiple={true}
            maxFiles={10}
          />
        </div>
      )}

      {/* Images Grid - Scrollable */}
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-gray-500">Đang tải...</p>
            </div>
          </div>
        ) : images.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {images.map((item) => (
              <div key={item.id} className="group relative bg-white rounded-lg border-2 border-gray-200 overflow-hidden hover:border-blue-400 transition-all shadow-sm hover:shadow-md">
                <div className="aspect-square">
                  <img
                    src={item.image_url}
                    alt={`Order ${item.order_id}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400"><svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>';
                    }}
                  />
                </div>
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 flex gap-2">
                    <button
                      onClick={() => window.open(item.image_url, '_blank')}
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
                  <p className="text-xs text-gray-500 truncate">
                    Đơn #{item.order_id}
                  </p>
                  <p className="text-xs text-gray-400">
                    {item.created_at ? new Date(item.created_at).toLocaleDateString('vi-VN') : '-'}
                  </p>
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
              {selectedOrderId ? 'Không có hình ảnh nào' : 'Nhập mã đơn hàng để xem ảnh'}
            </p>
            <p className="text-sm">
              {selectedOrderId && 'Tải ảnh mới lên bằng nút "Tải ảnh lên" ở trên'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}