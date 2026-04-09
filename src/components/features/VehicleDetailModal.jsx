import { memo, useCallback, useEffect, useState } from 'react';
import { Car, FileText, RefreshCw, Save, Shield, User, Wrench } from 'lucide-react';
import { vehiclesAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { buttonStyles } from '../../styles/colors';
import { formatDate } from '../../utils/format';
import {
  buildVehiclePayload,
  getVehicleCustomerName,
  normalizeVehicleDateValue,
  normalizeVehicleForm,
  normalizeVehicleResponse,
} from '../../utils/vehicleDocuments';
import ImagePreview from '../image/ImagePreview';
import ImageUploader from '../image/ImageUploader';
import Modal from '../ui/Modal';
import StatusBadge from '../ui/StatusBadge';

function normalizeObjectResponse(response) {
  const raw = response?.data;

  if (raw?.data && typeof raw.data === 'object' && !Array.isArray(raw.data)) {
    return normalizeVehicleResponse(raw.data);
  }

  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return normalizeVehicleResponse(raw);
  }

  return null;
}

function formatDocumentDate(value) {
  const normalized = normalizeVehicleDateValue(value);
  if (!normalized) {
    return 'Chưa cập nhật';
  }

  const parts = normalized.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  return normalized;
}

function VehicleInput({ label, value, onChange, placeholder, type = 'text', className = '' }) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:ring-2 focus:ring-[#1e406b]"
      />
    </div>
  );
}

function VehicleDocumentSection({
  title,
  icon,
  status,
  children,
}) {
  const SectionIcon = icon;

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-800 shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-700 bg-slate-700/50 px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-100">
          {SectionIcon ? <SectionIcon size={18} className="text-[#e0a02e]" /> : null}
          {title}
        </h3>

        {status !== undefined ? <StatusBadge status={status ?? 'null'} type="vehicle_document" /> : null}
      </div>

      <div className="grid gap-4 p-4 sm:grid-cols-2">
        {children}
      </div>
    </section>
  );
}

function VehicleDetailModal({ isOpen, vehicle, onClose, onRefresh }) {
  const [saving, setSaving] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [vehicleDetail, setVehicleDetail] = useState(() => normalizeVehicleResponse(vehicle));
  const [vehicleForm, setVehicleForm] = useState(() => normalizeVehicleForm(vehicle));
  const { success, error } = useToast();

  const vehicleId = vehicle?.id || vehicleDetail?.id;

  const setFieldValue = useCallback((fieldName, value) => {
    setVehicleForm((current) => ({
      ...current,
      [fieldName]: value,
    }));
  }, []);

  const fetchVehicleDetail = useCallback(
    async (id, { silent = false } = {}) => {
      if (!id) {
        return null;
      }

      if (!silent) {
        setLoadingDetail(true);
      }

      try {
        const response = await vehiclesAPI.getById(id);
        const nextVehicle = normalizeObjectResponse(response);

        if (nextVehicle) {
          setVehicleDetail(nextVehicle);
          setVehicleForm(normalizeVehicleForm(nextVehicle));
        }

        return nextVehicle;
      } catch (fetchError) {
        error(fetchError?.message || 'Không thể tải chi tiết xe.');
        return null;
      } finally {
        if (!silent) {
          setLoadingDetail(false);
        }
      }
    },
    [error]
  );

  useEffect(() => {
    if (!isOpen) {
      setSaving(false);
      setLoadingDetail(false);
      return;
    }

    const nextVehicle = normalizeVehicleResponse(vehicle);
    setVehicleDetail(nextVehicle);
    setVehicleForm(normalizeVehicleForm(nextVehicle));

    if (vehicle?.id) {
      fetchVehicleDetail(vehicle.id);
    }
  }, [fetchVehicleDetail, isOpen, vehicle]);

  if (!isOpen) {
    return null;
  }

  const currentVehicle = vehicleDetail || normalizeVehicleResponse(vehicle);
  const customerName = getVehicleCustomerName(currentVehicle) || 'Chưa rõ';

  const handleSaveVehicle = async () => {
    if (!vehicleId) {
      error('Không tìm thấy xe để cập nhật.');
      return;
    }

    const payload = buildVehiclePayload(vehicleForm);
    delete payload.registration_image_url;
    delete payload.inspection_image_url;
    delete payload.insurance_image_url;

    if (!payload.license_plate) {
      error('Vui lòng nhập biển số xe.');
      return;
    }

    setSaving(true);
    try {
      await vehiclesAPI.update(vehicleId, payload);
      await fetchVehicleDetail(vehicleId, { silent: true });
      await Promise.resolve(onRefresh?.());
      success('Đã cập nhật thông tin xe.');
    } catch (saveError) {
      error(saveError?.message || 'Không thể cập nhật xe.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={saving ? undefined : onClose}
      title={currentVehicle?.license_plate ? `Xe: ${currentVehicle.license_plate}` : 'Chi tiết xe'}
      size="xl"
    >
      {!vehicleId ? (
        <div className="py-10 text-center text-slate-400">Không tìm thấy thông tin xe.</div>
      ) : (
        <div className="relative space-y-6 pb-4">
          {loadingDetail ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-slate-950/75 backdrop-blur-sm">
              <div className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-medium text-slate-200 shadow-lg">
                Đang tải dữ liệu xe...
              </div>
            </div>
          ) : null}

          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <section className="rounded-xl border border-slate-700 bg-slate-800 shadow-sm">
              <div className="border-b border-slate-700 bg-slate-700/50 px-4 py-3">
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-100">
                  <Car size={18} className="text-[#e0a02e]" />
                  Ảnh xe
                </h3>
              </div>

              <div className="space-y-4 p-4">
                <ImagePreview
                  src={vehicleForm.image_url}
                  alt={vehicleForm.license_plate || 'Vehicle'}
                  className="h-56 w-full rounded-xl object-cover"
                  showModal={true}
                  directDisplay={true}
                />

                <VehicleInput
                  label="Link ảnh xe"
                  value={vehicleForm.image_url}
                  onChange={(value) => setFieldValue('image_url', value)}
                  placeholder="https://example.com/car.jpg"
                />

                <div className="rounded-xl border border-dashed border-slate-700 p-3">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Cập nhật ảnh
                  </div>
                  <ImageUploader
                    onUploadSuccess={(url) => setFieldValue('image_url', Array.isArray(url) ? url[0] || '' : url || '')}
                    multiple={false}
                    maxFiles={1}
                    uploadMode="both"
                    allowFileUpload={true}
                    allowLinkUpload={true}
                  />
                </div>

                <div className="grid gap-3 rounded-xl border border-slate-700 bg-slate-900/60 p-4 text-sm">
                  <div className="flex items-center gap-2 text-slate-200">
                    <User size={16} className="text-slate-400" />
                    <span>Khách hàng: {customerName}</span>
                  </div>

                  <div className="text-slate-300">ID xe: #{currentVehicle?.id}</div>
                  <div className="text-slate-300">
                    Tạo lúc: {currentVehicle?.created_at ? formatDate(currentVehicle.created_at) : 'Chưa có'}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-slate-300">Đăng kiểm:</span>
                    <StatusBadge status={currentVehicle?.inspection_status ?? 'null'} type="vehicle_document" />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-slate-300">Bảo hiểm:</span>
                    <StatusBadge status={currentVehicle?.insurance_status ?? 'null'} type="vehicle_document" />
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-slate-700 bg-slate-800 shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-slate-700 bg-slate-700/50 px-4 py-3">
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-100">
                  <Car size={18} className="text-[#e0a02e]" />
                  Thông tin xe
                </h3>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fetchVehicleDetail(vehicleId)}
                    disabled={saving || loadingDetail}
                    className={buttonStyles.secondary}
                  >
                    <RefreshCw size={18} className={loadingDetail ? 'animate-spin' : undefined} />
                    <span>Làm mới</span>
                  </button>

                  <button type="button" onClick={handleSaveVehicle} disabled={saving} className={buttonStyles.primary}>
                    <Save size={18} />
                    <span>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-4 p-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <VehicleInput
                    label="Biển số"
                    value={vehicleForm.license_plate}
                    onChange={(value) => setFieldValue('license_plate', value.toUpperCase())}
                    placeholder="VD: 30A-12345"
                  />

                  <VehicleInput
                    label="Mẫu xe"
                    value={vehicleForm.model}
                    onChange={(value) => setFieldValue('model', value)}
                    placeholder="VD: Toyota Vios"
                  />
                </div>

                <div className="grid gap-3 rounded-xl border border-slate-700 bg-slate-900/60 p-4 text-sm sm:grid-cols-2">
                  <div className="text-slate-200">
                    <div className="text-xs uppercase tracking-wide text-slate-500 ">Ngày cấp đăng ký</div>
                    <div className="mt-1 font-semibold">{formatDocumentDate(currentVehicle?.registration_issued_date)}</div>
                  </div>
                  <div className="text-slate-200">
                    <div className="text-xs uppercase tracking-wide text-slate-500 ">Hết hạn đăng kiểm</div>
                    <div className="mt-1 font-semibold">{formatDocumentDate(currentVehicle?.inspection_expiry_date)}</div>
                  </div>
                  <div className="text-slate-200">
                    <div className="text-xs uppercase tracking-wide text-slate-500 ">Bắt đầu bảo hiểm</div>
                    <div className="mt-1 font-semibold">{formatDocumentDate(currentVehicle?.insurance_start_date)}</div>
                  </div>
                  <div className="text-slate-200">
                    <div className="text-xs uppercase tracking-wide text-slate-500 ">Hết hạn bảo hiểm</div>
                    <div className="mt-1 font-semibold">{formatDocumentDate(currentVehicle?.insurance_expiry_date)}</div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <VehicleDocumentSection
            title="Đăng ký xe"
            icon={FileText}
          >
            <VehicleInput
              label="Số đăng ký"
              value={vehicleForm.registration_number}
              onChange={(value) => setFieldValue('registration_number', value)}
              placeholder="Nhập số đăng ký"
            />
            <VehicleInput
              label="Chủ xe"
              value={vehicleForm.registration_owner_name}
              onChange={(value) => setFieldValue('registration_owner_name', value)}
              placeholder="Nhập tên chủ xe"
            />
            <VehicleInput
              label="Ngày cấp"
              type="date"
              value={vehicleForm.registration_issued_date}
              onChange={(value) => setFieldValue('registration_issued_date', value)}
            />
          </VehicleDocumentSection>

          <VehicleDocumentSection
            title="Đăng kiểm"
            icon={Wrench}
            status={currentVehicle?.inspection_status}
          >
            <VehicleInput
              label="Số chứng nhận"
              value={vehicleForm.inspection_certificate_no}
              onChange={(value) => setFieldValue('inspection_certificate_no', value)}
              placeholder="Nhập số chứng nhận đăng kiểm"
            />
            <VehicleInput
              label="Ngày đăng kiểm gần nhất"
              type="date"
              value={vehicleForm.inspection_last_date}
              onChange={(value) => setFieldValue('inspection_last_date', value)}
            />
            <VehicleInput
              label="Ngày hết hạn"
              type="date"
              value={vehicleForm.inspection_expiry_date}
              onChange={(value) => setFieldValue('inspection_expiry_date', value)}
            />
          </VehicleDocumentSection>

          <VehicleDocumentSection
            title="Bảo hiểm"
            icon={Shield}
            status={currentVehicle?.insurance_status}
          >
            <VehicleInput
              label="Đơn vị bảo hiểm"
              value={vehicleForm.insurance_provider}
              onChange={(value) => setFieldValue('insurance_provider', value)}
              placeholder="Nhập tên đơn vị bảo hiểm"
            />
            <VehicleInput
              label="Số hợp đồng / policy"
              value={vehicleForm.insurance_policy_no}
              onChange={(value) => setFieldValue('insurance_policy_no', value)}
              placeholder="Nhập số hợp đồng bảo hiểm"
            />
            <VehicleInput
              label="Ngày bắt đầu"
              type="date"
              value={vehicleForm.insurance_start_date}
              onChange={(value) => setFieldValue('insurance_start_date', value)}
            />
            <VehicleInput
              label="Ngày hết hạn"
              type="date"
              value={vehicleForm.insurance_expiry_date}
              onChange={(value) => setFieldValue('insurance_expiry_date', value)}
            />
          </VehicleDocumentSection>
        </div>
      )}
    </Modal>
  );
}

export default memo(VehicleDetailModal);
