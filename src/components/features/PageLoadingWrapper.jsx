// src/components/features/PageLoadingWrapper.jsx
import React from 'react';
import LoadingSpinner from '../ui/LoadingSpinner';
import { useLoadingKey } from '../../contexts/LoadingContext';

/**
 * Page-level loading wrapper component
 * Provides consistent loading UI for individual pages
 * 
 * @param {string} loadingKey - Unique key for this page's loading state
 * @param {string} loadingMessage - Message to show while loading
 * @param {React.ReactNode} children - Content to show when not loading
 * @param {boolean} showOverlay - Whether to show overlay or inline loading
 */
export default function PageLoadingWrapper({ 
  loadingKey, 
  loadingMessage = 'Đang tải dữ liệu...',
  children,
  showOverlay = false,
  className = ''
}) {
  const { loading, message } = useLoadingKey(loadingKey, loadingMessage);

  if (showOverlay && loading) {
    return (
      <div className={`relative ${className}`}>
        {children}
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm">
          <div className="mx-4 max-w-xs rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-xl">
            <div className="text-center">
              {/* Beautiful spinner */}
              <div className="relative mb-4">
                <div className="w-12 h-12 mx-auto">
                  <div className="absolute inset-0 rounded-full border-3 border-slate-700"></div>
                  <div className="absolute inset-0 rounded-full border-3 border-transparent border-t-blue-500 animate-spin"></div>
                  <div className="absolute inset-1 rounded-full border-2 border-transparent border-t-blue-300 animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.2s'}}></div>
                </div>
                <div className="absolute inset-0 rounded-full bg-[#1e406b]/12 animate-ping opacity-20"></div>
              </div>
              <p className="text-sm font-medium text-slate-300">{message}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-64 ${className}`}>
        <div className="text-center">
          {/* Beautiful inline spinner */}
          <div className="relative mb-4">
            <div className="w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-slate-700"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin"></div>
              <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-blue-300 animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
            </div>
            <div className="absolute inset-0 rounded-full bg-[#1e406b]/12 animate-ping opacity-20"></div>
          </div>
          <p className="text-lg font-semibold text-slate-300">{message}</p>
          <div className="flex justify-center space-x-1 mt-3">
            <div className="w-2 h-2 bg-[#1e406b] rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
            <div className="w-2 h-2 bg-[#1e406b] rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
            <div className="w-2 h-2 bg-[#1e406b] rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
          </div>
        </div>
      </div>
    );
  }

  return <div className={className}>{children}</div>;
}
