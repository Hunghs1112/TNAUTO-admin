import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { serviceOrderImagesAPI, serviceOrdersAPI, uploadAPI } from '../../services/api';
import { useLoadingKey } from '../../contexts/LoadingContext';
import { useToast } from '../../contexts/ToastContext';
import { formatDate, isValidImageUrl, normalizeImageUrl } from '../../utils/format';
import {
  canAdminAssignServiceOrder,
  getAdminServiceOrderStatusOptions,
  getServiceOrderAssigneeLabel,
  getServiceOrderAssignmentHint,
  getServiceOrderAssignSuccessMessage,
  getServiceOrderFlowHint,
  getServiceOrderStatusLabel,
  isOrderWaitingForClaim,
  isServiceOrderClosed,
} from '../../utils/serviceOrderFlow';
import ImageGrid from '../image/ImageGrid';
import ImageUploader from '../image/ImageUploader';
import LoadingSpinner from '../ui/LoadingSpinner';
import StatusBadge from '../ui/StatusBadge';
import useDetailFetchGuard from '../../hooks/useDetailFetchGuard';

function formatYYYYMMDD(date) {
  const parsedDate = new Date(date);
  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
  const day = String(parsedDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getErrorMessage(error, fallbackMessage) {
  return error.response?.data?.error || error.response?.data?.message || error.message || fallbackMessage;
}

export default function ServiceOrderDetailModal({
  isOpen,
  orderId,
  employees = [],
  onClose,
  onRefresh,
}) {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderImages, setOrderImages] = useState([]);
  const [showImageUploader, setShowImageUploader] = useState(false);
  const { shouldSkipFetch, beginFetch, completeFetch, failFetch, resetFetchGuard } = useDetailFetchGuard();

  const {
    startLoading: startDetailLoading,
    stopLoading: stopDetailLoading,
    loading: loadingDetail,
  } = useLoadingKey('service-orders-detail', 'Đang tải chi tiết...');
  const { success, error } = useToast();

  const waitingForClaim = useMemo(() => isOrderWaitingForClaim(selectedOrder), [selectedOrder]);
  const statusLabel = useMemo(() => getServiceOrderStatusLabel(selectedOrder), [selectedOrder]);
  const assigneeLabel = useMemo(() => getServiceOrderAssigneeLabel(selectedOrder), [selectedOrder]);
  const flowHint = useMemo(() => getServiceOrderFlowHint(selectedOrder), [selectedOrder]);
  const assignmentHint = useMemo(() => getServiceOrderAssignmentHint(selectedOrder), [selectedOrder]);
  const statusOptions = useMemo(() => getAdminServiceOrderStatusOptions(selectedOrder), [selectedOrder]);
  const isClosedOrder = useMemo(() => isServiceOrderClosed(selectedOrder), [selectedOrder]);
  const canAssignEmployee = useMemo(() => canAdminAssignServiceOrder(selectedOrder), [selectedOrder]);

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetails(orderId);
      return;
    }

    setSelectedOrder(null);
    setOrderImages([]);
    setShowImageUploader(false);
    resetFetchGuard();
  }, [isOpen, orderId]);

  const fetchOrderDetails = async (id, { force = false } = {}) => {
    if (shouldSkipFetch(id, force)) return;

    beginFetch();
    startDetailLoading('Đang tải chi tiết đơn dịch vụ...');

    try {
      // Fetch order details và images song song, tránh N+1
      const [orderResponse, imagesResponse] = await Promise.all([
        serviceOrdersAPI.getById(id),
        serviceOrderImagesAPI.getByOrder(id),
      ]);

      const orderData = orderResponse.data.data || orderResponse.data;
      setSelectedOrder(orderData || null);

      const imagesData = imagesResponse.data.data || imagesResponse.data;
      const validImages = Array.isArray(imagesData)
        ? imagesData
            .filter((image) => image.image_url && isValidImageUrl(image.image_url))
            .map((image) => ({
              ...image,
              image_url: normalizeImageUrl(image.image_url) || image.image_url,
            }))
            .filter((image) => image.image_url)
        : [];

      setOrderImages(validImages);
      completeFetch(id);
    } catch (fetchError) {
      error(`Không thể tải chi tiết đơn dịch vụ: ${getErrorMessage(fetchError, 'Lỗi không xác định')}`);
      setSelectedOrder(null);
      setOrderImages([]);
      failFetch();
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

    startDetailLoading('Đang tải ảnh lên...');

    try {
      const urls = Array.isArray(imageUrls) ? imageUrls : [imageUrls];
      const validUrls = urls.filter(
        (url) => typeof url === 'string' && url.trim() && !url.startsWith('data:image/')
      );

      if (!validUrls.length) {
        error('Không nhận được URL ảnh hợp lệ để lưu cho đơn dịch vụ.');
        return;
      }

      for (const imageUrl of validUrls) {
        await serviceOrderImagesAPI.create({
          order_id: Number(selectedOrder.id),
          image_url: imageUrl,
          status_at_time: selectedOrder.status || 'received',
        });
      }

      await fetchOrderDetails(selectedOrder.id, { force: true });
      setShowImageUploader(false);
      onRefresh?.();
      success(`Da them ${validUrls.length} anh cho don dich vu.`);
    } catch (uploadError) {
      error(`Lưu thông tin ảnh thất bại: ${getErrorMessage(uploadError, 'Lỗi không xác định')}`);
    } finally {
      stopDetailLoading();
    }
  };

  const handleDeleteImage = async (imageId, imageUrl) => {
    if (!window.confirm('Bạn có chắc muốn xóa hình ảnh này?')) {
      return;
    }

    startDetailLoading('Đang xóa ảnh...');

    try {
      await serviceOrderImagesAPI.delete(imageId);

      const uploadedFileName = imageUrl.split('/uploads/')[1];
      if (uploadedFileName) {
        try {
          await uploadAPI.delete(uploadedFileName);
        } catch {
          // Bỏ qua nếu file vật lý đã không còn trên server.
        }
      }

      if (selectedOrder) {
        await fetchOrderDetails(selectedOrder.id, { force: true });
      }

      onRefresh?.();
      success('Đã xóa ảnh của đơn dịch vụ.');
    } catch (deleteError) {
      error(`Xóa ảnh thất bại: ${getErrorMessage(deleteError, 'Lỗi không xác định')}`);
    } finally {
      stopDetailLoading();
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedOrder || !newStatus || newStatus === selectedOrder.status) {
      return;
    }

    if (!selectedOrder.employee_id && ['in_progress', 'ready_for_pickup', 'completed'].includes(newStatus)) {
      error('Vui lòng giao việc cho nhân viên trước khi chuyển đơn sang trạng thái xử lý.');
      return;
    }

    startDetailLoading(
      newStatus === 'completed' ? 'Đang hoàn thành đơn dịch vụ...' : 'Đang cập nhật trạng thái...'
    );

    try {
      if (newStatus === 'completed') {
        const deliveryDate = selectedOrder.delivery_date
          ? formatYYYYMMDD(selectedOrder.delivery_date)
          : formatYYYYMMDD(new Date());

        const response = await serviceOrdersAPI.complete(selectedOrder.id, {
          delivery_date: deliveryDate,
        });

        await fetchOrderDetails(selectedOrder.id, { force: true });
        onRefresh?.();
        success(response?.data?.message || 'Hoàn thành đơn dịch vụ thành công.');
        return;
      }

      await serviceOrdersAPI.updateStatus(selectedOrder.id, { status: newStatus });
      await fetchOrderDetails(selectedOrder.id, { force: true });
      onRefresh?.();
      success('Cập nhật trạng thái thành công.');
    } catch (statusError) {
      error(`Cập nhật trạng thái thất bại: ${getErrorMessage(statusError, 'Lỗi không xác định')}`);
    } finally {
      stopDetailLoading();
    }
  };

  const handleAssignEmployee = async (employeeId) => {
    if (!selectedOrder || !employeeId || String(employeeId) === String(selectedOrder.employee_id || '')) {
      return;
    }

    if (!canAssignEmployee) {
      error('Chỉ có thể giao hoặc chuyển nhân viên cho đơn còn mở.');
      return;
    }

    const wasWaitingForClaim = isOrderWaitingForClaim(selectedOrder);
    const hadAssignedEmployee = Boolean(selectedOrder.employee_id);
    startDetailLoading('Đang giao việc...');

    try {
      const response = await serviceOrdersAPI.assign(selectedOrder.id, { employee_id: Number(employeeId) });
      const assignResult = response?.data?.data || response?.data || {};

      await fetchOrderDetails(selectedOrder.id, { force: true });
      onRefresh?.();

      const successMessage = getServiceOrderAssignSuccessMessage(
        assignResult,
        hadAssignedEmployee && !wasWaitingForClaim
      );

      success(
        wasWaitingForClaim && assignResult.action !== 'already_assigned_to_same_employee'
          ? `${successMessage} Đơn sẽ rời khỏi danh sách chờ nhận trên app.`
          : successMessage
      );
    } catch (assignError) {
      error(`Giao việc thất bại: ${getErrorMessage(assignError, 'Lỗi không xác định')}`);
    } finally {
      stopDetailLoading();
    }
  };

  const handleDeleteOrder = async () => {
    if (!selectedOrder) {
      return;
    }

    if (!window.confirm('Bạn có chắc muốn xóa đơn dịch vụ này?')) {
      return;
    }

    startDetailLoading('Đang xóa đơn dịch vụ...');

    try {
      await serviceOrdersAPI.delete(selectedOrder.id);
      success('Đã xóa đơn dịch vụ.');
      onRefresh?.();
      onClose();
    } catch (deleteError) {
      error(`Xóa đơn thất bại: ${getErrorMessage(deleteError, 'Lỗi không xác định')}`);
    } finally {
      stopDetailLoading();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 backdrop-blur-sm sm:p-4">
      <div className="flex max-h-[95vh] w-full max-w-5xl flex-col rounded-xl border border-slate-700/50 bg-slate-800 shadow-2xl  ">
        <div className="gradient-header flex-shrink-0 border-b border-slate-700 p-4 transition-colors duration-300 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-100 transition-colors duration-300 sm:text-xl">
                {selectedOrder ? `Chi tiết đơn dịch vụ #${selectedOrder.id}` : 'Đang tải...'}
              </h3>
              {selectedOrder ? (
                <div className="mt-2">
                  <StatusBadge
                    status={selectedOrder.status}
                    type="order"
                    labelOverride={statusLabel}
                  />
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-500 transition-all duration-200 hover:bg-slate-700 hover:text-slate-200 active:scale-95"
              aria-label="Đóng"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {loadingDetail ? (
          <div className="flex flex-1 items-center justify-center p-8">
            <LoadingSpinner size="lg" message="Đang tải thông tin đơn dịch vụ..." />
          </div>
        ) : null}

        {!loadingDetail && selectedOrder ? (
          <div className="flex-1 space-y-4 overflow-y-auto bg-slate-800 p-4 transition-colors duration-300 sm:p-6">
            {flowHint ? (
              <div
                className={`rounded-xl border px-4 py-3 text-sm ${
                  waitingForClaim
                    ? 'border-[#c37b1e]/30 bg-[#c37b1e]/12 text-[#eecd7e]'
                    : 'border-[#1e406b]/30 bg-[#1e406b]/12 text-[#eecd7e]'
                }`}
              >
                {flowHint}
              </div>
            ) : null}

            <div className="rounded-xl border border-slate-600 bg-slate-700/50 p-4">
              <h4 className="mb-3 text-base font-semibold text-slate-300 sm:text-lg">
                Thông tin đơn dịch vụ
              </h4>
              <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div>
                  <span className="font-medium text-slate-300">Khách hàng:</span>{' '}
                  <span className="text-slate-100">{selectedOrder.customer_name || '-'}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-300">SDT:</span>{' '}
                  <span className="text-slate-100">{selectedOrder.receiver_phone || '-'}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-300">Dịch vụ:</span>{' '}
                  <span className="text-slate-100">{selectedOrder.service_name || '-'}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-300">Nhà cung cấp:</span>{' '}
                  <span className="text-slate-100">
                    {selectedOrder.service_supplier_name || selectedOrder.supplier_name || '-'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-slate-300">Nhân viên:</span>{' '}
                  <span
                    className={
                      waitingForClaim
                        ? 'font-medium text-[#eecd7e]'
                        : 'text-slate-100'
                    }
                  >
                    {assigneeLabel}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-slate-300">Trạng thái đơn:</span>{' '}
                  <StatusBadge
                    status={selectedOrder.status}
                    type="order"
                    labelOverride={statusLabel}
                  />
                </div>
                <div>
                  <span className="font-medium text-slate-300">Ngày nhận:</span>{' '}
                  <span className="text-slate-100">
                    {selectedOrder.receive_date
                      ? new Date(selectedOrder.receive_date).toLocaleDateString('vi-VN')
                      : '-'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-slate-300">Ngày giao:</span>{' '}
                  <span className="text-slate-100">
                    {selectedOrder.delivery_date
                      ? new Date(selectedOrder.delivery_date).toLocaleDateString('vi-VN')
                      : '-'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-slate-300">Ngày tạo:</span>{' '}
                  <span className="text-slate-100">{formatDate(selectedOrder.created_at)}</span>
                </div>
                {selectedOrder.address ? (
                  <div className="sm:col-span-2">
                    <span className="font-medium text-slate-300">Dia chi:</span>{' '}
                    <span className="text-slate-100">{selectedOrder.address}</span>
                  </div>
                ) : null}
                {selectedOrder.note ? (
                  <div className="sm:col-span-2">
                    <span className="font-medium text-slate-300">Ghi chú:</span>{' '}
                    <span className="text-slate-100">{selectedOrder.note}</span>
                  </div>
                ) : null}
              </div>
            </div>

            {selectedOrder.license_plate || selectedOrder.vehicle_model ? (
              <div className="rounded-xl border border-[#1e406b]/30 bg-[#112552]/18 p-4">
                <h4 className="mb-3 text-base font-semibold text-slate-300 sm:text-lg">
                  Thong tin xe
                </h4>
                <div className="flex gap-4">
                  {selectedOrder.vehicle_image_url ? (
                    <div className="flex-shrink-0">
                      <img
                        src={normalizeImageUrl(selectedOrder.vehicle_image_url) || selectedOrder.vehicle_image_url}
                        alt="Xe"
                        className="h-24 w-24 rounded-lg border-2 border-slate-600 bg-slate-800 object-cover sm:h-32 sm:w-32"
                        onError={(event) => {
                          event.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  ) : null}

                  <div className="grid flex-1 grid-cols-1 gap-2 text-sm text-slate-100">
                    {selectedOrder.license_plate ? (
                      <div>
                        <span className="font-medium text-slate-300">Biển số xe:</span>{' '}
                        <span className="rounded bg-[#e0a02e] px-3 py-1 font-bold text-[#112552]">
                          {selectedOrder.license_plate}
                        </span>
                      </div>
                    ) : null}
                    {selectedOrder.vehicle_model ? (
                      <div>
                        <span className="font-medium text-slate-300">Mẫu xe:</span>{' '}
                        {selectedOrder.vehicle_model}
                      </div>
                    ) : null}
                    {selectedOrder.vehicle_type ? (
                      <div>
                        <span className="font-medium text-slate-300">Loai xe:</span>{' '}
                        {selectedOrder.vehicle_type}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="rounded-xl border border-slate-600 bg-slate-700/50 p-4">
              <h4 className="mb-3 text-base font-semibold text-slate-300 sm:text-lg">
                Thao tac
              </h4>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Trạng thái đơn
                  </label>
                  <select
                    value={selectedOrder.status || ''}
                    onChange={(event) => handleStatusChange(event.target.value)}
                    className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-2.5 text-slate-100 shadow-sm transition-all duration-200 hover:shadow-md focus:border-[#e0a02e] focus:ring-2 focus:ring-[#1e406b]/50 focus:shadow-lg"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-slate-400">
                    {waitingForClaim
                      ? 'Đơn chỉ nên chuyển sang xử lý sau khi có nhân viên nhận hoặc được admin giao thủ công.'
                      : 'Trạng thái này sẽ đồng bộ với app nhân viên và các thông báo liên quan.'}
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Nhân viên phụ trách
                  </label>
                  <select
                    value={selectedOrder.employee_id || ''}
                    onChange={(event) => handleAssignEmployee(event.target.value)}
                    disabled={isClosedOrder}
                    className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-2.5 text-slate-100 shadow-sm transition-all duration-200 hover:shadow-md focus:border-[#e0a02e] focus:ring-2 focus:ring-[#1e406b]/50 focus:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="">
                      {waitingForClaim ? 'Chọn nhân viên để giao thủ công' : 'Chưa giao'}
                    </option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name} ({employee.phone})
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-slate-400">
                    {assignmentHint}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-600 bg-slate-700/50 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h4 className="text-base font-semibold text-slate-300 sm:text-lg">
                  Hình ảnh đơn dịch vụ ({orderImages.length})
                </h4>
                <button
                  type="button"
                  onClick={() => setShowImageUploader((current) => !current)}
                  className="btn-gradient-primary flex items-center gap-1 px-3 py-1.5 text-sm font-medium"
                >
                  <Plus size={16} />
                  {showImageUploader ? 'Đóng' : 'Thêm ảnh'}
                </button>
              </div>

              {showImageUploader ? (
                <div className="mb-4 rounded-lg border border-slate-600 bg-slate-800 p-3">
                  <ImageUploader
                    onUploadSuccess={handleImageUpload}
                    multiple={true}
                    maxFiles={10}
                    uploadMode="both"
                    allowFileUpload={true}
                    allowLinkUpload={true}
                  />
                </div>
              ) : null}

              <ImageGrid
                images={orderImages}
                onDelete={handleDeleteImage}
                emptyTitle="Chưa có hình ảnh"
                emptyDescription="Đơn dịch vụ này chưa có hình ảnh nào."
              />
            </div>
          </div>
        ) : null}

        {!loadingDetail && selectedOrder ? (
          <div className="flex-shrink-0 border-t border-slate-600 bg-slate-800 p-4   sm:p-6">
            <div className="flex flex-col justify-between gap-2 sm:flex-row">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleDeleteOrder}
                  className="btn-gradient-error flex items-center gap-2 px-4 py-2 text-sm font-medium"
                >
                  <Trash2 size={16} />
                  Xóa
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-700 px-4 py-2.5 text-sm font-medium text-slate-200 shadow-sm transition-all duration-200 hover:bg-slate-600 hover:shadow-md active:scale-[0.98]"
              >
                <X size={16} />
                Đóng
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
