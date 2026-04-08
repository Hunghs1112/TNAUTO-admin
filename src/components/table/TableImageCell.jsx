// src/components/table/TableImageCell.jsx
import { useMemo, useState } from 'react';
import { X, Image as ImageIcon, ZoomIn } from 'lucide-react';
import { normalizeImageUrl } from '../../utils/format';
import OptimizedImage from '../image/OptimizedImage';

/**
 * Table image cell with thumbnail previews and lightbox.
 */
export default function TableImageCell({
  images,
  alt = 'Image',
  maxDisplay = 3,
  size = 'md',
}) {
  const [showLightbox, setShowLightbox] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const imageArray = useMemo(() => {
    const source = Array.isArray(images) ? images.filter(Boolean) : images ? [images] : [];
    return source.map((item) => normalizeImageUrl(item) || item);
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
    sm: 'h-10 w-10',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  const displayImages = imageArray.slice(0, maxDisplay);
  const remainingCount = imageArray.length - maxDisplay;

  const fallbackNode = (
    <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-300 dark:bg-slate-700 dark:text-slate-500">
      <ImageIcon size={18} />
    </div>
  );

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
      <div className="flex items-center gap-1.5">
        {displayImages.map((img, index) => (
          <div
            key={index}
            onClick={() => openLightbox(index)}
            className={`${sizeClasses[size]} group relative cursor-pointer overflow-hidden rounded-lg border-2 border-gray-200 bg-gray-50 transition-all hover:border-blue-400 hover:shadow-lg dark:border-slate-600 dark:bg-slate-700 dark:hover:border-blue-500`}
          >
            <OptimizedImage
              src={img}
              alt={`${alt} ${index + 1}`}
              className="h-full w-full bg-white object-cover transition-transform duration-300 group-hover:scale-110 dark:bg-slate-800"
              containerClassName="h-full w-full"
              placeholder={fallbackNode}
              fallback={fallbackNode}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 transition-all group-hover:bg-opacity-30 dark:group-hover:bg-opacity-50">
              <ZoomIn className="text-white opacity-0 transition-opacity group-hover:opacity-100" size={18} />
            </div>
          </div>
        ))}

        {remainingCount > 0 ? (
          <button
            onClick={() => openLightbox(maxDisplay)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-blue-300 bg-blue-100 text-xs font-semibold text-blue-700 transition-all hover:bg-blue-200 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
          >
            +{remainingCount}
          </button>
        ) : null}
      </div>

      {showLightbox ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-95 p-4"
          onClick={() => setShowLightbox(false)}
        >
          <div className="relative w-full max-w-6xl" onClick={(event) => event.stopPropagation()}>
            <button
              onClick={() => setShowLightbox(false)}
              className="absolute -top-14 right-0 rounded-full bg-white bg-opacity-10 p-2 text-white transition-colors hover:bg-opacity-20 hover:text-gray-300"
            >
              <X size={28} />
            </button>

            <div className="absolute -top-14 left-0 rounded-lg bg-white bg-opacity-10 px-4 py-2 text-white">
              <span className="font-semibold">{currentImageIndex + 1}</span> / {imageArray.length}
            </div>

            <div className="overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-slate-800">
              <img
                src={imageArray[currentImageIndex]}
                alt={`${alt} ${currentImageIndex + 1}`}
                className="max-h-[80vh] w-full bg-white object-contain dark:bg-slate-800"
                loading="eager"
                fetchPriority="high"
              />
            </div>

            {imageArray.length > 1 ? (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white bg-opacity-80 p-3 text-gray-800 shadow-lg transition-all hover:bg-opacity-100"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white bg-opacity-80 p-3 text-gray-800 shadow-lg transition-all hover:bg-opacity-100"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            ) : null}

            {imageArray.length > 1 ? (
              <div className="mt-4 flex justify-center gap-2 overflow-x-auto pb-2">
                {imageArray.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 bg-gray-50 transition-all dark:bg-slate-700 ${
                      index === currentImageIndex
                        ? 'border-blue-500 ring-2 ring-blue-300 dark:border-blue-400 dark:ring-blue-600'
                        : 'border-gray-300 opacity-60 hover:border-blue-400 hover:opacity-100 dark:border-slate-600 dark:hover:border-blue-500'
                    }`}
                  >
                    <OptimizedImage
                      src={img}
                      alt={`Thumbnail ${index + 1}`}
                      className="h-full w-full object-cover"
                      containerClassName="h-full w-full"
                      placeholder={fallbackNode}
                      fallback={fallbackNode}
                      priority={index === currentImageIndex}
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
