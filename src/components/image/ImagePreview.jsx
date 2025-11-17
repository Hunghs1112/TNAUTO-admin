// src/components/image/ImagePreview.jsx
import React, { useState } from 'react';
import { Eye, X, Image as ImageIcon } from 'lucide-react';
import { normalizeImageUrl } from '../../utils/format';

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
  directDisplay = true // New prop to control direct display
}) {
  const [showPreview, setShowPreview] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Normalize image URL (xử lý /uploads và các trường hợp khác)
  const normalizedSrc = normalizeImageUrl(src) || src;

  if (!src || imageError) {
    return (
      <div className={`${className} bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-gray-400 dark:text-slate-400 text-xs border border-gray-200 dark:border-slate-600`}>
        <ImageIcon size={16} className="text-gray-300 dark:text-slate-500" />
      </div>
    );
  }

  // Direct display mode - show image without overlay
  if (directDisplay && !showModal) {
    return (
      <div className="relative overflow-hidden rounded bg-white dark:bg-slate-800">
        <img
          src={normalizedSrc}
          alt={alt}
          className={`${className} object-cover bg-white dark:bg-slate-800`}
          onError={() => setImageError(true)}
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <>
      <div className="relative group bg-white dark:bg-slate-800 rounded overflow-hidden border border-gray-200 dark:border-slate-700">
        <img
          src={normalizedSrc}
          alt={alt}
          className={`${className} bg-white dark:bg-slate-800`}
          onError={() => setImageError(true)}
          loading="lazy"
        />
        {showModal && (
          <button
            onClick={() => setShowPreview(true)}
            className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100"
          >
            <Eye size={16} className="text-white" />
          </button>
        )}
      </div>

      {/* Image Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/75 dark:bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full bg-white dark:bg-slate-800 rounded-lg overflow-hidden shadow-2xl border border-gray-200 dark:border-slate-700">
            <button
              onClick={() => setShowPreview(false)}
              className="absolute top-4 right-4 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white z-10 bg-white dark:bg-slate-700 rounded-full p-2 shadow-lg hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
            >
              <X size={24} />
            </button>
            <img
              src={normalizedSrc}
              alt={alt}
              className="max-w-full max-h-full object-contain bg-white dark:bg-slate-800"
            />
          </div>
        </div>
      )}
    </>
  );
}