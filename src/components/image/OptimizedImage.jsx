import { useEffect, useMemo, useRef, useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { normalizeImageUrl } from '../../utils/format';

const MAX_CONCURRENT_IMAGE_LOADS = 4;

let activeImageLoads = 0;
const pendingImageTasks = [];
const loadedImageUrls = new Set();

function releaseSlot(releaseRef) {
  if (typeof releaseRef.current === 'function') {
    releaseRef.current();
    releaseRef.current = null;
  }
}

function pumpImageQueue() {
  while (activeImageLoads < MAX_CONCURRENT_IMAGE_LOADS && pendingImageTasks.length > 0) {
    const task = pendingImageTasks.shift();

    if (!task || task.cancelled) {
      continue;
    }

    activeImageLoads += 1;
    task.start(() => {
      if (task.released) {
        return;
      }

      task.released = true;
      activeImageLoads = Math.max(0, activeImageLoads - 1);
      pumpImageQueue();
    });
  }
}

function enqueueImageTask(start) {
  const task = {
    start,
    cancelled: false,
    released: false,
  };

  pendingImageTasks.push(task);
  pumpImageQueue();

  return () => {
    task.cancelled = true;

    const taskIndex = pendingImageTasks.indexOf(task);
    if (taskIndex >= 0) {
      pendingImageTasks.splice(taskIndex, 1);
    }
  };
}

function DefaultPlaceholder({ className }) {
  return (
    <div
      className={`${className} flex items-center justify-center bg-slate-800 text-slate-500`}
      aria-hidden="true"
    >
      <ImageIcon size={16} />
    </div>
  );
}

export default function OptimizedImage({
  src,
  alt = 'Image',
  className = '',
  containerClassName = '',
  placeholder = null,
  fallback = null,
  priority = false,
  rootMargin = '160px',
  loading = 'lazy',
  fetchPriority = 'low',
  decoding = 'async',
  onLoad,
  onError,
  ...imgProps
}) {
  const normalizedSrc = useMemo(() => normalizeImageUrl(src) || src || '', [src]);
  const isCached = Boolean(normalizedSrc) && loadedImageUrls.has(normalizedSrc);

  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const cancelTaskRef = useRef(null);
  const releaseRef = useRef(null);

  const [isVisible, setIsVisible] = useState(priority || isCached);
  const [shouldLoad, setShouldLoad] = useState(priority || isCached);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    cancelTaskRef.current?.();
    cancelTaskRef.current = null;
    releaseSlot(releaseRef);

    setIsVisible(priority || isCached);
    setShouldLoad(priority || isCached);
    setHasError(false);
  }, [isCached, normalizedSrc, priority]);

  useEffect(
    () => () => {
      cancelTaskRef.current?.();
      cancelTaskRef.current = null;
      releaseSlot(releaseRef);
    },
    []
  );

  useEffect(() => {
    if (!normalizedSrc || priority || isCached) {
      return undefined;
    }

    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting || entry.intersectionRatio > 0)) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin,
        threshold: 0.01,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [isCached, normalizedSrc, priority, rootMargin]);

  useEffect(() => {
    if (!normalizedSrc || hasError || shouldLoad || !isVisible) {
      return undefined;
    }

    if (priority || isCached) {
      setShouldLoad(true);
      return undefined;
    }

    const cancelTask = enqueueImageTask((release) => {
      releaseRef.current = release;
      setShouldLoad(true);
    });

    cancelTaskRef.current = cancelTask;

    return () => {
      cancelTask();

      if (cancelTaskRef.current === cancelTask) {
        cancelTaskRef.current = null;
      }
    };
  }, [hasError, isCached, isVisible, normalizedSrc, priority, shouldLoad]);

  useEffect(() => {
    if (!shouldLoad || !imageRef.current || !normalizedSrc) {
      return;
    }

    if (imageRef.current.complete) {
      if (imageRef.current.naturalWidth > 0) {
        loadedImageUrls.add(normalizedSrc);
      } else {
        setHasError(true);
      }

      releaseSlot(releaseRef);
    }
  }, [normalizedSrc, shouldLoad]);

  const placeholderNode = placeholder || <DefaultPlaceholder className={className} />;
  const fallbackNode = fallback || placeholderNode;

  const handleLoad = (event) => {
    if (normalizedSrc) {
      loadedImageUrls.add(normalizedSrc);
    }

    releaseSlot(releaseRef);
    onLoad?.(event);
  };

  const handleError = (event) => {
    setHasError(true);
    releaseSlot(releaseRef);
    onError?.(event);
  };

  return (
    <div ref={containerRef} className={containerClassName}>
      {!normalizedSrc || hasError ? (
        fallbackNode
      ) : shouldLoad ? (
        <img
          ref={imageRef}
          src={normalizedSrc}
          alt={alt}
          className={className}
          loading={priority ? 'eager' : loading}
          fetchPriority={priority ? 'high' : fetchPriority}
          decoding={decoding}
          onLoad={handleLoad}
          onError={handleError}
          {...imgProps}
        />
      ) : (
        placeholderNode
      )}
    </div>
  );
}
