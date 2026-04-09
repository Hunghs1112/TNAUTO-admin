import React, { useEffect, useMemo, useState } from 'react';
import { warrantiesAPI, servicesAPI, customersAPI, serviceOrdersAPI, employeesAPI } from '../../services/api';
import LoadingSpinner from '../ui/LoadingSpinner';
import FormField from '../form/FormField';
import { formatDate } from '../../utils/format';
import { useLoadingKey } from '../../contexts/LoadingContext';
import { useToast } from '../../contexts/ToastContext';
import { Edit2, Save, X, XCircle } from 'lucide-react';
import useDetailFetchGuard from '../../hooks/useDetailFetchGuard';

export default function WarrantyDetailModal({ isOpen, warrantyId, onClose, onSaved }) {
  const [selectedWarranty, setSelectedWarranty] = useState(null);
  const [serviceInfo, setServiceInfo] = useState(null);
  const [employeesMap, setEmployeesMap] = useState(new Map());
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    order_id: '',
    customer_id: '',
    warranty_period: '',
    start_date: '',
    supplier_name: '',
    note: ''
  });
  const [fieldOptions, setFieldOptions] = useState({
    order_id: [],
    customer_id: []
  });
  const [loadingOptions, setLoadingOptions] = useState(false);
  const { shouldSkipFetch, beginFetch, completeFetch, failFetch, resetFetchGuard } = useDetailFetchGuard();

  const { startLoading, stopLoading, loading } = useLoadingKey('warranties-detail', 'Đang tải chi tiết...');
  const { success, error } = useToast();

  useEffect(() => {
    if (isOpen && warrantyId) {
      fetchWarrantyDetails(warrantyId);
    } else {
      setSelectedWarranty(null);
      setServiceInfo(null);
      setIsEditMode(false);
      resetFetchGuard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, warrantyId]);

  useEffect(() => {
    const loadEmployeesMap = async () => {
      if (!isOpen) return;
      try {
        const res = await employeesAPI.getAll();
        const data = res.data?.data || res.data || [];
        const m = new Map();
        if (Array.isArray(data)) {
          data.forEach((emp) => {
            if (emp?.id && emp?.name) m.set(emp.id, emp.name);
          });
        }
        setEmployeesMap(m);
      } catch (err) {
        setEmployeesMap(new Map());
      }
    };

    loadEmployeesMap();
  }, [isOpen]);

  const fetchWarrantyDetails = async (id, { force = false } = {}) => {
    if (shouldSkipFetch(id, force)) return;

    beginFetch();
    startLoading('Đang tải chi tiết bảo hành...');
    try {
      const res = await warrantiesAPI.getById(id);
      const data = res.data?.data || res.data;
      setSelectedWarranty(data || null);

      const serviceId = data?.service_id || data?.service?.id;
      if (serviceId) {
        try {
          const sRes = await servicesAPI.getById(serviceId);
          const sData = sRes.data?.data || sRes.data;
          setServiceInfo(sData || null);
        } catch (err) {
          setServiceInfo(null);
        }
      } else {
        setServiceInfo(null);
      }
      completeFetch(id);
    } catch (err) {
      console.error('Fetch warranty details error:', err);
      error('Không thể tải chi tiết bảo hành: ' + (err.response?.data?.message || err.message));
      setSelectedWarranty(null);
      setServiceInfo(null);
      failFetch();
      onClose && onClose();
    } finally {
      stopLoading();
    }
  };

  const supplierName = useMemo(() => {
    return (
      serviceInfo?.supplier_name ||
      selectedWarranty?.service_supplier_name ||
      selectedWarranty?.supplier_name ||
      '-'
    );
  }, [serviceInfo, selectedWarranty]);

  const employeeName = useMemo(() => {
    return (
      selectedWarranty?.employee_name ||
      selectedWarranty?.employee?.name ||
      (selectedWarranty?.employee_id ? employeesMap.get(selectedWarranty.employee_id) : null) ||
      '-'
    );
  }, [selectedWarranty, employeesMap]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 backdrop-blur-sm animate-fade-in sm:p-4">
      <div className="flex max-h-[95vh] w-full max-w-4xl flex-col rounded-xl border border-slate-700/50 bg-slate-800 shadow-2xl animate-fade-in">
        <div className="gradient-header flex-shrink-0 border-b border-slate-700 p-4 transition-colors duration-300 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-100 transition-colors duration-300 sm:text-xl">
                {selectedWarranty ? `Chi tiết bảo hành #${selectedWarranty.id}` : 'Đang tải...'}
              </h3>
              {selectedWarranty?.service_name && (
                <p className="mt-1 text-sm text-slate-400">{selectedWarranty.service_name}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!loading && selectedWarranty && !isEditMode && (
                <button
                  onClick={async () => {
                    setIsEditMode(true);
                    setLoadingOptions(true);
                    try {
                      const [ordersRes, customersRes] = await Promise.all([
                        serviceOrdersAPI.getAll().catch(() => ({ data: { data: [] } })),
                        customersAPI.getAll().catch(() => ({ data: { data: [] } }))
                      ]);

                      const ordersData = ordersRes.data?.data || ordersRes.data || [];
                      const customersData = customersRes.data?.data || customersRes.data || [];

                      setFieldOptions({
                        order_id: Array.isArray(ordersData)
                          ? ordersData.map((o) => ({
                              value: o.id,
                              label: `#${o.id} - ${o.receiver_name || ''} (${o.license_plate || '-'})`
                            }))
                          : [],
                        customer_id: Array.isArray(customersData)
                          ? customersData.map((c) => ({
                              value: c.id,
                              label: `${c.name || ''} - ${c.phone || ''}`
                            }))
                          : []
                      });

                      // Lấy supplier_name giống như logic hiển thị ở chế độ xem
                      // Sử dụng trực tiếp từ supplierName computed value, thay '-' thành ''
                      const supplierValue = supplierName && supplierName !== '-' ? supplierName : '';

                      setFormData({
                        order_id: selectedWarranty.order_id || '',
                        customer_id: selectedWarranty.customer_id || '',
                        warranty_period: selectedWarranty.warranty_period ?? '',
                        start_date: selectedWarranty.start_date ? String(selectedWarranty.start_date).slice(0, 10) : '',
                        supplier_name: supplierValue,
                        note: selectedWarranty.note || ''
                      });
                    } finally {
                      setLoadingOptions(false);
                    }
                  }}
                  className="btn-gradient-primary flex items-center gap-2 px-3 py-1.5 text-sm font-medium"
                >
                  <Edit2 size={16} />
                  Sửa
                </button>
              )}
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-slate-400 transition-all duration-200 hover:bg-slate-700 hover:text-slate-200 active:scale-95"
                aria-label="Đóng"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex-1 flex items-center justify-center p-8">
            <LoadingSpinner size="lg" message="Đang tải thông tin bảo hành..." />
          </div>
        )}

        {!loading && selectedWarranty && (
          <div className="flex-1 space-y-4 overflow-y-auto bg-slate-800 p-4 transition-colors duration-300 sm:p-6">
            <div className="rounded-xl border border-slate-600 bg-slate-700/50 p-4">
              <h4 className="mb-3 text-base font-semibold text-slate-200 sm:text-lg">Thông tin bảo hành</h4>

              {isEditMode ? (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      startLoading('Đang lưu bảo hành...');
                      
                      // Cập nhật bảo hành (không có supplier_name)
                      await warrantiesAPI.update(selectedWarranty.id, {
                        order_id: formData.order_id ? parseInt(formData.order_id) : null,
                        customer_id: formData.customer_id ? parseInt(formData.customer_id) : null,
                        warranty_period: formData.warranty_period !== '' ? parseInt(formData.warranty_period) : null,
                        start_date: formData.start_date || null,
                        note: formData.note || null,
                      });
                      
                      // Nếu có thay đổi supplier_name và có service_id, cập nhật vào dịch vụ
                      const serviceId = selectedWarranty?.service_id || selectedWarranty?.service?.id;
                      if (serviceId && formData.supplier_name !== undefined) {
                        const currentSupplierName = 
                          serviceInfo?.supplier_name ||
                          selectedWarranty?.service_supplier_name ||
                          selectedWarranty?.supplier_name ||
                          '';
                        
                        // Chỉ cập nhật nếu có thay đổi
                        if (formData.supplier_name !== currentSupplierName) {
                          try {
                            await servicesAPI.update(serviceId, {
                              supplier_name: formData.supplier_name || null
                            });
                            // Refresh service info để hiển thị giá trị mới
                            const sRes = await servicesAPI.getById(serviceId);
                            const sData = sRes.data?.data || sRes.data;
                            setServiceInfo(sData || null);
                          } catch (serviceErr) {
                            console.error('Update service supplier_name error:', serviceErr);
                            // Không throw error để không block việc cập nhật bảo hành
                            error('Cập nhật bảo hành thành công nhưng có lỗi khi cập nhật nhà cung cấp: ' + (serviceErr.response?.data?.message || serviceErr.message));
                          }
                        }
                      }
                      
                      success('Cập nhật bảo hành thành công!');
                      setIsEditMode(false);
                      await fetchWarrantyDetails(selectedWarranty.id, { force: true });
                      onSaved && onSaved();
                    } catch (err) {
                      console.error('Update warranty error:', err);
                      error('Có lỗi xảy ra khi cập nhật bảo hành: ' + (err.response?.data?.message || err.message));
                    } finally {
                      stopLoading();
                    }
                  }}
                  className="space-y-4"
                >
                  {loadingOptions && (
                    <div className="mb-2 text-sm text-slate-300">Đang tải dữ liệu...</div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField
                      name="order_id"
                      label="Đơn hàng"
                      type="select"
                      value={formData.order_id}
                      onChange={(e) => setFormData({ ...formData, order_id: e.target.value })}
                      options={fieldOptions.order_id}
                      disabled={loadingOptions}
                    />

                    <FormField
                      name="customer_id"
                      label="Khách hàng"
                      type="select"
                      value={formData.customer_id}
                      onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                      options={fieldOptions.customer_id}
                      disabled={loadingOptions}
                    />

                    <FormField
                      name="warranty_period"
                      label="Thời hạn (tháng)"
                      type="number"
                      min={1}
                      value={formData.warranty_period}
                      onChange={(e) => setFormData({ ...formData, warranty_period: e.target.value })}
                    />

                    <FormField
                      name="start_date"
                      label="Ngày bắt đầu"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    />

                    <FormField
                      name="supplier_name"
                      label="Nhà cung cấp"
                      type="text"
                      value={formData.supplier_name}
                      onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                    />

                    <div className="sm:col-span-2">
                      <FormField
                        name="note"
                        label="Ghi chú"
                        type="textarea"
                        rows={3}
                        value={formData.note}
                        onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditMode(false)}
                      className="flex items-center gap-2 rounded-xl bg-slate-700 px-4 py-2.5 text-sm font-medium text-slate-200 shadow-sm transition-all duration-200 hover:bg-slate-600 hover:shadow-md active:scale-[0.98]"
                    >
                      <XCircle size={16} />
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-gradient-primary px-4 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm shadow-sm hover:shadow-md active:scale-[0.98] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save size={16} />
                      Lưu
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div><span className="font-medium text-slate-300">Đơn hàng:</span> <span className="text-slate-100">{selectedWarranty.order_number ? `#${selectedWarranty.order_number}` : (selectedWarranty.order_id ? `#${selectedWarranty.order_id}` : '-')}</span></div>
                  <div><span className="font-medium text-slate-300">Khách hàng:</span> <span className="text-slate-100">{selectedWarranty.customer_name || selectedWarranty.customer?.name || '-'}</span></div>
                  <div><span className="font-medium text-slate-300">Dịch vụ:</span> <span className="text-slate-100">{selectedWarranty.service_name || selectedWarranty.service?.name || '-'}</span></div>
                  <div><span className="font-medium text-slate-300">Nhà cung cấp:</span> <span className="text-slate-100">{supplierName}</span></div>
                  <div><span className="font-medium text-slate-300">Nhân viên:</span> <span className="text-slate-100">{employeeName}</span></div>
                  <div><span className="font-medium text-slate-300">Thời hạn (tháng):</span> <span className="text-slate-100">{selectedWarranty.warranty_period ?? '-'}</span></div>
                  <div><span className="font-medium text-slate-300">Ngày bắt đầu:</span> <span className="text-slate-100">{selectedWarranty.start_date ? formatDate(selectedWarranty.start_date) : '-'}</span></div>
                  <div><span className="font-medium text-slate-300">Ngày hết hạn:</span> <span className="text-slate-100">{selectedWarranty.end_date ? formatDate(selectedWarranty.end_date) : '-'}</span></div>
                  {selectedWarranty.note && (
                    <div className="sm:col-span-2"><span className="font-medium text-slate-300">Ghi chú:</span> <span className="text-slate-100">{selectedWarranty.note}</span></div>
                  )}
                  <div className="sm:col-span-2"><span className="font-medium text-slate-300">Ngày tạo:</span> <span className="text-slate-100">{selectedWarranty.created_at ? formatDate(selectedWarranty.created_at) : '-'}</span></div>
                </div>
              )}
            </div>
          </div>
        )}

        {!loading && selectedWarranty && (
          <div className="flex-shrink-0 border-t border-slate-700 bg-slate-800 p-4 sm:p-6">
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="flex items-center gap-2 rounded-xl bg-slate-700 px-4 py-2.5 text-sm font-medium text-slate-200 shadow-sm transition-all duration-200 hover:bg-slate-600 hover:shadow-md active:scale-[0.98]"
              >
                <X size={16} />
                Đóng
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
