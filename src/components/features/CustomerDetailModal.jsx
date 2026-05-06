import { memo, useEffect, useMemo, useState, useCallback, useRef } from 'react';
import useDetailFetchGuard from '../../hooks/useDetailFetchGuard';
import { Car, CreditCard, User, Save, Pencil, X as XIcon, Settings, Plus } from 'lucide-react';
import Modal from '../ui/Modal';
import TabView from '../ui/TabView';
import LoadingSpinner from '../ui/LoadingSpinner';
import ImagePreview from '../image/ImagePreview';
import ImageUploader from '../image/ImageUploader';
import { customersAPI } from '../../services/api';
import { formatDate } from '../../utils/format';
import { buttonStyles } from '../../styles/colors';
import VehicleDetailModal from './VehicleDetailModal';
import { useToast } from '../../contexts/ToastContext';


function normalizeArrayResponse(res) {
  const raw = res?.data;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data?.data)) return raw.data.data;
  return [];
}

function normalizeObjectResponse(res) {
  const raw = res?.data;
  if (raw?.data && typeof raw.data === 'object' && !Array.isArray(raw.data)) return raw.data;
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw;
  return null;
}

function extractEmbeddedVehicles(customer) {
  if (Array.isArray(customer?.vehicles)) return customer.vehicles;
  if (Array.isArray(customer?.customer_vehicles)) return customer.customer_vehicles;
  return [];
}

function normalizeLicensePlate(value) {
  return String(value || '').trim().toUpperCase();
}

function AddVehicleModal({ isOpen, customer, onClose, onSuccess }) {
  const [form, setForm] = useState({
    license_plate: '',
    model: '',
    image_url: '',
  });
  const [saving, setSaving] = useState(false);
  const { success, error, info } = useToast();

  useEffect(() => {
    if (!isOpen) {
      setForm({
        license_plate: '',
        model: '',
        image_url: '',
      });
      setSaving(false);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    const normalizedPlate = normalizeLicensePlate(form.license_plate);

    if (!normalizedPlate) {
      error('Vui lòng nhập biển số xe.');
      return;
    }

    if (!customer?.id) {
      error('Không xác định được khách hàng để thêm xe.');
      return;
    }

    setSaving(true);
    try {
      const response = await customersAPI.addVehicle(customer.id, {
        license_plate: normalizedPlate,
        model: form.model.trim() || undefined,
        image_url: form.image_url.trim() || undefined,
      });

      const payload = normalizeObjectResponse(response);
      const action = payload?.action;

      if (action === 'already_exists') {
        info('Khách hàng đã có xe này rồi.');
      } else {
        success('Thêm xe cho khách hàng thành công.');
      }

      onSuccess?.(payload);
      onClose?.();
    } catch (err) {
      error(err.response?.data?.message || err.message || 'Không thể thêm xe cho khách hàng.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={saving ? undefined : onClose}
      title={customer ? `Thêm xe cho ${customer.name || `#${customer.id}`}` : 'Thêm xe'}
      size="lg"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block font-medium text-slate-300">
              Biển số xe <span className="text-[#e0a02e]">*</span>
            </label>
            <input
              value={form.license_plate}
              onChange={(e) => setForm((prev) => ({ ...prev, license_plate: e.target.value }))}
              placeholder="VD: 30A-12345"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 uppercase text-slate-100 outline-none focus:ring-2 focus:ring-[#1e406b]"
            />
            <p className="mt-1 text-xs text-slate-400">
              Hệ thống sẽ tự trim khoảng trắng và chuẩn hóa thành chữ in hoa trước khi gửi.
            </p>
          </div>

          <div>
            <label className="mb-1 block font-medium text-slate-300">Model</label>
            <input
              value={form.model}
              onChange={(e) => setForm((prev) => ({ ...prev, model: e.target.value }))}
              placeholder="VD: Toyota Vios"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:ring-2 focus:ring-[#1e406b]"
            />
          </div>

          <div>
            <label className="mb-1 block font-medium text-slate-300">Link ảnh xe</label>
            <input
              type="url"
              value={form.image_url}
              onChange={(e) => setForm((prev) => ({ ...prev, image_url: e.target.value }))}
              placeholder="https://example.com/car.jpg"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:ring-2 focus:ring-[#1e406b]"
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="font-medium text-slate-200">Ảnh xe</div>
              <div className="text-xs text-slate-400">Có thể dán link trực tiếp hoặc upload ảnh.</div>
            </div>
            <ImagePreview
              src={form.image_url}
              alt={form.license_plate || 'Ảnh xe'}
              className="h-16 w-24 rounded-lg object-cover"
              showModal={true}
              directDisplay={true}
            />
          </div>

          <ImageUploader
            onUploadSuccess={(url) => setForm((prev) => ({ ...prev, image_url: url }))}
            maxFiles={1}
            uploadMode="both"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} disabled={saving} className={buttonStyles.secondary}>
            <XIcon size={18} />
            Hủy
          </button>
          <button type="button" onClick={handleSubmit} disabled={saving} className={buttonStyles.primary}>
            <Save size={18} />
            {saving ? 'Đang lưu...' : 'Thêm xe'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function CustomerDetailModal({ isOpen, customer, onClose }) {
  const [activeTab, setActiveTab] = useState('basic');
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [driverLicense, setDriverLicense] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [customerDetail, setCustomerDetail] = useState(customer || null);
  const hasLoadedContentRef = useRef(Boolean(customer));
  const { shouldSkipFetch, beginFetch, completeFetch, failFetch, resetFetchGuard } = useDetailFetchGuard();

  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);

  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    email: '',
    avatar_url: '',
    license_no: '',
    license_expires_at: '',
  });

  const { success, error } = useToast();
  const customerId = customer?.id;

  const resetForm = useCallback((currentCustomer, currentDriverLicense) => {
    setEditForm({
      name: currentCustomer?.name || '',
      phone: currentCustomer?.phone || '',
      email: currentCustomer?.email || '',
      avatar_url: currentCustomer?.avatar_url || '',
      license_no: currentDriverLicense?.license_no || '',
      license_expires_at: currentDriverLicense?.expires_at ? currentDriverLicense.expires_at.split('T')[0] : '',
    });
  }, []);

  const fetchExtra = useCallback(async ({ force = false } = {}) => {
    if (!isOpen || !customerId) return;

    const fetchKey = `${customerId}`;

    if (shouldSkipFetch(fetchKey, force)) return;

    beginFetch();

    if (hasLoadedContentRef.current || customer) {
      setIsRefreshing(true);
    } else {
      setIsInitialLoading(true);
    }
    try {
      // Fetch customer, driver license và vehicles song song, tránh N+1
      const [customerRes, dlRes, vehiclesResponse] = await Promise.all([
        customersAPI.getById(customerId).catch(() => null),
        customersAPI.getDriverLicense(customerId).catch(() => null),
        customersAPI.getVehiclesForGarage(customerId).catch(() => null),
      ]);

      const nextCustomer = customerRes ? normalizeObjectResponse(customerRes) : customer;
      const nextDriverLicense = dlRes ? normalizeObjectResponse(dlRes) : null;

      let nextVehicles = extractEmbeddedVehicles(nextCustomer);
      if (vehiclesResponse) {
        nextVehicles = normalizeArrayResponse(vehiclesResponse);
      }

      setCustomerDetail(nextCustomer);
      setDriverLicense(nextDriverLicense);
      setVehicles(nextVehicles);
      resetForm(nextCustomer, nextDriverLicense);
      hasLoadedContentRef.current = true;
      completeFetch(fetchKey);
    } catch (fetchError) {
      failFetch();
      console.error('Fetch customer detail error:', fetchError);
    } finally {
      setIsInitialLoading(false);
      setIsRefreshing(false);
    }
  }, [customer, customerId, isOpen, resetForm]);

  useEffect(() => {
    if (!isOpen) {
      setActiveTab('basic');
      setDriverLicense(null);
      setVehicles([]);
      setIsInitialLoading(false);
      setIsRefreshing(false);
      setIsEditing(false);
      setSaving(false);
      setSelectedVehicle(null);
      setCustomerDetail(customer || null);
      resetForm(customer || null, null);
      setIsAddVehicleOpen(false);
      hasLoadedContentRef.current = false;
      resetFetchGuard();
      return;
    }

    setCustomerDetail(customer || null);
    resetForm(customer || null, null);
    hasLoadedContentRef.current = Boolean(customer);
  }, [customer, isOpen, resetForm]);

  useEffect(() => {
    if (isOpen && customerId) {
      fetchExtra();
    }
  }, [fetchExtra, isOpen, customerId]);

  const tabs = useMemo(() => ([
    { id: 'basic', label: 'Thông tin & GPLX', icon: User },
    { id: 'vehicles', label: 'Xe', icon: Car },
  ]), []);

  const handleSaveAll = async () => {
    if (!customerId) return;
    setSaving(true);
    try {
      const customerPayload = {
        name: editForm.name,
        phone: editForm.phone,
        email: editForm.email,
        avatar_url: editForm.avatar_url,
      };

      await customersAPI.update(customerId, customerPayload);

      if (editForm.license_no || editForm.license_expires_at) {
        await customersAPI.updateDriverLicense(customerId, {
          license_no: editForm.license_no,
          expires_at: editForm.license_expires_at,
        });
      }

      setIsEditing(false);
      await fetchExtra({ force: true });
      success('Đã cập nhật thông tin khách hàng và GPLX.');
    } catch (err) {
      console.error('Update error:', err);
      error(err.response?.data?.message || err.message || 'Lỗi cập nhật khách hàng.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditVehicle = (nextVehicle) => {
    setSelectedVehicle(nextVehicle || null);
    setIsVehicleModalOpen(true);
  };

  if (!isOpen) return null;

  const currentCustomer = customerDetail || customer;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={currentCustomer ? `Khách hàng: ${currentCustomer.name || ''}` : 'Chi tiết khách hàng'}
        size="lg"
      >
        {!currentCustomer || isInitialLoading ? (
          <div className="py-10">
            <LoadingSpinner size="lg" message="Đang tải..." />
          </div>
        ) : (
          <div className="relative space-y-4">
            {isRefreshing ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-slate-950/75 backdrop-blur-sm">
                <div className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-medium text-slate-200 shadow-lg">
                  Đang tải dữ liệu...
                </div>
              </div>
            ) : null}
            <div className="flex items-center justify-between gap-3">
              <TabView tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
              <div className="flex items-center gap-2">
                {activeTab === 'basic' ? (
                  <>
                    {!isEditing ? (
                      <button onClick={() => setIsEditing(true)} className={buttonStyles.secondary}>
                        <Pencil size={18} />
                        Sửa
                      </button>
                    ) : (
                      <>
                        <button onClick={handleSaveAll} disabled={saving} className={buttonStyles.primary}>
                          <Save size={18} />
                          {saving ? 'Đang lưu...' : 'Lưu'}
                        </button>
                        <button
                          onClick={() => {
                            setIsEditing(false);
                            resetForm(currentCustomer, driverLicense);
                          }}
                          disabled={saving}
                          className={buttonStyles.secondary}
                        >
                          <XIcon size={18} />
                          Hủy
                        </button>
                      </>
                    )}
                  </>
                ) : null}
                <button type="button" onClick={() => setIsAddVehicleOpen(true)} className={buttonStyles.primary}>
                  <Plus size={18} />
                  Thêm xe
                </button>
              </div>
            </div>

            {activeTab === 'basic' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                  <div className="sm:col-span-2 flex items-center gap-4 rounded-xl bg-slate-800/50 p-3">
                    <ImagePreview
                      src={isEditing ? editForm.avatar_url : currentCustomer.avatar_url}
                      alt={currentCustomer.name || 'Avatar'}
                      className="h-16 w-16 rounded-full border-2 border-slate-700 object-cover shadow-sm"
                      showModal={true}
                      directDisplay={true}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-lg font-bold text-slate-100">
                        {currentCustomer.name || '-'}
                      </div>
                      <div className="text-xs font-medium text-[#eecd7e]">ID: #{currentCustomer.id}</div>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block font-medium text-slate-300">Họ tên</label>
                    {isEditing ? (
                      <input
                        value={editForm.name}
                        onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:ring-2 focus:ring-[#1e406b]"
                      />
                    ) : (
                      <div className="rounded-lg bg-slate-800/40 px-3 py-2 text-slate-100">{currentCustomer.name || '-'}</div>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block font-medium text-slate-300">SĐT</label>
                    {isEditing ? (
                      <input
                        value={editForm.phone}
                        onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:ring-2 focus:ring-[#1e406b]"
                      />
                    ) : (
                      <div className="rounded-lg bg-slate-800/40 px-3 py-2 text-slate-100">{currentCustomer.phone || '-'}</div>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block font-medium text-slate-300">Email</label>
                    {isEditing ? (
                      <input
                        value={editForm.email}
                        onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:ring-2 focus:ring-[#1e406b]"
                      />
                    ) : (
                      <div className="rounded-lg bg-slate-800/40 px-3 py-2 text-slate-100">{currentCustomer.email || '-'}</div>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block font-medium text-slate-300">Số xe đã lưu</label>
                    <div className="rounded-lg bg-slate-800/40 px-3 py-2 text-slate-100">
                      {vehicles.length}
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-700 pt-4">
                  <h4 className="mb-4 flex items-center gap-2 font-semibold text-slate-200">
                    <CreditCard size={18} className="text-[#e0a02e]" />
                    Thông tin Giấy phép lái xe (GPLX)
                  </h4>

                  <div className="grid grid-cols-1 gap-4 rounded-xl border border-[#1e406b]/30 bg-[#112552]/18 p-4 text-sm sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block font-medium text-slate-300">Số GPLX</label>
                      {isEditing ? (
                        <input
                          value={editForm.license_no}
                          onChange={(e) => setEditForm((p) => ({ ...p, license_no: e.target.value }))}
                          placeholder="Nhập số GPLX..."
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:ring-2 focus:ring-[#1e406b]"
                        />
                      ) : (
                        <div className="font-semibold text-slate-100">{driverLicense?.license_no || 'Chưa cập nhật'}</div>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block font-medium text-slate-300">Ngày hết hạn</label>
                      {isEditing ? (
                        <input
                          type="date"
                          value={editForm.license_expires_at}
                          onChange={(e) => setEditForm((p) => ({ ...p, license_expires_at: e.target.value }))}
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:ring-2 focus:ring-[#1e406b]"
                        />
                      ) : (
                        <div className={`font-semibold ${!driverLicense?.expires_at ? 'text-slate-400' : ''}`}>
                          {driverLicense?.expires_at ? formatDate(driverLicense.expires_at) : 'Chưa cập nhật'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'vehicles' && (
              <div className="space-y-3">
                {(!vehicles || vehicles.length === 0) ? (
                  <div className="rounded-xl border-2 border-dashed border-slate-700 bg-slate-800/30 py-10 text-center text-sm text-slate-300">
                    <Car className="mx-auto mb-2 text-slate-500" size={32} />
                    Khách hàng này chưa có xe trong hệ thống
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {vehicles.map((v) => (
                      <div
                        key={v.id || v.license_plate}
                        onClick={() => handleEditVehicle(v)}
                        className="group relative cursor-pointer rounded-xl border border-slate-700 bg-slate-800 p-3 transition-all hover:border-[#1e406b]"
                      >
                        <div className="flex items-center gap-3">
                          <ImagePreview
                            src={v.image_url}
                            alt={v.license_plate || 'Xe'}
                            className="h-14 w-20 rounded-lg object-cover shadow-sm"
                            showModal={true}
                            directDisplay={true}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1 truncate font-bold text-slate-100">
                              <span className="rounded bg-[#e0a02e] px-1.5 py-0.5 text-[10px] font-black uppercase leading-none text-[#112552]">{v.license_plate}</span>
                            </div>
                            <div className="mt-1 truncate text-xs text-slate-400">
                              {v.model || 'Chưa rõ model'}
                            </div>
                          </div>
                          <div className="rounded-lg bg-slate-700 p-1.5 text-slate-400 transition-colors group-hover:bg-[#112552]/20 group-hover:text-[#dfe1e3]">
                            <Settings size={16} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      <AddVehicleModal
        isOpen={isAddVehicleOpen}
        customer={currentCustomer}
        onClose={() => setIsAddVehicleOpen(false)}
        onSuccess={async () => {
          await fetchExtra({ force: true });
        }}
      />

      <VehicleDetailModal
        isOpen={isVehicleModalOpen}
        vehicle={selectedVehicle}
        onClose={() => {
          setIsVehicleModalOpen(false);
          setSelectedVehicle(null);
        }}
        onRefresh={fetchExtra}
      />
    </>
  );
}

export default memo(CustomerDetailModal);