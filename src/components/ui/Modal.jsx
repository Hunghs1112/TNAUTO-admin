import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

function getModalTarget() {
  if (typeof document === 'undefined') return null;
  return document.getElementById('modal-root') || document.body;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  placement = 'center',
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

  const placementClasses = {
    center: 'items-center justify-center py-4',
    top: 'items-start justify-center pt-2 sm:pt-3',
  };

  const modalContent = (
    <div className={`animate-fade-in fixed inset-0 z-50 flex overflow-y-auto bg-black/55 p-2 backdrop-blur-sm sm:p-4 ${placementClasses[placement] || placementClasses.center}`}>
      <div className={`app-panel mt-0 flex max-h-[calc(100vh-1rem)] w-full flex-col ${sizeClasses[size]} ${className}`}>
        {title || showCloseButton ? (
          <div className="app-panel-header flex shrink-0 items-center justify-between">
            {title ? <h2 className="text-2xl font-bold text-slate-100">{title}</h2> : <div />}
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

  const modalTarget = getModalTarget();

  if (!modalTarget) {
    return modalContent;
  }

  return createPortal(modalContent, modalTarget);
}
