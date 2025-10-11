// src/pages/ProductImages.jsx
import { useState, useEffect } from 'react';
import { productsAPI } from '../services/api';
import { isValidImageUrl, normalizeImageUrl } from '../utils/format';
import ImageUploader from '../components/ImageUploader';
import { Trash2, Image as ImageIcon, Star } from 'lucide-react';
import { buttonStyles } from '../styles/colors';

export default function ProductImages() {
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showUploader, setShowUploader] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedProductId) {
      fetchProductDetails();
    } else {
      setSelectedProduct(null);
      setImages([]);
    }
  }, [selectedProductId]);

  const fetchProducts = async () => {
    try {
      const res = await productsAPI.getAll();
      const productsData = res.data.data || res.data || [];
      setProducts(productsData);
    } catch (err) {
      console.error('Fetch products error:', err);
    }
  };

  const fetchProductDetails = async () => {
    if (!selectedProductId) return;
    
    setLoading(true);
    try {
      const res = await productsAPI.getById(selectedProductId);
      console.log('Fetched product details:', res.data);
      const productData = res.data.data || res.data;
      setSelectedProduct(productData);
      
      // Filter và normalize image URLs
      const imagesData = productData.images || [];
      const validImages = imagesData
        .filter(img => isValidImageUrl(img.image_url))
        .map(img => ({
          ...img,
          image_url: normalizeImageUrl(img.image_url)
        }));
      
      console.log('Valid images:', validImages.length, 'of', imagesData.length);
      setImages(validImages);
    } catch (err) {
      console.error('Fetch product details error:', err);
      setSelectedProduct(null);
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = async (imageUrls) => {
    if (!selectedProductId) {
      alert('Vui lòng chọn sản phẩm');
      return;
    }

    try {
      const urls = Array.isArray(imageUrls) ? imageUrls : [imageUrls];
      
      // Tạo record cho mỗi ảnh
      for (const imageUrl of urls) {
        await productsAPI.createImage({
          product_id: parseInt(selectedProductId),
          image_url: imageUrl,
          is_primary: images.length === 0 ? 1 : 0, // Ảnh đầu tiên là primary
        });
      }
      
      console.log('Created image records for product', selectedProductId);
      alert(`Upload thành công ${urls.length} ảnh!`);
      fetchProductDetails();
      setShowUploader(false);
    } catch (err) {
      console.error('Create image record error:', err);
      alert('Lỗi khi lưu thông tin ảnh: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleSetPrimary = async (imageId) => {
    if (!confirm('Đặt làm ảnh chính?')) return;
    
    try {
      // Update primary image (cần thêm endpoint này trong backend hoặc xử lý khác)
      // Tạm thời reload lại để update
      alert('Chức năng đang được phát triển');
      // TODO: Implement set primary endpoint
    } catch (err) {
      console.error('Set primary error:', err);
      alert('Lỗi khi đặt ảnh chính');
    }
  };

  const handleDelete = async (imageId, imageUrl) => {
    if (!confirm('Xóa hình ảnh này?')) return;
    
    try {
      // Xóa record trong database
      await productsAPI.deleteImage(imageId);
      
      // Xóa file trên server
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
      
      console.log('Deleted image', imageId);
      fetchProductDetails();
    } catch (err) {
      console.error('Delete image error:', err);
      alert('Lỗi khi xóa ảnh');
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <h2 className="text-xl sm:text-2xl font-bold mb-3">Quản lý ảnh sản phẩm</h2>
        
        {/* Product Selection */}
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Chọn sản phẩm --</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} (Mã: {product.id})
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowUploader(!showUploader)}
            disabled={!selectedProductId}
            className={`${buttonStyles.success} whitespace-nowrap disabled:bg-gray-300 disabled:cursor-not-allowed`}
          >
            {showUploader ? 'Đóng tải lên' : '+ Tải ảnh lên'}
          </button>
        </div>

        {/* Product Info */}
        {selectedProduct && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
              <div><span className="font-medium">Sản phẩm:</span> {selectedProduct.name}</div>
              <div><span className="font-medium">Giá:</span> {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedProduct.price)}</div>
              <div><span className="font-medium">Số ảnh:</span> {images.length}</div>
            </div>
          </div>
        )}
      </div>

      {/* Upload Section */}
      {showUploader && selectedProductId && (
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
              <div key={item.id} className={`group relative bg-white rounded-lg overflow-hidden transition-all shadow-sm hover:shadow-md ${item.is_primary ? 'border-4 border-yellow-400 ring-2 ring-yellow-200' : 'border-2 border-gray-200 hover:border-blue-400'}`}>
                <div className="aspect-square">
                  <img
                    src={item.image_url}
                    alt={selectedProduct?.name}
                    className="w-full h-full object-contain bg-gray-50 group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement.classList.add('flex', 'items-center', 'justify-center');
                      e.currentTarget.parentElement.innerHTML = '<svg class="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>';
                    }}
                  />
                </div>
                
                {/* Primary Badge */}
                {item.is_primary === 1 && (
                  <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                    <Star size={12} fill="currentColor" />
                    Ảnh chính
                  </div>
                )}
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 flex gap-2">
                    {!item.is_primary && (
                      <button
                        onClick={() => handleSetPrimary(item.id)}
                        className="bg-white text-amber-600 hover:bg-amber-50 p-2 rounded-full shadow-sm"
                        title="Đặt làm ảnh chính"
                      >
                        <Star size={18} />
                      </button>
                    )}
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
                  <p className="text-xs text-gray-500 truncate" title={item.image_url}>
                    Mã: {item.id}
                  </p>
                  {item.created_at && (
                    <p className="text-xs text-gray-400">
                      {new Date(item.created_at).toLocaleDateString('vi-VN')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <ImageIcon className="w-20 h-20 mb-4" />
            <p className="text-lg font-medium mb-2">
              {selectedProductId ? 'Chưa có hình ảnh nào' : 'Chọn sản phẩm để xem ảnh'}
            </p>
            <p className="text-sm">
              {selectedProductId && 'Tải ảnh mới lên bằng nút "Tải ảnh lên" ở trên'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

