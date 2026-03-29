import { memo, useEffect, useState } from 'react';
import { Car, Save, User } from 'lucide-react';
import { vehiclesAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { buttonStyles } from '../../styles/colors';
import { formatDate } from '../../utils/format';
import ImagePreview from '../image/ImagePreview';
import ImageUploader from '../image/ImageUploader';
import Modal from '../ui/Modal';

function normalizeVehicleForm(vehicle) {
  return {
    license_plate: vehicle?.license_plate || '',
    model:
      vehicle?.model ||
      vehicle?.vehicle_model ||
      vehicle?.car_model ||
      vehicle?.model_name ||
      vehicle?.vehicle_type ||
      '',
    image_url: vehicle?.image_url || '',
  };
}

function VehicleDetailModal({ isOpen, vehicle, onClose, onRefresh }) {
  const [saving, setSaving] = useState(false);
  const [vehicleForm, setVehicleForm] = useState(() => normalizeVehicleForm(vehicle));
  const { success, error } = useToast();

  useEffect(() => {
    if (!isOpen) {
      setSaving(false);
      return;
    }

    setVehicleForm(normalizeVehicleForm(vehicle));
  }, [isOpen, vehicle]);

  if (!isOpen) {
    return null;
  }

  const vehicleId = vehicle?.id;

  const handleSaveVehicle = async () => {
    if (!vehicleId) {
      error('Khong tim thay xe de cap nhat.');
      return;
    }

    const payload = {
      license_plate: String(vehicleForm.license_plate || '').trim().toUpperCase(),
      model: String(vehicleForm.model || '').trim(),
      image_url: String(vehicleForm.image_url || '').trim() || null,
    };

    if (!payload.license_plate) {
      error('Vui long nhap bien so xe.');
      return;
    }

    setSaving(true);
    try {
      await vehiclesAPI.update(vehicleId, payload);
      success('Da cap nhat thong tin xe.');
      onRefresh?.();
    } catch (saveError) {
      error(saveError?.message || 'Khong the cap nhat xe.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={saving ? undefined : onClose}
      title={vehicle?.license_plate ? `Xe: ${vehicle.license_plate}` : 'Chi tiet xe'}
      size="xl"
    >
      {!vehicleId ? (
        <div className="py-10 text-center text-gray-500">Khong tim thay thong tin xe.</div>
      ) : (
        <div className="space-y-6 pb-4">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <section className="rounded-xl border border-gray-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <div className="border-b border-gray-100 bg-gray-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-700/50">
                <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-gray-100">
                  <Car size={18} className="text-blue-500" />
                  Anh xe
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

                <div className="rounded-xl border border-dashed border-gray-200 p-3 dark:border-slate-700">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                    Cap nhat anh
                  </div>
                  <ImageUploader
                    onUploadSuccess={(url) =>
                      setVehicleForm((current) => ({
                        ...current,
                        image_url: Array.isArray(url) ? url[0] || '' : url || '',
                      }))
                    }
                    multiple={false}
                    maxFiles={1}
                    uploadMode="both"
                    allowFileUpload={true}
                    allowLinkUpload={true}
                  />
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-gray-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-center justify-between gap-3 border-b border-gray-100 bg-gray-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-700/50">
                <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-gray-100">
                  <Car size={18} className="text-blue-500" />
                  Thong tin xe
                </h3>

                <button type="button" onClick={handleSaveVehicle} disabled={saving} className={buttonStyles.primary}>
                  <Save size={18} />
                  <span>{saving ? 'Dang luu...' : 'Luu thay doi'}</span>
                </button>
              </div>

              <div className="space-y-4 p-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Bien so</label>
                    <input
                      value={vehicleForm.license_plate}
                      onChange={(event) =>
                        setVehicleForm((current) => ({
                          ...current,
                          license_plate: event.target.value.toUpperCase(),
                        }))
                      }
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 font-bold uppercase outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Mau xe</label>
                    <input
                      value={vehicleForm.model}
                      onChange={(event) =>
                        setVehicleForm((current) => ({
                          ...current,
                          model: event.target.value,
                        }))
                      }
                      placeholder="VD: Toyota Vios"
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">Link anh</label>
                  <input
                    value={vehicleForm.image_url}
                    onChange={(event) =>
                      setVehicleForm((current) => ({
                        ...current,
                        image_url: event.target.value,
                      }))
                    }
                    placeholder="https://example.com/car.jpg"
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900"
                  />
                </div>

                <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-700 dark:bg-slate-900/60">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                    <User size={16} className="text-slate-400" />
                    <span>Khach hang: {vehicle.customer_name || vehicle.customer?.name || 'Chua ro'}</span>
                  </div>

                  <div className="text-slate-600 dark:text-slate-300">ID xe: #{vehicle.id}</div>
                  <div className="text-slate-600 dark:text-slate-300">
                    Tao luc: {vehicle.created_at ? formatDate(vehicle.created_at) : 'Chua co'}
                  </div>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
                  Man hinh nay chi sua thong tin co ban cua xe theo admin vehicle routes. Them xe moi nen thuc hien tu chi tiet khach hang.
                </div>
              </div>
            </section>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default memo(VehicleDetailModal);
