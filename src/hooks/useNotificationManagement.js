import { useCallback, useEffect, useMemo, useState } from 'react';
import { notificationsAPI } from '../services/api';

function normalizeDateFilterBoundary(value) {
  const input = String(value || '').trim();
  if (!input) return '';

  const matchedIso = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (matchedIso) {
    return input;
  }

  const matchedVn = input.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (matchedVn) {
    const [, day, month, year] = matchedVn;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  return input;
}

function buildNotificationParams(page, limit, filters) {
  const params = { page, limit };

  Object.entries(filters).forEach(([key, value]) => {
    if (value === '' || value === null || value === undefined) {
      return;
    }

    if (key === 'date_from') {
      params.from_date = normalizeDateFilterBoundary(value);
      return;
    }

    if (key === 'date_to') {
      params.to_date = normalizeDateFilterBoundary(value);
      return;
    }

    params[key] = value;
  });

  return params;
}

function normalizeListResponse(response) {
  const raw = response?.data;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data?.data)) return raw.data.data;
  return [];
}

const EMPTY_FILTERS = {
  date_from: '',
  date_to: '',
  type: '',
  status: '',
  recipient_type: '',
  recipient_id: '',
  ref_type: '',
  ref_id: '',
  is_read: '',
};

export default function useNotificationManagement({ showSuccess, showError, initialLimit = 50 }) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);

  const totalPages = useMemo(() => Math.max(1, Math.ceil((total || 0) / Math.max(1, limit))), [limit, total]);

  const recipientNameByKey = useMemo(() => {
    const nextMap = {};

    customers.forEach((customer) => {
      nextMap[`customer:${customer.id}`] = customer.name || `#${customer.id}`;
    });

    employees.forEach((employee) => {
      nextMap[`employee:${employee.id}`] = employee.name || `#${employee.id}`;
    });

    return nextMap;
  }, [customers, employees]);

  const loadLookupData = useCallback(async () => {
    try {
      const [customersResponse, employeesResponse] = await Promise.all([
        notificationsAPI.getCustomers(),
        notificationsAPI.getEmployees(),
      ]);

      setCustomers(normalizeListResponse(customersResponse));
      setEmployees(normalizeListResponse(employeesResponse));
    } catch {
      setCustomers([]);
      setEmployees([]);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);

    try {
      const params = buildNotificationParams(currentPage, limit, appliedFilters);

      const response = await notificationsAPI.getAll(params);
      const nextItems = normalizeListResponse(response);
      const pagination = response.data?.pagination;
      const nextTotal = pagination?.total ?? response.data?.count ?? response.data?.total ?? nextItems.length;

      setItems(nextItems);
      setTotal(Number(nextTotal) || 0);
    } catch (fetchError) {
      setItems([]);
      setTotal(0);
      showError(fetchError?.message || 'Không thể tải danh sách thông báo.');
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, currentPage, limit, showError]);

  useEffect(() => {
    loadLookupData();
  }, [loadLookupData]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleDelete = useCallback(
    async (id) => {
      if (!window.confirm('Bạn có chắc chắn muốn xóa thông báo này không?')) {
        return;
      }

      try {
        await notificationsAPI.delete(id);
        showSuccess('Đã xóa thông báo.');
        fetchNotifications();
      } catch (deleteError) {
        showError(deleteError?.message || 'Không thể xóa thông báo.');
      }
    },
    [fetchNotifications, showError, showSuccess]
  );

  const handleApplyFilters = useCallback(() => {
    setCurrentPage(1);
    setAppliedFilters(filters);
  }, [filters]);

  const handleClearFilters = useCallback(() => {
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setCurrentPage(1);
  }, []);

  const changeLimit = useCallback((nextLimit) => {
    setLimit(Number(nextLimit) || initialLimit);
    setCurrentPage(1);
  }, [initialLimit]);

  return {
    loading,
    items,
    total,
    customers,
    employees,
    showSendModal,
    setShowSendModal,
    showFilters,
    setShowFilters,
    selectedNotification,
    setSelectedNotification,
    currentPage,
    setCurrentPage,
    totalPages,
    limit,
    changeLimit,
    filters,
    setFilters,
    recipientNameByKey,
    fetchNotifications,
    handleDelete,
    handleApplyFilters,
    handleClearFilters,
  };
}
