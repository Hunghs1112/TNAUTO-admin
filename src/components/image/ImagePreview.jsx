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
      className={`${className} flex items-center justify-center border border-slate-700 bg-slate-800 text-slate-400`}
      aria-label={fallbackText}
    >
      <ImageIcon size={16} className="text-slate-500" />
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
        className={`${className} bg-slate-900 object-cover`}
        containerClassName="relative overflow-hidden rounded bg-slate-900"
        placeholder={fallbackNode}
        fallback={fallbackNode}
      />
    );
  }

  return (
    <>
      <div className="relative group overflow-hidden rounded border border-slate-700 bg-slate-900">
        <OptimizedImage
          src={src}
          alt={alt}
          className={`${className} bg-slate-900`}
          placeholder={fallbackNode}
          fallback={fallbackNode}
        />
        {showModal ? (
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 opacity-0 transition-all duration-200 group-hover:bg-opacity-30 group-hover:opacity-100"
          >
            <Eye size={16} className="text-white" />
          </button>
        ) : null}
      </div>

      {showPreview ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
          <div className="relative max-h-full max-w-4xl overflow-hidden rounded-lg border border-slate-700 bg-slate-900 shadow-2xl">
            <button
              type="button"
              onClick={() => setShowPreview(false)}
              className="absolute right-4 top-4 z-10 rounded-full bg-slate-800 p-2 text-slate-300 shadow-lg transition-colors hover:bg-slate-700 hover:text-white"
            >
              <X size={24} />
            </button>
            <img
              src={normalizedSrc}
              alt={alt}
              className="max-h-full max-w-full object-contain bg-slate-900"
              loading="eager"
              fetchPriority="high"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
