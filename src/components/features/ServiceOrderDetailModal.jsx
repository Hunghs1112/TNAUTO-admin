// src/components/features/ServiceOrderDetailModal.jsx
import React, { useState, useEffect } from 'react';
import { serviceOrdersAPI, serviceOrderImagesAPI, uploadAPI } from '../../services/api';
import { formatDate, isValidImageUrl, normalizeImageUrl } from '../../utils/format';
import StatusBadge from '../ui/StatusBadge';
import LoadingSpinner from '../ui/LoadingSpinner';
import ImageUploader from '../image/ImageUploader';
import ImageGrid from '../image/ImageGrid';
import { useLoadingKey } from '../../contexts/LoadingContext';
import { useToast } from '../../contexts/ToastContext';
import { Plus, Trash2, X } from 'lucide-react';

/**
 * Service Order Detail Modal Component
 * Form chi tiết riêng cho đơn dịch vụ
 * Cho phép sửa: trạng thái, thêm/xóa ảnh, gán/đổi nhân viên
 * Các trường còn lại chỉ xem
 */
export default function ServiceOrderDetailModal({
  isOpen,
  orderId,
  employees = [],
  onClose,
  onRefresh
}) {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderImages, setOrderImages] = useState([]);
  const [showImageUploader, setShowImageUploader] = useState(false);

  const { startLoading: startDetailLoading, stopLoading: stopDetailLoading, loading: loadingDetail } = useLoadingKey('service-orders-detail', 'Đang tải chi tiết...');
  const { success, error } = useToast();

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetails(orderId);
    } else {
      // Reset state when modal closes
      setSelectedOrder(null);
      setOrderImages([]);
      setShowImageUploader(false);
    }
  }, [isOpen, orderId]);

  const fetchOrderDetails = async (id) => {
    startDetailLoading('Đang tải chi tiết đơn dịch vụ...');
    try {
      const orderRes = await serviceOrdersAPI.getById(id);
      const orderData = orderRes.data.data || orderRes.data;
      setSelectedOrder(orderData || null);

      const imagesRes = await serviceOrderImagesAPI.getByOrder(id);
      const imagesData = imagesRes.data.data || imagesRes.data;
      const validImages = Array.isArray(imagesData) 
        ? imagesData
            .filter(img => img.image_url && isValidImageUrl(img.image_url))
            .map(img => {
              const normalizedUrl = normalizeImageUrl(img.image_url);
              return {
                ...img,
                image_url: normalizedUrl || img.image_url // Fallback về URL gốc nếu normalize trả về null
              };
            })
            .filter(img => img.image_url) // Chỉ giữ lại những ảnh có URL hợp lệ
        : [];
      setOrderImages(validImages);
    } catch (err) {
      console.error('Fetch order details/images error:', err);
      error('Không thể tải chi tiết đơn dịch vụ: ' + (err.response?.data?.message || err.message));
      setSelectedOrder(null);
      setOrderImages([]);
      onClose();
    } finally {
      stopDetailLoading();
    }
  };

  const handleImageUpload = async (imageUrls) => {
    if (!selectedOrder) {
      error('Vui lòng chọn đơn dịch vụ');
      return;
    }

    try {
      startDetailLoading('Đang tải ảnh lên...');
      const urls = Array.isArray(imageUrls) ? imageUrls : [imageUrls];
      
      for (const imageUrl of urls) {
        if (imageUrl.startsWith('data:image/')) {
          continue;
        }
        
        const imageData = {
          order_id: parseInt(selectedOrder.id),
          image_url: imageUrl,
          status_at_time: selectedOrder.status || 'received',
        };
        
        await serviceOrderImagesAPI.create(imageData);
      }
      
      const validUrls = urls.filter(url => !url.startsWith('data:image/'));
      
      // Hiển thị thông báo thành công
      success(`Thêm thành công ${validUrls.length} ảnh!`);
      
      // Refresh danh sách ảnh mà không reload trang
      await fetchOrderDetails(selectedOrder.id);
      setShowImageUploader(false);
      onRefresh && onRefresh();
    } catch (err) {
      console.error('Create image record error:', err);
      error('Lỗi khi lưu thông tin ảnh: ' + (err.response?.data?.message || err.message));
    } finally {
      stopDetailLoading();
    }
  };

  const handleDeleteImage = async (imageId, imageUrl) => {
    if (!confirm('Xóa hình ảnh này?')) return;
    
    try {
      startDetailLoading('Đang xóa ảnh...');
      
      await serviceOrderImagesAPI.delete(imageId);
      
      const filename = imageUrl.split('/uploads/')[1];
      if (filename) {
        try {
          await uploadAPI.delete(filename);
        } catch (err) {
          console.warn('Could not delete file from server:', err);
        }
      }
      
      // Hiển thị thông báo thành công
      success('Xóa ảnh thành công!');
      
      // Refresh danh sách ảnh mà không reload trang
      if (selectedOrder) {
        await fetchOrderDetails(selectedOrder.id);
      }
      onRefresh && onRefresh();
    } catch (err) {
      console.error('Delete image error:', err);
      error('Lỗi khi xóa ảnh');
    } finally {
      stopDetailLoading();
    }
  };

  const formatYYYYMMDD = (date) => {
    const d = new Date(date);
    // Use local date parts to avoid timezone shifting the day
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedOrder) return;

    try {
      // Nếu chuyển sang "completed" phải dùng endpoint /complete để đảm bảo tạo bảo hành theo nghiệp vụ
      if (newStatus === 'completed') {
        startDetailLoading('Đang hoàn thành đơn dịch vụ...');

        // delivery_date là BẮT BUỘC: ưu tiên lấy từ order. Nếu chưa có thì yêu cầu người dùng cập nhật delivery_date trước.
        const deliveryDate = selectedOrder.delivery_date
          ? formatYYYYMMDD(selectedOrder.delivery_date)
          : null;

        if (!deliveryDate) {
          error('Thiếu ngày giao (delivery_date). Vui lòng cập nhật ngày giao trước khi hoàn thành.');
          return;
        }

        // warranty_period: optional. Không gửi thì backend tự lấy theo service.
        const res = await serviceOrdersAPI.complete(selectedOrder.id, {
          delivery_date: deliveryDate,
        });

        await fetchOrderDetails(selectedOrder.id);

        const msg = res?.data?.message || 'Hoàn thành đơn dịch vụ thành công!';
        success(msg);
        onRefresh && onRefresh();
        return;
      }

      // Các trạng thái khác vẫn dùng endpoint update status như cũ
      startDetailLoading('Đang cập nhật trạng thái...');
      await serviceOrdersAPI.updateStatus(selectedOrder.id, { status: newStatus });
      await fetchOrderDetails(selectedOrder.id);
      success('Cập nhật trạng thái thành công!');
      onRefresh && onRefresh();
    } catch (err) {
      console.error('Update status error:', err);
      error('Có lỗi xảy ra khi cập nhật trạng thái: ' + (err.response?.data?.message || err.message));
    } finally {
      stopDetailLoading();
    }
  };

  const handleAssignEmployee = async (employeeId) => {
    if (!selectedOrder || !employeeId) return;

    try {
      startDetailLoading('Đang giao việc...');
      await serviceOrdersAPI.assign(selectedOrder.id, { employee_id: parseInt(employeeId) });
      await fetchOrderDetails(selectedOrder.id);
      success('Giao việc thành công!');
      onRefresh && onRefresh();
    } catch (err) {
      console.error('Assign error:', err);
      error('Có lỗi xảy ra khi giao việc: ' + (err.response?.data?.message || err.message));
    } finally {
      stopDetailLoading();
    }
  };

  const handleDeleteOrder = async () => {
    if (!selectedOrder) return;
    if (!confirm('Bạn có chắc chắn muốn xóa đơn dịch vụ này?')) return;

    try {
      startDetailLoading('Đang xóa đơn dịch vụ...');
      await serviceOrdersAPI.delete(selectedOrder.id);
      success('Xóa đơn dịch vụ thành công!');
      onClose();
      onRefresh && onRefresh();
      // Reload page to refresh table
      window.location.reload();
    } catch (err) {
      console.error('Delete order error:', err);
      error('Có lỗi xảy ra khi xóa: ' + (err.response?.data?.message || err.message));
    } finally {
      stopDetailLoading();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Order Detail Modal */}
      <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 animate-fade-in">
        <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-5xl max-h-[95vh] flex flex-col shadow-2xl border border-gray-200/50 dark:border-slate-700/50 animate-fade-in">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-slate-700 flex-shrink-0 gradient-header transition-colors duration-300">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 transition-colors duration-300">
                  {selectedOrder ? `Chi tiết đơn dịch vụ #${selectedOrder.id}` : 'Đang tải...'}
                </h3>
                {selectedOrder && (
                  <div className="mt-2">
                    <StatusBadge status={selectedOrder.status} type="order" />
                  </div>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-all duration-200 active:scale-95"
                aria-label="Đóng"
              >
                <X size={20} />
              </button>
            </div>
          </div>
          
          {/* Loading State */}
          {loadingDetail && (
            <div className="flex-1 flex items-center justify-center p-8">
              <LoadingSpinner size="lg" message="Đang tải thông tin đơn dịch vụ..." />
            </div>
          )}
          
          {/* Content */}
          {!loadingDetail && selectedOrder && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white dark:bg-slate-800 transition-colors duration-300 space-y-4">
              {/* Thông tin đơn dịch vụ - Chỉ xem */}
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 border border-gray-200 dark:border-slate-600">
                <h4 className="font-semibold text-base sm:text-lg mb-3 text-gray-700 dark:text-gray-300">
                  Thông tin đơn dịch vụ
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div><span className="font-medium text-gray-700 dark:text-gray-300">Khách hàng:</span> <span className="text-gray-900 dark:text-gray-100">{selectedOrder.customer_name || '-'}</span></div>
                  <div><span className="font-medium text-gray-700 dark:text-gray-300">SĐT:</span> <span className="text-gray-900 dark:text-gray-100">{selectedOrder.receiver_phone || '-'}</span></div>
                  <div><span className="font-medium text-gray-700 dark:text-gray-300">Loại dịch vụ:</span> <span className="text-gray-900 dark:text-gray-100">{selectedOrder.service_name || '-'}</span></div>
                  <div><span className="font-medium text-gray-700 dark:text-gray-300">Nhân viên:</span> <span className="text-gray-900 dark:text-gray-100">{selectedOrder.employee_name || 'Chưa giao'}</span></div>
                  <div><span className="font-medium text-gray-700 dark:text-gray-300">Ngày nhận:</span> <span className="text-gray-900 dark:text-gray-100">{selectedOrder.receive_date ? new Date(selectedOrder.receive_date).toLocaleDateString('vi-VN') : '-'}</span></div>
                  <div><span className="font-medium text-gray-700 dark:text-gray-300">Ngày giao:</span> <span className="text-gray-900 dark:text-gray-100">{selectedOrder.delivery_date ? new Date(selectedOrder.delivery_date).toLocaleDateString('vi-VN') : '-'}</span></div>
                  <div><span className="font-medium text-gray-700 dark:text-gray-300">Ngày tạo:</span> <span className="text-gray-900 dark:text-gray-100">{formatDate(selectedOrder.created_at)}</span></div>
                  {selectedOrder.address && (
                    <div className="sm:col-span-2"><span className="font-medium text-gray-700 dark:text-gray-300">Địa chỉ:</span> <span className="text-gray-900 dark:text-gray-100">{selectedOrder.address}</span></div>
                  )}
                  {selectedOrder.note && (
                    <div className="sm:col-span-2"><span className="font-medium text-gray-700 dark:text-gray-300">Ghi chú:</span> <span className="text-gray-900 dark:text-gray-100">{selectedOrder.note}</span></div>
                  )}
                </div>
              </div>

              {/* Thông tin xe - Chỉ xem */}
              {(selectedOrder.license_plate || selectedOrder.vehicle_model) && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-base sm:text-lg mb-3 text-gray-700 dark:text-gray-300">
                    Thông tin xe
                  </h4>
                  <div className="flex gap-4">
                    {selectedOrder.vehicle_image_url && (
                      <div className="flex-shrink-0">
                        <img 
                          src={normalizeImageUrl(selectedOrder.vehicle_image_url) || selectedOrder.vehicle_image_url} 
                          alt="Xe" 
                          className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg object-cover border-2 border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => {}}
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      </div>
                    )}
                    <div className="flex-1 grid grid-cols-1 gap-2 text-sm text-gray-900 dark:text-gray-100">
                      {selectedOrder.license_plate && (
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Biển số xe:</span>{' '}
                          <span className="bg-yellow-400 dark:bg-yellow-500 text-black dark:text-gray-900 px-3 py-1 rounded font-bold">
                            {selectedOrder.license_plate}
                          </span>
                        </div>
                      )}
                      {selectedOrder.vehicle_model && (
                        <div><span className="font-medium text-gray-700 dark:text-gray-300">Mẫu xe:</span> {selectedOrder.vehicle_model}</div>
                      )}
                      {selectedOrder.vehicle_type && (
                        <div><span className="font-medium text-gray-700 dark:text-gray-300">Loại xe:</span> {selectedOrder.vehicle_type}</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Thao tác - Có thể sửa: Trạng thái, Assign nhân viên */}
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 border border-gray-200 dark:border-slate-600">
                <h4 className="font-semibold text-base sm:text-lg mb-3 text-gray-700 dark:text-gray-300">
                  Thao tác
                </h4>
                <div className="space-y-3">
                  {/* Trạng thái - Có thể sửa */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Trạng thái
                    </label>
                    <select
                      value={selectedOrder.status || ''}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 transition-all duration-200 shadow-sm hover:shadow-md focus:shadow-lg"
                    >
                      <option value="received">Đã nhận</option>
                      <option value="in_progress">Đang xử lý</option>
                      <option value="completed">Hoàn thành</option>
                      <option value="cancelled">Đã hủy</option>
                    </select>
                  </div>

                  {/* Giao / đổi nhân viên */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nhân viên phụ trách
                    </label>
                    <select
                      value={selectedOrder.employee_id || ''}
                      onChange={(e) => {
                        const employeeId = e.target.value;
                        if (employeeId && employeeId !== String(selectedOrder.employee_id || '')) {
                          handleAssignEmployee(employeeId);
                        }
                      }}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 transition-all duration-200 shadow-sm hover:shadow-md focus:shadow-lg"
                    >
                      <option value="">Chưa giao</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} ({emp.phone})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Hình ảnh - Có thể thêm/xóa/xem */}
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 border border-gray-200 dark:border-slate-600">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-base sm:text-lg text-gray-700 dark:text-gray-300">
                    Hình ảnh đơn dịch vụ ({orderImages.length})
                  </h4>
                  <button
                    onClick={() => setShowImageUploader(!showImageUploader)}
                    className="btn-gradient-primary flex items-center gap-1 px-3 py-1.5 text-sm font-medium"
                  >
                    <Plus size={16} />
                    {showImageUploader ? 'Đóng' : 'Thêm ảnh'}
                  </button>
                </div>

                {/* Image Uploader */}
                {showImageUploader && (
                  <div className="mb-4 p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600">
                    <ImageUploader 
                      onUploadSuccess={handleImageUpload}
                      multiple={true}
                      maxFiles={10}
                      uploadMode="both"
                      allowFileUpload={true}
                      allowLinkUpload={true}
                    />
                  </div>
                )}

                {/* Image Grid */}
                <ImageGrid
                  images={orderImages}
                  onDelete={handleDeleteImage}
                  emptyTitle="Chưa có hình ảnh"
                  emptyDescription="Đơn dịch vụ này chưa có hình ảnh nào"
                />
              </div>
            </div>
          )}

          {/* Footer */}
          {!loadingDetail && selectedOrder && (
            <div className="p-4 sm:p-6 border-t border-gray-200 dark:border-slate-700 flex-shrink-0 bg-white dark:bg-slate-800">
              <div className="flex flex-col sm:flex-row gap-2 justify-between">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleDeleteOrder}
                    className="btn-gradient-error flex items-center gap-2 px-4 py-2 text-sm font-medium"
                  >
                    <Trash2 size={16} />
                    Xóa
                  </button>
                </div>
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-300 dark:hover:bg-slate-600 transition-all duration-200 font-medium text-sm shadow-sm hover:shadow-md active:scale-[0.98] flex items-center gap-2"
                >
                  <X size={16} />
                  Đóng
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

    </>
  );
}

