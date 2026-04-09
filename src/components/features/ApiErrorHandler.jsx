// src/components/features/ApiErrorHandler.jsx
import { AlertCircle, ExternalLink } from 'lucide-react';

/**
 * Component để hiển thị lỗi API một cách user-friendly
 */
export default function ApiErrorHandler({ error, onRetry, onClose }) {
  if (!error) return null;

  const getErrorMessage = (error) => {
    if (error.message?.includes('not supported by the backend API')) {
      return {
        title: 'Chức năng chưa được hỗ trợ',
        message: 'Backend API chưa implement endpoint này. Vui lòng liên hệ developer để thêm endpoint.',
        type: 'warning'
      };
    }
    
    if (error.response?.status === 404) {
      return {
        title: 'Không tìm thấy endpoint',
        message: 'API endpoint không tồn tại hoặc không được hỗ trợ.',
        type: 'error'
      };
    }
    
    if (error.response?.status === 401) {
      return {
        title: 'Không có quyền truy cập',
        message: 'Bạn cần đăng nhập để thực hiện thao tác này.',
        type: 'error'
      };
    }
    
    if (error.response?.status === 403) {
      return {
        title: 'Không có quyền',
        message: 'Bạn không có quyền thực hiện thao tác này.',
        type: 'error'
      };
    }
    
    if (error.response?.status >= 500) {
      return {
        title: 'Lỗi server',
        message: 'Server đang gặp sự cố. Vui lòng thử lại sau.',
        type: 'error'
      };
    }
    
    return {
      title: 'Có lỗi xảy ra',
      message: error.message || 'Không thể thực hiện thao tác này.',
      type: 'error'
    };
  };

  const errorInfo = getErrorMessage(error);
  const tone = errorInfo.type === 'warning'
    ? {
        container: 'bg-[#c37b1e]/12 border-[#c37b1e]/30',
        title: 'text-[#f8ecd6]',
        text: 'text-[#eecd7e]',
        icon: 'text-[#eecd7e]',
        button: 'border-[#c37b1e]/30 text-[#f8ecd6] hover:bg-[#e0a02e]/10',
      }
    : {
        container: 'bg-[#b48242]/12 border-[#b48242]/30',
        title: 'text-[#f8ecd6]',
        text: 'text-[#eecd7e]',
        icon: 'text-[#b48242]',
        button: 'border-[#b48242]/30 text-[#f8ecd6] hover:bg-[#b48242]/12',
      };

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-md rounded-lg border p-4 shadow-lg backdrop-blur-sm ${tone.container}`}>
      <div className="flex items-start gap-3">
        <AlertCircle className={`mt-0.5 h-5 w-5 flex-shrink-0 ${tone.icon}`} />
        <div className="flex-1">
          <h4 className={`mb-1 font-semibold ${tone.title}`}>
            {errorInfo.title}
          </h4>
          <p className={`mb-3 text-sm ${tone.text}`}>
            {errorInfo.message}
          </p>
          
          {/* Error details for debugging */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mb-3">
              <summary className={`cursor-pointer text-xs ${tone.text}`}>
                Chi tiết lỗi (Dev)
              </summary>
              <pre className={`mt-2 overflow-auto rounded border border-white/10 bg-slate-950/70 p-2 text-xs ${tone.text}`}>
                {JSON.stringify({
                  status: error.response?.status,
                  statusText: error.response?.statusText,
                  message: error.message,
                  url: error.config?.url,
                  method: error.config?.method?.toUpperCase()
                }, null, 2)}
              </pre>
            </details>
          )}
          
          <div className="flex gap-2">
            {onRetry && (
              <button
                onClick={onRetry}
                className={`rounded border px-3 py-1 text-xs transition-colors ${tone.button}`}
              >
                Thử lại
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className={`rounded border px-3 py-1 text-xs transition-colors ${tone.button}`}
              >
                Đóng
              </button>
            )}
            <a
              href="https://github.com/your-repo/issues"
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-1 rounded border px-3 py-1 text-xs transition-colors ${tone.button}`}
            >
              Báo lỗi
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

