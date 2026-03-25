import { X } from 'lucide-react';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  className = '',
}) {
  if (!isOpen) {
    return null;
  }

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'mx-4 max-w-full',
  };

  return (
    <div className="animate-fade-in fixed inset-0 z-50 overflow-y-auto bg-black/55 p-3 backdrop-blur-sm sm:flex sm:items-center sm:justify-center sm:p-4">
      <div className={`app-panel my-4 flex max-h-[calc(100vh-1.5rem)] w-full flex-col sm:my-0 sm:max-h-[90vh] ${sizeClasses[size]} ${className}`}>
        {title || showCloseButton ? (
          <div className="app-panel-header flex shrink-0 items-center justify-between">
            {title ? <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{title}</h2> : <div />}
            {showCloseButton ? (
              <button type="button" onClick={onClose} className="app-icon-button h-10 w-10" aria-label="Đóng">
                <X size={18} />
              </button>
            ) : null}
          </div>
        ) : null}

        <div className="app-panel-body min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

