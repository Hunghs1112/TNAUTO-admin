import { memo, useEffect, useMemo, useState, useCallback } from 'react';
import { Car, CreditCard, User, Save, Pencil, X as XIcon, Settings } from 'lucide-react';
import Modal from '../ui/Modal';
import TabView from '../ui/TabView';
import LoadingSpinner from '../ui/LoadingSpinner';
import ImagePreview from '../image/ImagePreview';
import { customersAPI } from '../../services/api';
import { formatDate } from '../../utils/format';
import { buttonStyles } from '../../styles/colors';
import VehicleDetailModal from './VehicleDetailModal';

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

function CustomerDetailModal({ isOpen, customer, onClose }) {
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [driverLicense, setDriverLicense] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    email: '',
    license_plate: '',
    avatar_url: '',
    // GPLX fields
    license_no: '',
    license_expires_at: '',
  });

  const customerId = customer?.id;

  useEffect(() => {
    if (!isOpen) {
      setActiveTab('basic');
      setDriverLicense(null);
      setVehicles([]);
      setLoading(false);
      setIsEditing(false);
      setSaving(false);
      resetForm();
    }
  }, [isOpen]);

  const resetForm = useCallback(() => {
    setEditForm({
      name: customer?.name || '',
      phone: customer?.phone || '',
      email: customer?.email || '',
      license_plate: customer?.license_plate || '',
      avatar_url: customer?.avatar_url || '',
      license_no: '',
      license_expires_at: '',
    });
  }, [customer]);

  useEffect(() => {
    if (isOpen && customer) {
      resetForm();
    }
  }, [isOpen, customer, resetForm]);

  const fetchExtra = async () => {
    if (!isOpen || !customerId) return;
    setLoading(true);
    try {
      const [dlRes, vehRes] = await Promise.all([
        customersAPI.getDriverLicense(customerId).catch(() => null),
        customersAPI.getVehicles(customerId).catch(() => null),
      ]);

      const dl = dlRes ? normalizeObjectResponse(dlRes) : null;
      const veh = vehRes ? normalizeArrayResponse(vehRes) : [];

      setDriverLicense(dl);
      setVehicles(veh);
      
      // Update form with DL data if available
      if (dl) {
        setEditForm(prev => ({
          ...prev,
          license_no: dl.license_no || '',
          license_expires_at: dl.expires_at ? dl.expires_at.split('T')[0] : '',
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExtra();
  }, [isOpen, customerId]);

  const tabs = useMemo(() => ([
    { id: 'basic', label: 'Thông tin & GPLX', icon: User },
    { id: 'vehicles', label: 'Xe', icon: Car },
  ]), []);

  const handleSaveAll = async () => {
    if (!customerId) return;
    setSaving(true);
    try {
      // 1. Update Customer Basic Info
      await customersAPI.update(customerId, {
        name: editForm.name,
        phone: editForm.phone,
        email: editForm.email,
        license_plate: editForm.license_plate,
        avatar_url: editForm.avatar_url,
      });

      // 2. Update/Upsert Driver License
      if (editForm.license_no || editForm.license_expires_at) {
        await customersAPI.updateDriverLicense(customerId, {
          license_no: editForm.license_no,
          expires_at: editForm.license_expires_at,
        });
      }

      setIsEditing(false);
      await fetchExtra();
      alert('✅ Đã cập nhật thông tin khách hàng và GPLX');
    } catch (err) {
      console.error('Update error:', err);
      alert('❌ Lỗi cập nhật: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleEditVehicle = (vId) => {
    setSelectedVehicleId(vId);
    setIsVehicleModalOpen(true);
  };

  if (!isOpen) return null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={customer ? `Khách hàng: ${customer.name || ''}` : 'Chi tiết khách hàng'}
        size="lg"
      >
        {!customer ? (
          <div className="py-10">
            <LoadingSpinner size="lg" message="Đang tải..." />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <TabView tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
              {activeTab === 'basic' && (
                <div className="flex items-center gap-2">
                  {!isEditing ? (
                    <button onClick={() => setIsEditing(true)} className={buttonStyles.secondary}>
                      <Pencil size={18} />
                      Sửa
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleSaveAll}
                        disabled={saving}
                        className={buttonStyles.primary}
                      >
                        <Save size={18} />
                        {saving ? 'Đang lưu...' : 'Lưu'}
                      </button>
                      <button
                        onClick={() => { setIsEditing(false); resetForm(); }}
                        disabled={saving}
                        className={buttonStyles.secondary}
                      >
                        <XIcon size={18} />
                        Hủy
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {loading && (
              <div className="py-6">
                <LoadingSpinner size="md" message="Đang tải dữ liệu..." />
              </div>
            )}

            {!loading && activeTab === 'basic' && (
              <div className="space-y-6">
                {/* Basic Info Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="sm:col-span-2 flex items-center gap-4 bg-gray-50 dark:bg-slate-800/50 p-3 rounded-xl">
                    <ImagePreview
                      src={isEditing ? editForm.avatar_url : customer.avatar_url}
                      alt={customer.name || 'Avatar'}
                      className="w-16 h-16 rounded-full object-cover border-2 border-white dark:border-slate-700 shadow-sm"
                      showModal={true}
                      directDisplay={true}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">
                        {customer.name || '-'}
                      </div>
                      <div className="text-xs font-medium text-blue-600 dark:text-blue-400">ID: #{customer.id}</div>
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Họ tên</label>
                    {isEditing ? (
                      <input
                        value={editForm.name}
                        onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-gray-50 dark:bg-slate-800/30 rounded-lg text-gray-900 dark:text-gray-100">{customer.name || '-'}</div>
                    )}
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">SĐT</label>
                    {isEditing ? (
                      <input
                        value={editForm.phone}
                        onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-gray-50 dark:bg-slate-800/30 rounded-lg text-gray-900 dark:text-gray-100">{customer.phone || '-'}</div>
                    )}
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                    {isEditing ? (
                      <input
                        value={editForm.email}
                        onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-gray-50 dark:bg-slate-800/30 rounded-lg text-gray-900 dark:text-gray-100">{customer.email || '-'}</div>
                    )}
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Biển số mặc định</label>
                    {isEditing ? (
                      <input
                        value={editForm.license_plate}
                        onChange={(e) => setEditForm((p) => ({ ...p, license_plate: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-gray-50 dark:bg-slate-800/30 rounded-lg text-gray-900 dark:text-gray-100">{customer.license_plate || '-'}</div>
                    )}
                  </div>
                </div>

                {/* Driver License Section */}
                <div className="pt-4 border-t border-gray-100 dark:border-slate-700">
                  <h4 className="flex items-center gap-2 font-semibold text-gray-800 dark:text-gray-200 mb-4">
                    <CreditCard size={18} className="text-blue-500" />
                    Thông tin Giấy phép lái xe (GPLX)
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
                    <div>
                      <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Số GPLX</label>
                      {isEditing ? (
                        <input
                          value={editForm.license_no}
                          onChange={(e) => setEditForm((p) => ({ ...p, license_no: e.target.value }))}
                          placeholder="Nhập số GPLX..."
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      ) : (
                        <div className="font-semibold text-gray-900 dark:text-gray-100">{driverLicense?.license_no || 'Chưa cập nhật'}</div>
                      )}
                    </div>

                    <div>
                      <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày hết hạn</label>
                      {isEditing ? (
                        <input
                          type="date"
                          value={editForm.license_expires_at}
                          onChange={(e) => setEditForm((p) => ({ ...p, license_expires_at: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      ) : (
                        <div className={`font-semibold ${!driverLicense?.expires_at ? 'text-gray-500' : ''}`}>
                          {driverLicense?.expires_at ? formatDate(driverLicense.expires_at) : 'Chưa cập nhật'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!loading && activeTab === 'vehicles' && (
              <div className="space-y-3">
                {(!vehicles || vehicles.length === 0) ? (
                  <div className="text-sm text-gray-600 dark:text-gray-300 text-center py-10 bg-gray-50 dark:bg-slate-800/30 rounded-xl border-2 border-dashed border-gray-200 dark:border-slate-700">
                    <Car className="mx-auto mb-2 text-gray-400" size={32} />
                    Khách hàng này chưa có xe trong hệ thống
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {vehicles.map((v) => (
                      <div 
                        key={v.id || v.license_plate} 
                        onClick={() => handleEditVehicle(v.id)}
                        className="group relative rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 hover:border-blue-400 dark:hover:border-blue-500 transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <ImagePreview
                            src={v.image_url}
                            alt={v.license_plate || 'Xe'}
                            className="w-20 h-14 rounded-lg object-cover shadow-sm"
                            showModal={true}
                            directDisplay={true}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-gray-900 dark:text-gray-100 truncate flex items-center gap-1">
                              <span className="bg-yellow-400 text-black px-1.5 py-0.5 rounded text-[10px] font-black uppercase leading-none">{v.license_plate}</span>
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 truncate mt-1">
                              {v.model || 'Chưa rõ model'}
                            </div>
                          </div>
                          <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-400 group-hover:text-blue-500 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
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

      {/* Nested Vehicle Detail Modal */}
      <VehicleDetailModal
        isOpen={isVehicleModalOpen}
        vehicleId={selectedVehicleId}
        onClose={() => setIsVehicleModalOpen(false)}
        onRefresh={fetchExtra}
      />
    </>
  );
}

export default memo(CustomerDetailModal);
