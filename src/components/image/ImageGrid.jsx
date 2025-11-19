// src/components/image/ImageGrid.jsx
import { useState } from 'react';
import { Trash2, Star } from 'lucide-react';
import { normalizeImageUrl, isValidImageUrl } from '../../utils/format';
import EmptyState from '../ui/EmptyState';
import ImageLightbox from './ImageLightbox';

/**
 * Image Grid Component
 * Tái sử dụng cho ProductDetailModal và ServiceOrderDetailModal
 * 
 * @param {Array} images - Array of image objects with { id, image_url, is_primary? }
 * @param {Function} onDelete - Callback when delete image
 * @param {Function} onSetPrimary - Optional callback when set primary image
 * @param {string} emptyTitle - Title for empty state
 * @param {string} emptyDescription - Description for empty state
 */
export default function ImageGrid({ 
  images = [], 
  onDelete, 
  onSetPrimary,
  emptyTitle = "Chưa có hình ảnh",
  emptyDescription = "Chưa có hình ảnh nào"
}) {
  const [lightboxImage, setLightboxImage] = useState(null);

  const validImages = images.filter(img => 
    img.image_url && isValidImageUrl(img.image_url)
  );

  if (validImages.length === 0) {
    return (
      <>
        <EmptyState 
          title={emptyTitle}
          description={emptyDescription}
        />
        {lightboxImage && (
          <ImageLightbox 
            imageUrl={lightboxImage} 
            onClose={() => setLightboxImage(null)} 
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {validImages.map((img) => {
          const imageUrl = normalizeImageUrl(img.image_url) || img.image_url;
          if (!imageUrl) return null;
          
          const isPrimary = img.is_primary === 1 || img.is_primary === true;
          
          return (
            <div 
              key={img.id} 
              className={`group relative aspect-square rounded-lg overflow-hidden border-2 transition-all bg-gray-100 dark:bg-slate-800 ${
                isPrimary 
                  ? 'border-yellow-400 dark:border-yellow-500 ring-2 ring-yellow-200 dark:ring-yellow-800' 
                  : 'border-gray-200 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500'
              }`}
            >
              {/* Primary Badge */}
              {isPrimary && (
                <div className="absolute top-1 left-1 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg z-30">
                  <Star size={12} fill="currentColor" />
                  Ảnh chính
                </div>
              )}
              
              <img
                src={imageUrl}
                alt="Hình ảnh"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 cursor-pointer relative z-10"
                loading="lazy"
                onClick={() => setLightboxImage(imageUrl)}
                onError={(e) => { 
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.classList.add('flex', 'items-center', 'justify-center', 'bg-gray-100', 'dark:bg-slate-700');
                    parent.innerHTML = '<svg class="w-12 h-12 text-gray-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>';
                  }
                }}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 dark:group-hover:bg-black/50 transition-all flex items-center justify-center gap-2 pointer-events-none z-20">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxImage(imageUrl);
                  }}
                  className="opacity-0 group-hover:opacity-100 bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg text-xs font-medium shadow-md hover:shadow-lg transition-all hover:scale-105 pointer-events-auto"
                >
                  Xem lớn
                </button>
                {onSetPrimary && !isPrimary && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSetPrimary(img.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 px-2 py-1.5 rounded-lg text-xs font-medium shadow-md hover:shadow-lg transition-all hover:scale-105 pointer-events-auto"
                    title="Đặt làm ảnh chính"
                  >
                    <Star size={14} />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(img.id, img.image_url);
                    }}
                    className="opacity-0 group-hover:opacity-100 bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 px-2 py-1.5 rounded-lg text-xs font-medium shadow-md hover:shadow-lg transition-all hover:scale-105 pointer-events-auto"
                    title="Xóa ảnh"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {lightboxImage && (
        <ImageLightbox 
          imageUrl={lightboxImage} 
          onClose={() => setLightboxImage(null)} 
        />
      )}
    </>
  );
}

