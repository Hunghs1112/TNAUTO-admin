// src/components/image/ImagePreview.jsx
import { useState } from 'react';
import { Eye, X, Image as ImageIcon } from 'lucide-react';
import { normalizeImageUrl } from '../../utils/format';
import OptimizedImage from './OptimizedImage';

/**
 * Reusable image preview component
 * Shows image directly with optional modal preview on click
 */
export default function ImagePreview({
  src,
  alt = 'Image',
  className = 'w-12 h-12 rounded object-cover',
  showModal = true,
  fallbackText = 'No Image',
  directDisplay = true,
}) {
  const [showPreview, setShowPreview] = useState(false);
  const normalizedSrc = normalizeImageUrl(src) || src;

  const fallbackNode = (
    <div
      className={`${className} flex items-center justify-center border border-gray-200 bg-gray-100 text-gray-400 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-400`}
      aria-label={fallbackText}
    >
      <ImageIcon size={16} className="text-gray-300 dark:text-slate-500" />
    </div>
  );

  if (!src) {
    return fallbackNode;
  }

  if (directDisplay && !showModal) {
    return (
      <OptimizedImage
        src={src}
        alt={alt}
        className={`${className} bg-white object-cover dark:bg-slate-800`}
        containerClassName="relative overflow-hidden rounded bg-white dark:bg-slate-800"
        placeholder={fallbackNode}
        fallback={fallbackNode}
      />
    );
  }

  return (
    <>
      <div className="relative group overflow-hidden rounded border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <OptimizedImage
          src={src}
          alt={alt}
          className={`${className} bg-white dark:bg-slate-800`}
          placeholder={fallbackNode}
          fallback={fallbackNode}
        />
        {showModal ? (
          <button
            onClick={() => setShowPreview(true)}
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 opacity-0 transition-all duration-200 group-hover:bg-opacity-30 group-hover:opacity-100"
          >
            <Eye size={16} className="text-white" />
          </button>
        ) : null}
      </div>

      {showPreview ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm dark:bg-black/90">
          <div className="relative max-h-full max-w-4xl overflow-hidden rounded-lg border border-gray-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800">
            <button
              onClick={() => setShowPreview(false)}
              className="absolute right-4 top-4 z-10 rounded-full bg-white p-2 text-gray-600 shadow-lg transition-colors hover:bg-gray-100 hover:text-gray-800 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600 dark:hover:text-white"
            >
              <X size={24} />
            </button>
            <img
              src={normalizedSrc}
              alt={alt}
              className="max-h-full max-w-full object-contain bg-white dark:bg-slate-800"
              loading="eager"
              fetchPriority="high"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
