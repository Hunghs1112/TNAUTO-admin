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
  const bgColor = errorInfo.type === 'warning' ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200';
  const textColor = errorInfo.type === 'warning' ? 'text-yellow-800' : 'text-red-800';
  const iconColor = errorInfo.type === 'warning' ? 'text-yellow-500' : 'text-red-500';

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg border ${bgColor} shadow-lg`}>
      <div className="flex items-start gap-3">
        <AlertCircle className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`} />
        <div className="flex-1">
          <h4 className={`font-semibold ${textColor} mb-1`}>
            {errorInfo.title}
          </h4>
          <p className={`text-sm ${textColor} mb-3`}>
            {errorInfo.message}
          </p>
          
          {/* Error details for debugging */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mb-3">
              <summary className={`text-xs ${textColor} cursor-pointer`}>
                Chi tiết lỗi (Dev)
              </summary>
              <pre className={`text-xs ${textColor} mt-2 p-2 bg-white bg-opacity-50 rounded overflow-auto`}>
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
                className={`px-3 py-1 text-xs rounded ${textColor} border ${textColor} hover:bg-white hover:bg-opacity-20`}
              >
                Thử lại
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className={`px-3 py-1 text-xs rounded ${textColor} border ${textColor} hover:bg-white hover:bg-opacity-20`}
              >
                Đóng
              </button>
            )}
            <a
              href="https://github.com/your-repo/issues"
              target="_blank"
              rel="noopener noreferrer"
              className={`px-3 py-1 text-xs rounded ${textColor} border ${textColor} hover:bg-white hover:bg-opacity-20 flex items-center gap-1`}
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

