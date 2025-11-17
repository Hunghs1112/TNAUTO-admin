// src/contexts/ToastContext.jsx
import React, { createContext, useContext } from 'react';
import toast, { Toaster } from 'react-hot-toast';

const ToastContext = createContext(null);

/**
 * Toast Notification Context
 * Sử dụng react-hot-toast cho notifications đẹp và hiện đại
 */
export function ToastProvider({ children }) {
  const success = (message, duration = 3000) => {
    return toast.success(message, {
      duration,
      position: 'top-right',
      style: {
        background: 'var(--toast-success-bg, #10b981)',
        color: '#fff',
        borderRadius: '12px',
        padding: '12px 16px',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#10b981',
      },
    });
  };

  const error = (message, duration = 4000) => {
    return toast.error(message, {
      duration,
      position: 'top-right',
      style: {
        background: 'var(--toast-error-bg, #ef4444)',
        color: '#fff',
        borderRadius: '12px',
        padding: '12px 16px',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#ef4444',
      },
    });
  };

  const warning = (message, duration = 3000) => {
    return toast(message, {
      duration,
      position: 'top-right',
      icon: '⚠️',
      style: {
        background: 'var(--toast-warning-bg, #f59e0b)',
        color: '#fff',
        borderRadius: '12px',
        padding: '12px 16px',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
    });
  };

  const info = (message, duration = 3000) => {
    return toast(message, {
      duration,
      position: 'top-right',
      icon: 'ℹ️',
      style: {
        background: 'var(--toast-info-bg, #3b82f6)',
        color: '#fff',
        borderRadius: '12px',
        padding: '12px 16px',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
    });
  };

  const showToast = (message, type = 'info', duration = 3000) => {
    switch (type) {
      case 'success':
        return success(message, duration);
      case 'error':
        return error(message, duration);
      case 'warning':
        return warning(message, duration);
      case 'info':
      default:
        return info(message, duration);
    }
  };

  const clearAll = () => {
    toast.dismiss();
  };

  const value = {
    showToast,
    success,
    error,
    warning,
    info,
    clearAll,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        containerClassName="!z-[100]"
        toastOptions={{
          // Default options
          className: '',
          duration: 3000,
          style: {
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          },
          // Default options for specific types
          success: {
            duration: 3000,
            style: {
              background: '#10b981',
              color: '#fff',
              borderRadius: '12px',
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: '500',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#10b981',
            },
          },
          error: {
            duration: 4000,
            style: {
              background: '#ef4444',
              color: '#fff',
              borderRadius: '12px',
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: '500',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#ef4444',
            },
          },
        }}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

