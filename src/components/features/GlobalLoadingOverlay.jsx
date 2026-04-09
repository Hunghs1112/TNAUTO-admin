// src/components/features/GlobalLoadingOverlay.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useLoading } from '../../contexts/LoadingContext';

const SHOW_DELAY_MS = 150;
const MIN_VISIBLE_MS = 220;

/**
 * Overlay loading toàn cục.
 * Không theo dõi loading cục bộ trong modal/detail để tránh nhảy giao diện.
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/88 backdrop-blur-sm">
      <div className="rounded-2xl border border-slate-700 bg-slate-900/95 px-8 py-6 text-center shadow-2xl">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-600 border-t-[#e0a02e]" />
        <p className="text-sm font-medium text-slate-300">
          {globalLoadingMessage || 'Đang xử lý...'}
        </p>
      </div>
    </div>
  );
}
