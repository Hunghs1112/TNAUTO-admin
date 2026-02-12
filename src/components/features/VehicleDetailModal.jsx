import { useState, useEffect, memo } from 'react';
import { Car, ClipboardCheck, Save, Trash2 } from 'lucide-react';
import Modal from '../ui/Modal';
import LoadingSpinner from '../ui/LoadingSpinner';
import ImagePreview from '../image/ImagePreview';
import ImageUploader from '../image/ImageUploader';
import { vehiclesAPI } from '../../services/api';
import { buttonStyles } from '../../styles/colors';
import { formatDate } from '../../utils/format';

/**
 * Vehicle Detail Modal
 * Handles viewing and editing vehicle info + inspection (đăng kiểm)
 * Optimized layout to show both sections without scrolling
 */
function VehicleDetailModal({ isOpen, vehicleId, onClose, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [vehicle, setVehicle] = useState(null);
  const [inspection, setInspection] = useState(null);
  
  const [vehicleForm, setVehicleForm] = useState({
    license_plate: '',
    model: '',
    image_url: '',
  });

  const [inspectionForm, setInspectionForm] = useState({
    inspection_no: '',
    registered_at: '',
    expires_at: '',
  });

  useEffect(() => {
    if (isOpen && vehicleId) {
      fetchData();
    } else {
      setVehicle(null);
      setInspection(null);
    }
  }, [isOpen, vehicleId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [vRes, iRes] = await Promise.all([
        vehiclesAPI.getById(vehicleId),
        vehiclesAPI.getInspection(vehicleId).catch(() => null)
      ]);

      const vData = vRes.data?.data || vRes.data;
      setVehicle(vData);
      setVehicleForm({
        license_plate: vData.license_plate || '',
        model: vData.model || '',
        image_url: vData.image_url || '',
      });

      if (iRes) {
        const iData = iRes.data?.data || iRes.data;
        setInspection(iData);
        setInspectionForm({
          inspection_no: iData.inspection_no || '',
          registered_at: iData.registered_at ? iData.registered_at.split('T')[0] : '',
          expires_at: iData.expires_at ? iData.expires_at.split('T')[0] : '',
        });
      } else {
        setInspection(null);
        setInspectionForm({
          inspection_no: '',
          registered_at: '',
          expires_at: '',
        });
      }
    } catch (err) {
      console.error('Error fetching vehicle/inspection:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVehicle = async () => {
    setSaving(true);
    try {
      await vehiclesAPI.update(vehicleId, vehicleForm);
      alert('✅ Đã cập nhật thông tin xe');
      onRefresh && onRefresh();
    } catch (err) {
      alert('❌ Lỗi cập nhật xe: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveInspection = async () => {
    if (!inspectionForm.inspection_no || !inspectionForm.expires_at) {
      alert('Vui lòng nhập số đăng kiểm và ngày hết hạn');
      return;
    }
    setSaving(true);
    try {
      await vehiclesAPI.updateInspection(vehicleId, inspectionForm);
      alert('✅ Đã cập nhật thông tin đăng kiểm');
      fetchData();
    } catch (err) {
      alert('❌ Lỗi cập nhật đăng kiểm: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteInspection = async () => {
    if (!window.confirm('Xác nhận xóa thông tin đăng kiểm của xe này?')) return;
    setSaving(true);
    try {
      await vehiclesAPI.deleteInspection(vehicleId);
      alert('✅ Đã xóa thông tin đăng kiểm');
      setInspection(null);
      setInspectionForm({ inspection_no: '', registered_at: '', expires_at: '' });
    } catch (err) {
      alert('❌ Lỗi khi xóa: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={vehicle ? `Xe: ${vehicle.license_plate}` : 'Chi tiết xe'}
      size="xl"
    >
      {loading ? (
        <div className="py-20">
          <LoadingSpinner size="lg" message="Đang tải dữ liệu xe..." />
        </div>
      ) : !vehicle ? (
        <div className="py-10 text-center text-gray-500">Không tìm thấy thông tin xe</div>
      ) : (
        <div className="flex flex-col md:flex-row gap-6 pb-4">
          {/* Panel Trái: Thông tin xe */}
          <div className="flex-1 space-y-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden shadow-sm flex flex-col h-full">
              <div className="p-3 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
                <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Car className="text-blue-500" size={18} />
                  Thông tin xe
                </h3>
                <button
                  onClick={handleSaveVehicle}
                  disabled={saving}
                  className={buttonStyles.primary + " py-1 px-3 text-xs"}
                >
                  <Save size={14} />
                  Lưu xe
                </button>
              </div>
              
              <div className="p-4 space-y-4">
                <div className="flex gap-4">
                  <div className="w-1/3">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Ảnh xe</label>
                    <ImagePreview
                      src={vehicleForm.image_url}
                      alt="Vehicle"
                      className="w-full h-24 rounded-lg object-cover border border-gray-100 dark:border-slate-600 shadow-sm"
                      showModal={true}
                      directDisplay={true}
                    />
                    <div className="mt-2">
                      <ImageUploader
                        onUploadSuccess={(url) => setVehicleForm(p => ({ ...p, image_url: url }))}
                        maxFiles={1}
                        uploadMode="both"
                        compact={true}
                      />
                    </div>
                  </div>

                  <div className="flex-1 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Biển số</label>
                      <input
                        value={vehicleForm.license_plate}
                        onChange={(e) => setVehicleForm(p => ({ ...p, license_plate: e.target.value }))}
                        className="w-full px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold uppercase focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Dòng xe (Model)</label>
                      <input
                        value={vehicleForm.model}
                        onChange={(e) => setVehicleForm(p => ({ ...p, model: e.target.value }))}
                        className="w-full px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="VD: Toyota Vios"
                      />
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-gray-400 dark:text-gray-500 pt-2 border-t border-gray-50 dark:border-slate-700">
                  ID: #{vehicle.id} • Khách hàng: {vehicle.customer_name || '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Panel Phải: Đăng kiểm */}
          <div className="flex-1 space-y-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden shadow-sm flex flex-col h-full">
              <div className="p-3 bg-green-50/50 dark:bg-green-900/10 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
                <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <ClipboardCheck className="text-green-500" size={18} />
                  Thông tin đăng kiểm
                </h3>
                <div className="flex items-center gap-2">
                  {inspection && (
                    <button
                      onClick={handleDeleteInspection}
                      disabled={saving}
                      className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Xóa đăng kiểm"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                  <button
                    onClick={handleSaveInspection}
                    disabled={saving}
                    className={buttonStyles.primary + " py-1 px-3 text-xs bg-green-600 hover:bg-green-700 border-green-600"}
                  >
                    <Save size={14} />
                    Lưu
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Số đăng kiểm</label>
                  <input
                    value={inspectionForm.inspection_no}
                    onChange={(e) => setInspectionForm(p => ({ ...p, inspection_no: e.target.value }))}
                    placeholder="VD: KD-1234567"
                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Ngày đăng ký</label>
                    <input
                      type="date"
                      value={inspectionForm.registered_at}
                      onChange={(e) => setInspectionForm(p => ({ ...p, registered_at: e.target.value }))}
                      className="w-full px-2 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Ngày hết hạn</label>
                    <input
                      type="date"
                      value={inspectionForm.expires_at}
                      onChange={(e) => setInspectionForm(p => ({ ...p, expires_at: e.target.value }))}
                      className="w-full px-2 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                </div>

                {!inspection ? (
                  <div className="text-[11px] text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded-lg flex items-start gap-2 mt-2">
                    <ClipboardCheck size={14} className="mt-0.5 shrink-0" />
                    Chưa có dữ liệu đăng kiểm. Vui lòng nhập để hệ thống tự động nhắc hạn.
                  </div>
                ) : (
                  <div className="text-[11px] text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/10 p-2 rounded-lg flex items-center gap-2 mt-2">
                    <ClipboardCheck size={14} className="shrink-0" />
                    Đã có dữ liệu. Hết hạn: {formatDate(inspection.expires_at)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default memo(VehicleDetailModal);
