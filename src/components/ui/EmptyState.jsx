// src/components/ui/EmptyState.jsx
import React from 'react';
import { Package, Search, AlertCircle, FileQuestion, Inbox } from 'lucide-react';

/**
 * Beautiful empty state component with multiple variants
 * Displays appropriate icon, message and optional action button
 */
export default function EmptyState({ 
  type = 'no-data',
  title,
  description,
  action,
  icon: CustomIcon,
  className = ''
}) {
  const getDefaultConfig = () => {
    switch (type) {
      case 'no-data':
        return {
          icon: Inbox,
          title: title || 'Chưa có dữ liệu',
          description: description || 'Chưa có dữ liệu nào được tạo. Hãy thêm dữ liệu mới để bắt đầu.',
          iconColor: 'text-blue-400',
          bgColor: 'bg-blue-50'
        };
      case 'no-results':
        return {
          icon: Search,
          title: title || 'Không tìm thấy kết quả',
          description: description || 'Không có kết quả nào phù hợp với tiêu chí tìm kiếm của bạn.',
          iconColor: 'text-purple-400',
          bgColor: 'bg-purple-50'
        };
      case 'error':
        return {
          icon: AlertCircle,
          title: title || 'Có lỗi xảy ra',
          description: description || 'Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại sau.',
          iconColor: 'text-red-400',
          bgColor: 'bg-red-50'
        };
      case 'not-found':
        return {
          icon: FileQuestion,
          title: title || 'Không tìm thấy',
          description: description || 'Nội dung bạn tìm kiếm không tồn tại hoặc đã bị xóa.',
          iconColor: 'text-orange-400',
          bgColor: 'bg-orange-50'
        };
      default:
        return {
          icon: Package,
          title: title || 'Trống',
          description: description || 'Không có nội dung để hiển thị.',
          iconColor: 'text-gray-400',
          bgColor: 'bg-gray-50'
        };
    }
  };

  const config = getDefaultConfig();
  const IconComponent = CustomIcon || config.icon;

  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 ${className}`}>
      {/* Icon with animated background */}
      <div className={`relative mb-6`}>
        <div className={`absolute inset-0 ${config.bgColor} rounded-full animate-pulse opacity-20`}></div>
        <div className={`relative ${config.bgColor} rounded-full p-6`}>
          <IconComponent size={64} className={`${config.iconColor}`} strokeWidth={1.5} />
        </div>
      </div>

      {/* Content */}
      <div className="text-center max-w-md">
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          {config.title}
        </h3>
        <p className="text-gray-500 leading-relaxed mb-6">
          {config.description}
        </p>
        
        {/* Action Button */}
        {action && (
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {action}
          </div>
        )}
      </div>

      {/* Decorative elements */}
      <div className="mt-8 flex gap-2">
        <div className={`w-2 h-2 ${config.bgColor} rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></div>
        <div className={`w-2 h-2 ${config.bgColor} rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></div>
        <div className={`w-2 h-2 ${config.bgColor} rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  );
}
