// src/components/image/ImageLightbox.jsx
import { X } from 'lucide-react';
import { normalizeImageUrl } from '../../utils/format';

/**
 * Image Lightbox Component
 * TÃ¡i sá»­ dá»¥ng cho ProductDetailModal vÃ  ServiceOrderDetailModal
 */
export default function ImageLightbox({ imageUrl, onClose }) {
  if (!imageUrl) return null;

  const normalizedUrl = normalizeImageUrl(imageUrl) || imageUrl;

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div className="relative max-w-7xl max-h-[95vh] w-full h-full flex items-center justify-center">
        <img
          src={normalizedUrl}
          alt="áº¢nh lá»›n"
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />
        <button
          type='button'
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg bg-slate-900/60 p-3 text-white transition-all duration-200 backdrop-blur-sm hover:bg-slate-800"
          aria-label="ÄÃ³ng"
        >
          <X size={24} />
        </button>
      </div>
    </div>
  );
}



