import { memo, useEffect, useMemo, useState } from 'react';
import { Car, CreditCard, User } from 'lucide-react';
import Modal from '../ui/Modal';
import TabView from '../ui/TabView';
import LoadingSpinner from '../ui/LoadingSpinner';
import ImagePreview from '../image/ImagePreview';
import { customersAPI } from '../../services/api';
import { formatDate } from '../../utils/format';

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
  const customerId = customer?.id;

  useEffect(() => {
    if (!isOpen) {
      setActiveTab('basic');
      setDriverLicense(null);
      setVehicles([]);
      setLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
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
      } finally {
        setLoading(false);
      }
    };

    fetchExtra();
  }, [isOpen, customerId]);

  const tabs = useMemo(() => ([
    { id: 'basic', label: 'Thông tin', icon: User },
    { id: 'license', label: 'GPLX', icon: CreditCard },
    { id: 'vehicles', label: 'Xe', icon: Car },
  ]), []);

  return (
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
          <TabView tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

          {loading && (
            <div className="py-6">
              <LoadingSpinner size="md" message="Đang tải dữ liệu..." />
            </div>
          )}

          {!loading && activeTab === 'basic' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="sm:col-span-2 flex items-center gap-3">
                <ImagePreview
                  src={customer.avatar_url}
                  alt={customer.name || 'Avatar'}
                  className="w-14 h-14 rounded-full object-cover"
                  showModal={true}
                  directDisplay={true}
                />
                <div>
                  <div className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    {customer.name || '-'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    ID: {customer.id}
                  </div>
                </div>
              </div>

              <div><span className="font-medium text-gray-700 dark:text-gray-300">SĐT:</span> <span className="text-gray-900 dark:text-gray-100">{customer.phone || '-'}</span></div>
              <div><span className="font-medium text-gray-700 dark:text-gray-300">Email:</span> <span className="text-gray-900 dark:text-gray-100">{customer.email || '-'}</span></div>
              <div><span className="font-medium text-gray-700 dark:text-gray-300">Biển số mặc định:</span> <span className="text-gray-900 dark:text-gray-100">{customer.license_plate || '-'}</span></div>
              <div><span className="font-medium text-gray-700 dark:text-gray-300">Ngày tạo:</span> <span className="text-gray-900 dark:text-gray-100">{customer.created_at ? formatDate(customer.created_at) : '-'}</span></div>
            </div>
          )}

          {!loading && activeTab === 'license' && (
            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 border border-gray-200 dark:border-slate-600 text-sm">
              {!driverLicense ? (
                <div className="text-gray-600 dark:text-gray-300">Chưa có thông tin GPLX</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><span className="font-medium text-gray-700 dark:text-gray-300">Số GPLX:</span> <span className="text-gray-900 dark:text-gray-100">{driverLicense.license_no || '-'}</span></div>
                  <div><span className="font-medium text-gray-700 dark:text-gray-300">Ngày đăng ký:</span> <span className="text-gray-900 dark:text-gray-100">{driverLicense.registered_at ? formatDate(driverLicense.registered_at) : '-'}</span></div>
                  <div><span className="font-medium text-gray-700 dark:text-gray-300">Ngày hết hạn:</span> <span className="text-gray-900 dark:text-gray-100">{driverLicense.expires_at ? formatDate(driverLicense.expires_at) : '-'}</span></div>
                </div>
              )}
            </div>
          )}

          {!loading && activeTab === 'vehicles' && (
            <div className="space-y-3">
              {(!vehicles || vehicles.length === 0) ? (
                <div className="text-sm text-gray-600 dark:text-gray-300">Chưa có xe</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {vehicles.map((v) => (
                    <div key={v.id || v.license_plate} className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
                      <div className="flex items-start gap-3">
                        <ImagePreview
                          src={v.image_url}
                          alt={v.license_plate || 'Xe'}
                          className="w-20 h-14 rounded object-cover"
                          showModal={true}
                          directDisplay={true}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {v.license_plate || '-'}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-300 truncate">
                            {v.model || 'Chưa có model'}
                          </div>
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
  );
}

export default memo(CustomerDetailModal);

