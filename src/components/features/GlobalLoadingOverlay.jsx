// src/components/features/GlobalLoadingOverlay.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useLoading } from '../../contexts/LoadingContext';

const SHOW_DELAY_MS = 150;
const MIN_VISIBLE_MS = 220;

/**
 * Overlay loading toan cuc.
 * Khong theo doi loading cuc bo trong modal/detail de tranh nhay giao dien.
 */
export default function GlobalLoadingOverlay() {
  const { globalLoading, globalLoadingMessage } = useLoading();
  const [visible, setVisible] = useState(false);
  const visibleSinceRef = useRef(0);

  useEffect(() => {
    let timer;

    if (globalLoading) {
      timer = window.setTimeout(() => {
        visibleSinceRef.current = Date.now();
        setVisible(true);
      }, SHOW_DELAY_MS);
    } else if (visible) {
      const elapsed = Date.now() - visibleSinceRef.current;
      const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);

      timer = window.setTimeout(() => {
        visibleSinceRef.current = 0;
        setVisible(false);
      }, remaining);
    }

    if (!globalLoading && !visible) {
      visibleSinceRef.current = 0;
      setVisible(false);
    }

    return () => {
      window.clearTimeout(timer);
    };
  }, [globalLoading, visible]);

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-sm dark:bg-slate-900/90">
      <div className="rounded-2xl border border-gray-200 bg-white/95 px-8 py-6 text-center shadow-2xl dark:border-slate-700 dark:bg-slate-800/95">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent dark:border-blue-400" />
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {globalLoadingMessage || 'Đang xử lý...'}
        </p>
      </div>
    </div>
  );
}
