// src/components/table/TableImageCell.jsx
import { useState, useMemo } from 'react';
import { Eye, X, Image as ImageIcon, ZoomIn } from 'lucide-react';
import { normalizeImageUrl } from '../../utils/format';

/**
 * Component hiển thị ảnh trong table với preview và lightbox
 * Supports single or multiple images
 */
export default function TableImageCell({ 
  images, 
  alt = 'Image',
  maxDisplay = 3,
  size = 'md' // sm, md, lg
}) {
  const [showLightbox, setShowLightbox] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Normalize to array and normalize URLs
  const imageArray = useMemo(() => {
    const arr = Array.isArray(images) 
      ? images.filter(img => img) 
      : images ? [images] : [];
    // Normalize all image URLs
    return arr.map(img => normalizeImageUrl(img) || img);
  }, [images]);

  if (imageArray.length === 0) {
    return (
      <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
        <ImageIcon size={16} />
        <span className="text-xs">Chưa có ảnh</span>
      </div>
    );
  }

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const displayImages = imageArray.slice(0, maxDisplay);
  const remainingCount = imageArray.length - maxDisplay;

  const openLightbox = (index) => {
    setCurrentImageIndex(index);
    setShowLightbox(true);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % imageArray.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + imageArray.length) % imageArray.length);
  };

  return (
    <>
      {/* Thumbnails */}
      <div className="flex items-center gap-1.5">
        {displayImages.map((img, index) => (
          <div
            key={index}
            onClick={() => openLightbox(index)}
            className={`${sizeClasses[size]} rounded-lg overflow-hidden border-2 border-gray-200 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer group relative transition-all hover:shadow-lg bg-gray-50 dark:bg-slate-700`}
          >
            <img
              src={img}
              alt={`${alt} ${index + 1}`}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 bg-white dark:bg-slate-800"
              onError={(e) => {
                e.target.style.display = 'none';
                const parent = e.target.parentElement;
                parent.classList.add('bg-gray-100', 'dark:bg-slate-700', 'flex', 'items-center', 'justify-center');
                parent.innerHTML = '<svg class="w-6 h-6 text-gray-300 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>';
              }}
            />
            {/* Zoom icon on hover */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 dark:group-hover:bg-opacity-50 flex items-center justify-center transition-all">
              <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={18} />
            </div>
          </div>
        ))}
        
        {/* Remaining count badge */}
        {remainingCount > 0 && (
          <button
            onClick={() => openLightbox(maxDisplay)}
            className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all font-semibold text-xs border-2 border-blue-300 dark:border-blue-700"
          >
            +{remainingCount}
          </button>
        )}
      </div>

      {/* Lightbox */}
      {showLightbox && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 p-4"
          onClick={() => setShowLightbox(false)}
        >
          <div className="relative w-full max-w-6xl" onClick={(e) => e.stopPropagation()}>
            {/* Close button */}
            <button
              onClick={() => setShowLightbox(false)}
              className="absolute -top-14 right-0 text-white hover:text-gray-300 transition-colors bg-white bg-opacity-10 rounded-full p-2 hover:bg-opacity-20"
            >
              <X size={28} />
            </button>

            {/* Image counter */}
            <div className="absolute -top-14 left-0 text-white bg-white bg-opacity-10 px-4 py-2 rounded-lg">
              <span className="font-semibold">{currentImageIndex + 1}</span> / {imageArray.length}
            </div>

            {/* Main image */}
            <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-2xl">
              <img
                src={imageArray[currentImageIndex]}
                alt={`${alt} ${currentImageIndex + 1}`}
                className="w-full max-h-[80vh] object-contain bg-white dark:bg-slate-800"
              />
            </div>

            {/* Navigation buttons */}
            {imageArray.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-800 rounded-full p-3 shadow-lg transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-800 rounded-full p-3 shadow-lg transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Thumbnail strip */}
            {imageArray.length > 1 && (
              <div className="mt-4 flex gap-2 justify-center overflow-x-auto pb-2">
                {imageArray.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all bg-gray-50 dark:bg-slate-700 ${
                      index === currentImageIndex 
                        ? 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-300 dark:ring-blue-600' 
                        : 'border-gray-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

