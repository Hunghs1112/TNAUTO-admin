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
  } = useLoadingKey('service-orders-detail', 'Dang tai chi tiet...');
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
    startDetailLoading('Dang tai chi tiet don dich vu...');

    try {
      const orderResponse = await serviceOrdersAPI.getById(id);
      const orderData = orderResponse.data.data || orderResponse.data;
      setSelectedOrder(orderData || null);

      const imagesResponse = await serviceOrderImagesAPI.getByOrder(id);
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
      error(`Khong the tai chi tiet don dich vu: ${getErrorMessage(fetchError, 'Loi khong xac dinh')}`);
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
      error('Vui long chon don dich vu');
      return;
    }

    startDetailLoading('Dang tai anh len...');

    try {
      const urls = Array.isArray(imageUrls) ? imageUrls : [imageUrls];
      const validUrls = urls.filter(
        (url) => typeof url === 'string' && url.trim() && !url.startsWith('data:image/')
      );

      if (!validUrls.length) {
        error('Khong nhan duoc URL anh hop le de luu cho don dich vu.');
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
      error(`Luu thong tin anh that bai: ${getErrorMessage(uploadError, 'Loi khong xac dinh')}`);
    } finally {
      stopDetailLoading();
    }
  };

  const handleDeleteImage = async (imageId, imageUrl) => {
    if (!window.confirm('Ban co chac muon xoa hinh anh nay?')) {
      return;
    }

    startDetailLoading('Dang xoa anh...');

    try {
      await serviceOrderImagesAPI.delete(imageId);

      const uploadedFileName = imageUrl.split('/uploads/')[1];
      if (uploadedFileName) {
        try {
          await uploadAPI.delete(uploadedFileName);
        } catch {
          // Bo qua neu file vat ly da khong con tren server.
        }
      }

      if (selectedOrder) {
        await fetchOrderDetails(selectedOrder.id, { force: true });
      }

      onRefresh?.();
      success('Da xoa anh cua don dich vu.');
    } catch (deleteError) {
      error(`Xoa anh that bai: ${getErrorMessage(deleteError, 'Loi khong xac dinh')}`);
    } finally {
      stopDetailLoading();
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedOrder || !newStatus || newStatus === selectedOrder.status) {
      return;
    }

    if (!selectedOrder.employee_id && ['in_progress', 'ready_for_pickup', 'completed'].includes(newStatus)) {
      error('Vui long giao viec cho nhan vien truoc khi chuyen don sang trang thai xu ly.');
      return;
    }

    startDetailLoading(
      newStatus === 'completed' ? 'Dang hoan thanh don dich vu...' : 'Dang cap nhat trang thai...'
    );

    try {
      if (newStatus === 'completed') {
        const deliveryDate = selectedOrder.delivery_date
          ? formatYYYYMMDD(selectedOrder.delivery_date)
          : null;

        if (!deliveryDate) {
          error('Thieu ngay giao. Vui long cap nhat ngay giao truoc khi hoan thanh don.');
          return;
        }

        const response = await serviceOrdersAPI.complete(selectedOrder.id, {
          delivery_date: deliveryDate,
        });

        await fetchOrderDetails(selectedOrder.id, { force: true });
        onRefresh?.();
        success(response?.data?.message || 'Hoan thanh don dich vu thanh cong.');
        return;
      }

      await serviceOrdersAPI.updateStatus(selectedOrder.id, { status: newStatus });
      await fetchOrderDetails(selectedOrder.id, { force: true });
      onRefresh?.();
      success('Cap nhat trang thai thanh cong.');
    } catch (statusError) {
      error(`Cap nhat trang thai that bai: ${getErrorMessage(statusError, 'Loi khong xac dinh')}`);
    } finally {
      stopDetailLoading();
    }
  };

  const handleAssignEmployee = async (employeeId) => {
    if (!selectedOrder || !employeeId || String(employeeId) === String(selectedOrder.employee_id || '')) {
      return;
    }

    if (!canAssignEmployee) {
      error('Chi co the giao hoac chuyen nhan vien cho don con mo.');
      return;
    }

    const wasWaitingForClaim = isOrderWaitingForClaim(selectedOrder);
    const hadAssignedEmployee = Boolean(selectedOrder.employee_id);
    startDetailLoading('Dang giao viec...');

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
          ? `${successMessage} Don se roi khoi danh sach cho nhan tren app.`
          : successMessage
      );
    } catch (assignError) {
      error(`Giao viec that bai: ${getErrorMessage(assignError, 'Loi khong xac dinh')}`);
    } finally {
      stopDetailLoading();
    }
  };

  const handleDeleteOrder = async () => {
    if (!selectedOrder) {
      return;
    }

    if (!window.confirm('Ban co chac muon xoa don dich vu nay?')) {
      return;
    }

    startDetailLoading('Dang xoa don dich vu...');

    try {
      await serviceOrdersAPI.delete(selectedOrder.id);
      success('Da xoa don dich vu.');
      onRefresh?.();
      onClose();
    } catch (deleteError) {
      error(`Xoa don that bai: ${getErrorMessage(deleteError, 'Loi khong xac dinh')}`);
    } finally {
      stopDetailLoading();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 backdrop-blur-sm dark:bg-black/70 sm:p-4">
      <div className="flex max-h-[95vh] w-full max-w-5xl flex-col rounded-xl border border-gray-200/50 bg-white shadow-2xl dark:border-slate-700/50 dark:bg-slate-800">
        <div className="gradient-header flex-shrink-0 border-b border-gray-200 p-4 transition-colors duration-300 dark:border-slate-700 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 transition-colors duration-300 dark:text-gray-100 sm:text-xl">
                {selectedOrder ? `Chi tiet don dich vu #${selectedOrder.id}` : 'Dang tai...'}
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
              className="rounded-lg p-2 text-gray-400 transition-all duration-200 hover:bg-gray-100 hover:text-gray-600 active:scale-95 dark:text-gray-500 dark:hover:bg-slate-700 dark:hover:text-gray-300"
              aria-label="Dong"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {loadingDetail ? (
          <div className="flex flex-1 items-center justify-center p-8">
            <LoadingSpinner size="lg" message="Dang tai thong tin don dich vu..." />
          </div>
        ) : null}

        {!loadingDetail && selectedOrder ? (
          <div className="flex-1 space-y-4 overflow-y-auto bg-white p-4 transition-colors duration-300 dark:bg-slate-800 sm:p-6">
            {flowHint ? (
              <div
                className={`rounded-xl border px-4 py-3 text-sm ${
                  waitingForClaim
                    ? 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-100'
                    : 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-100'
                }`}
              >
                {flowHint}
              </div>
            ) : null}

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-slate-600 dark:bg-slate-700/50">
              <h4 className="mb-3 text-base font-semibold text-gray-700 dark:text-gray-300 sm:text-lg">
                Thong tin don dich vu
              </h4>
              <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Khach hang:</span>{' '}
                  <span className="text-gray-900 dark:text-gray-100">{selectedOrder.customer_name || '-'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">SDT:</span>{' '}
                  <span className="text-gray-900 dark:text-gray-100">{selectedOrder.receiver_phone || '-'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Dich vu:</span>{' '}
                  <span className="text-gray-900 dark:text-gray-100">{selectedOrder.service_name || '-'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Nha cung cap:</span>{' '}
                  <span className="text-gray-900 dark:text-gray-100">
                    {selectedOrder.service_supplier_name || selectedOrder.supplier_name || '-'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Nhan vien:</span>{' '}
                  <span
                    className={
                      waitingForClaim
                        ? 'font-medium text-amber-700 dark:text-amber-300'
                        : 'text-gray-900 dark:text-gray-100'
                    }
                  >
                    {assigneeLabel}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Trang thai don:</span>{' '}
                  <StatusBadge
                    status={selectedOrder.status}
                    type="order"
                    labelOverride={statusLabel}
                  />
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Ngay nhan:</span>{' '}
                  <span className="text-gray-900 dark:text-gray-100">
                    {selectedOrder.receive_date
                      ? new Date(selectedOrder.receive_date).toLocaleDateString('vi-VN')
                      : '-'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Ngay giao:</span>{' '}
                  <span className="text-gray-900 dark:text-gray-100">
                    {selectedOrder.delivery_date
                      ? new Date(selectedOrder.delivery_date).toLocaleDateString('vi-VN')
                      : '-'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Ngay tao:</span>{' '}
                  <span className="text-gray-900 dark:text-gray-100">{formatDate(selectedOrder.created_at)}</span>
                </div>
                {selectedOrder.address ? (
                  <div className="sm:col-span-2">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Dia chi:</span>{' '}
                    <span className="text-gray-900 dark:text-gray-100">{selectedOrder.address}</span>
                  </div>
                ) : null}
                {selectedOrder.note ? (
                  <div className="sm:col-span-2">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Ghi chu:</span>{' '}
                    <span className="text-gray-900 dark:text-gray-100">{selectedOrder.note}</span>
                  </div>
                ) : null}
              </div>
            </div>

            {selectedOrder.license_plate || selectedOrder.vehicle_model ? (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                <h4 className="mb-3 text-base font-semibold text-gray-700 dark:text-gray-300 sm:text-lg">
                  Thong tin xe
                </h4>
                <div className="flex gap-4">
                  {selectedOrder.vehicle_image_url ? (
                    <div className="flex-shrink-0">
                      <img
                        src={normalizeImageUrl(selectedOrder.vehicle_image_url) || selectedOrder.vehicle_image_url}
                        alt="Xe"
                        className="h-24 w-24 rounded-lg border-2 border-gray-200 bg-white object-cover dark:border-slate-600 dark:bg-slate-700 sm:h-32 sm:w-32"
                        onError={(event) => {
                          event.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  ) : null}

                  <div className="grid flex-1 grid-cols-1 gap-2 text-sm text-gray-900 dark:text-gray-100">
                    {selectedOrder.license_plate ? (
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Bien so xe:</span>{' '}
                        <span className="rounded bg-yellow-400 px-3 py-1 font-bold text-black dark:bg-yellow-500 dark:text-gray-900">
                          {selectedOrder.license_plate}
                        </span>
                      </div>
                    ) : null}
                    {selectedOrder.vehicle_model ? (
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Mau xe:</span>{' '}
                        {selectedOrder.vehicle_model}
                      </div>
                    ) : null}
                    {selectedOrder.vehicle_type ? (
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Loai xe:</span>{' '}
                        {selectedOrder.vehicle_type}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-slate-600 dark:bg-slate-700/50">
              <h4 className="mb-3 text-base font-semibold text-gray-700 dark:text-gray-300 sm:text-lg">
                Thao tac
              </h4>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Trang thai don
                  </label>
                  <select
                    value={selectedOrder.status || ''}
                    onChange={(event) => handleStatusChange(event.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 shadow-sm transition-all duration-200 hover:shadow-md focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:shadow-lg dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 dark:focus:border-blue-400"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {waitingForClaim
                      ? 'Don chi nen chuyen sang xu ly sau khi co nhan vien nhan hoac duoc admin giao thu cong.'
                      : 'Trang thai nay se dong bo voi app nhan vien va cac thong bao lien quan.'}
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nhan vien phu trach
                  </label>
                  <select
                    value={selectedOrder.employee_id || ''}
                    onChange={(event) => handleAssignEmployee(event.target.value)}
                    disabled={isClosedOrder}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 shadow-sm transition-all duration-200 hover:shadow-md focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 dark:focus:border-blue-400"
                  >
                    <option value="">
                      {waitingForClaim ? 'Chon nhan vien de giao thu cong' : 'Chua giao'}
                    </option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name} ({employee.phone})
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {assignmentHint}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-slate-600 dark:bg-slate-700/50">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h4 className="text-base font-semibold text-gray-700 dark:text-gray-300 sm:text-lg">
                  Hinh anh don dich vu ({orderImages.length})
                </h4>
                <button
                  type="button"
                  onClick={() => setShowImageUploader((current) => !current)}
                  className="btn-gradient-primary flex items-center gap-1 px-3 py-1.5 text-sm font-medium"
                >
                  <Plus size={16} />
                  {showImageUploader ? 'Dong' : 'Them anh'}
                </button>
              </div>

              {showImageUploader ? (
                <div className="mb-4 rounded-lg border border-gray-200 bg-white p-3 dark:border-slate-600 dark:bg-slate-800">
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
                emptyTitle="Chua co hinh anh"
                emptyDescription="Don dich vu nay chua co hinh anh nao."
              />
            </div>
          </div>
        ) : null}

        {!loadingDetail && selectedOrder ? (
          <div className="flex-shrink-0 border-t border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800 sm:p-6">
            <div className="flex flex-col justify-between gap-2 sm:flex-row">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleDeleteOrder}
                  className="btn-gradient-error flex items-center gap-2 px-4 py-2 text-sm font-medium"
                >
                  <Trash2 size={16} />
                  Xoa
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-2 rounded-xl bg-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all duration-200 hover:bg-gray-300 hover:shadow-md active:scale-[0.98] dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-slate-600"
              >
                <X size={16} />
                Dong
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
