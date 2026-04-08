// src/components/image/ImageGrid.jsx
import { useState } from 'react';
import { Trash2, Star, Image as ImageIcon } from 'lucide-react';
import { normalizeImageUrl, isValidImageUrl } from '../../utils/format';
import EmptyState from '../ui/EmptyState';
import ImageLightbox from './ImageLightbox';
import OptimizedImage from './OptimizedImage';

/**
 * Image Grid Component
 * Reused by product, offer, and order detail modals.
 */
export default function ImageGrid({
  images = [],
  onDelete,
  onSetPrimary,
  emptyTitle = 'Chưa có hình ảnh',
  emptyDescription = 'Chưa có hình ảnh nào',
}) {
  const [lightboxImage, setLightboxImage] = useState(null);

  const validImages = images.filter((img) => img.image_url && isValidImageUrl(img.image_url));

  if (validImages.length === 0) {
    return (
      <>
        <EmptyState title={emptyTitle} description={emptyDescription} />
        {lightboxImage ? <ImageLightbox imageUrl={lightboxImage} onClose={() => setLightboxImage(null)} /> : null}
      </>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {validImages.map((img, index) => {
          const imageUrl = normalizeImageUrl(img.image_url) || img.image_url;
          if (!imageUrl) {
            return null;
          }

          const isPrimary = img.is_primary === 1 || img.is_primary === true;
          const imageFallback = (
            <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400 dark:bg-slate-700 dark:text-slate-500">
              <ImageIcon size={24} />
            </div>
          );

          return (
            <div
              key={img.id}
              className={`group relative aspect-square overflow-hidden rounded-lg border-2 bg-gray-100 transition-all dark:bg-slate-800 ${
                isPrimary
                  ? 'border-yellow-400 ring-2 ring-yellow-200 dark:border-yellow-500 dark:ring-yellow-800'
                  : 'border-gray-200 dark:border-slate-600 dark:hover:border-blue-500 hover:border-blue-400'
              }`}
            >
              {isPrimary ? (
                <div className="absolute left-1 top-1 z-30 flex items-center gap-1 rounded-full bg-yellow-400 px-2 py-1 text-xs font-bold text-yellow-900 shadow-lg">
                  <Star size={12} fill="currentColor" />
                  Ảnh chính
                </div>
              ) : null}

              <OptimizedImage
                src={imageUrl}
                alt="Hình ảnh"
                className="relative z-10 h-full w-full cursor-pointer object-cover transition-transform duration-300 group-hover:scale-110"
                containerClassName="h-full w-full"
                placeholder={imageFallback}
                fallback={imageFallback}
                priority={isPrimary || index === 0}
                rootMargin="120px"
                onClick={() => setLightboxImage(imageUrl)}
              />

              <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center gap-2 bg-black/0 transition-all group-hover:bg-black/30 dark:group-hover:bg-black/50">
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    setLightboxImage(imageUrl);
                  }}
                  className="pointer-events-auto rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-blue-600 opacity-0 shadow-md transition-all hover:scale-105 hover:shadow-lg group-hover:opacity-100 dark:bg-slate-700 dark:text-blue-400"
                >
                  Xem lớn
                </button>

                {onSetPrimary && !isPrimary ? (
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      onSetPrimary(img.id);
                    }}
                    className="pointer-events-auto rounded-lg bg-white px-2 py-1.5 text-xs font-medium text-amber-600 opacity-0 shadow-md transition-all hover:scale-105 hover:shadow-lg group-hover:opacity-100 dark:bg-slate-700 dark:text-amber-400"
                    title="Đặt làm ảnh chính"
                  >
                    <Star size={14} />
                  </button>
                ) : null}

                {onDelete ? (
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      onDelete(img.id, img.image_url);
                    }}
                    className="pointer-events-auto rounded-lg bg-white px-2 py-1.5 text-xs font-medium text-red-600 opacity-0 shadow-md transition-all hover:scale-105 hover:shadow-lg group-hover:opacity-100 dark:bg-slate-700 dark:text-red-400"
                    title="Xóa ảnh"
                  >
                    <Trash2 size={14} />
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {lightboxImage ? <ImageLightbox imageUrl={lightboxImage} onClose={() => setLightboxImage(null)} /> : null}
    </>
  );
}
