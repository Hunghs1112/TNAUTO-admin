// src/components/features/GlobalLoadingOverlay.jsx
import React from 'react';
import { useLoading } from '../../contexts/LoadingContext';

/**
 * Global loading overlay với dark mode
 * Hiển thị loading overlay đẹp mắt
 */
export default function GlobalLoadingOverlay() {
  const { globalLoading, isAnyLoading, loadingStates } = useLoading();
  
  if (!globalLoading && !isAnyLoading()) {
    return null;
  }

  const getLoadingMessage = () => {
    if (globalLoading) return 'Đang xử lý...';
    const activeLoading = Object.values(loadingStates).find(state => state.loading);
    return activeLoading?.message || 'Đang tải...';
  };

  return (
    <div className="fixed inset-0 bg-white/80 dark:bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center bg-white/95 dark:bg-slate-800/95 px-8 py-6 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700">
        <div className="w-12 h-12 border-4 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{getLoadingMessage()}</p>
      </div>
    </div>
  );
}
