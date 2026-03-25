import { AlertCircle, FileQuestion, Inbox, Package, Search } from 'lucide-react';

export default function EmptyState({
  type = 'no-data',
  title,
  description,
  action,
  icon: CustomIcon,
  className = '',
}) {
  const getDefaultConfig = () => {
    switch (type) {
      case 'no-results':
        return {
          icon: Search,
          title: title || 'Không tìm thấy kết quả',
          description: description || 'Không có dữ liệu phù hợp với điều kiện tìm kiếm hiện tại.',
          iconColor: 'text-amber-500',
          bgColor: 'bg-amber-50 dark:bg-amber-950/30',
        };
      case 'error':
        return {
          icon: AlertCircle,
          title: title || 'Có lỗi xảy ra',
          description: description || 'Không thể tải dữ liệu. Vui lòng thử lại sau.',
          iconColor: 'text-red-500',
          bgColor: 'bg-red-50 dark:bg-red-950/30',
        };
      case 'not-found':
        return {
          icon: FileQuestion,
          title: title || 'Không tìm thấy nội dung',
          description: description || 'Dữ liệu bạn đang tìm có thể đã bị xóa hoặc không còn tồn tại.',
          iconColor: 'text-orange-500',
          bgColor: 'bg-orange-50 dark:bg-orange-950/30',
        };
      case 'no-data':
      default:
        return {
          icon: Inbox,
          title: title || 'Chưa có dữ liệu',
          description: description || 'Hiện chưa có dữ liệu nào để hiển thị.',
          iconColor: 'text-blue-500',
          bgColor: 'bg-blue-50 dark:bg-blue-950/30',
        };
    }
  };

  const config = getDefaultConfig();
  const IconComponent = CustomIcon || config.icon || Package;

  return (
    <div className={`flex flex-col items-center justify-center px-6 py-16 ${className}`}>
      <div className={`mb-5 rounded-3xl p-5 ${config.bgColor}`}>
        <IconComponent size={48} className={config.iconColor} strokeWidth={1.75} />
      </div>

      <div className="max-w-md text-center">
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{config.title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-300">{config.description}</p>
        {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
      </div>
    </div>
  );
}
