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
          iconColor: 'text-[#eecd7e]',
          bgColor: 'bg-[#c37b1e]/15 ring-1 ring-[#e0a02e]/30',
        };
      case 'error':
        return {
          icon: AlertCircle,
          title: title || 'Có lỗi xảy ra',
          description: description || 'Không thể tải dữ liệu. Vui lòng thử lại sau.',
          iconColor: 'text-[#b48242]',
          bgColor: 'bg-[#b48242]/15 ring-1 ring-[#b48242]/30',
        };
      case 'not-found':
        return {
          icon: FileQuestion,
          title: title || 'Không tìm thấy nội dung',
          description: description || 'Dữ liệu bạn đang tìm có thể đã bị xóa hoặc không còn tồn tại.',
          iconColor: 'text-[#e0a02e]',
          bgColor: 'bg-[#b48242]/15 ring-1 ring-[#b48242]/30',
        };
      case 'no-data':
      default:
        return {
          icon: Inbox,
          title: title || 'Chưa có dữ liệu',
          description: description || 'Hiện chưa có dữ liệu nào để hiển thị.',
          iconColor: 'text-[#dfe1e3]',
          bgColor: 'bg-[#1e406b]/15 ring-1 ring-[#1e406b]/30',
        };
    }
  };

  const config = getDefaultConfig();
  const IconComponent = CustomIcon || config.icon || Package;

  return (
    <div className={`flex flex-col items-center justify-center px-6 py-16 ${className}`}>
      <div className={`mb-5 rounded-3xl p-5 ${config.bgColor}`}>
        <IconComponent size={46} className={config.iconColor} strokeWidth={1.75} />
      </div>

      <div className="max-w-md text-center">
        <h3 className="text-xl font-bold text-white">{config.title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-300">{config.description}</p>
        {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
      </div>
    </div>
  );
}
