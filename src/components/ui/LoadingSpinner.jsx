// src/components/ui/LoadingSpinner.jsx
import React from 'react';

/**
 * Reusable loading spinner component
 * Supports different sizes and colors
 */
export default function LoadingSpinner({ 
  size = 'md',
  color = 'blue',
  className = '',
  text = ''
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const textColorClasses = {
    blue: 'text-blue-600 dark:text-blue-400',
    gray: 'text-gray-600 dark:text-gray-400',
    white: 'text-white',
    green: 'text-green-600 dark:text-green-400',
    red: 'text-red-600 dark:text-red-400'
  };

  const borderColorClasses = {
    blue: 'border-gray-300 dark:border-slate-600 border-t-blue-500 dark:border-t-blue-400',
    gray: 'border-gray-300 dark:border-slate-600 border-t-gray-500 dark:border-t-gray-400',
    white: 'border-white/30 border-t-white',
    green: 'border-gray-300 dark:border-slate-600 border-t-green-500 dark:border-t-green-400',
    red: 'border-gray-300 dark:border-slate-600 border-t-red-500 dark:border-t-red-400'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`animate-spin rounded-full border-2 ${borderColorClasses[color]} ${sizeClasses[size]}`}>
        <span className="sr-only">Loading...</span>
      </div>
      {text && (
        <p className={`mt-2 text-sm ${textColorClasses[color]}`}>
          {text}
        </p>
      )}
    </div>
  );
}