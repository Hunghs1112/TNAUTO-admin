// src/components/ui/SkeletonLoader.jsx
/**
 * Simple skeleton loader component
 * Minimal, fast, and efficient
 */
export default function SkeletonLoader({ rows = 5, columns = 4, showHeader = true }) {
  return (
    <div className="w-full animate-pulse">
      {showHeader && (
        <div className="h-12 bg-gray-200 rounded mb-4"></div>
      )}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4">
            {Array.from({ length: columns }).map((_, j) => (
              <div
                key={j}
                className="flex-1 h-10 bg-gray-200 rounded"
                style={{ animationDelay: `${j * 50}ms` }}
              ></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Table skeleton loader - optimized for table layout
 */
export function TableSkeleton({ rows = 5, columns = 5 }) {
  return (
    <div className="w-full animate-pulse">
      {/* Header skeleton */}
      <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-10 bg-gray-200 dark:bg-slate-700 rounded transition-colors duration-300"></div>
        ))}
      </div>
      {/* Rows skeleton */}
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {Array.from({ length: columns }).map((_, j) => (
              <div
                key={j}
                className="h-12 bg-gray-100 dark:bg-slate-800 rounded transition-colors duration-300"
                style={{ animationDelay: `${(i * columns + j) * 30}ms` }}
              ></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

