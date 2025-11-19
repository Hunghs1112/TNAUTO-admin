// src/components/image/ImageLightbox.jsx
import { X } from 'lucide-react';
import { normalizeImageUrl } from '../../utils/format';

/**
 * Image Lightbox Component
 * Tái sử dụng cho ProductDetailModal và ServiceOrderDetailModal
 */
export default function ImageLightbox({ imageUrl, onClose }) {
  if (!imageUrl) return null;

  const normalizedUrl = normalizeImageUrl(imageUrl) || imageUrl;

  return (
    <div 
      className="fixed inset-0 bg-black/90 dark:bg-black/95 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fade-in"
      onClick={onClose}
    >
      <div className="relative max-w-7xl max-h-[95vh] w-full h-full flex items-center justify-center">
        <img
          src={normalizedUrl}
          alt="Ảnh lớn"
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-3 bg-white/10 dark:bg-slate-800/50 hover:bg-white/20 dark:hover:bg-slate-700/50 text-white rounded-lg transition-all duration-200 backdrop-blur-sm"
          aria-label="Đóng"
        >
          <X size={24} />
        </button>
      </div>
    </div>
  );
}

