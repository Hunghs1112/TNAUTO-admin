// src/components/ui/Modal.jsx
import React from 'react';
import { X } from 'lucide-react';

/**
 * Reusable modal component
 * Supports different sizes and custom content
 */
export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  showCloseButton = true,
  className = ''
}) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-full mx-4'
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full ${sizeClasses[size]} max-h-[90vh] overflow-y-auto border border-gray-200/50 dark:border-slate-700/50 ${className} animate-fade-in`}>
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700 gradient-header transition-colors duration-300">
            {title && (
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors duration-300">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-all duration-200 active:scale-95"
                aria-label="Đóng"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}
        <div className="p-6 bg-white dark:bg-slate-800 transition-colors duration-300">
          {children}
        </div>
      </div>
    </div>
  );
}
