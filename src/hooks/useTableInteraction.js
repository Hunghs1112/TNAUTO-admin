import { useCallback, useMemo, useState } from 'react';

function normalizeSearchValue(value) {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.join(' ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function normalizeSearchText(value) {
  return normalizeSearchValue(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function extractSearchTokens(value) {
  return normalizeSearchText(value)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

export default function useTableInteraction({
  data,
  columns,
  idKey,
  enableSort,
  serverSideSearch,
  onSearchChange,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [selectedRows, setSelectedRows] = useState(new Set());

  const filteredData = useMemo(() => {
    let nextData = [...data];
    const searchTokens = extractSearchTokens(searchTerm);

    if (searchTokens.length > 0 && !serverSideSearch) {
      nextData = nextData.filter((item) => {
        const searchableText = normalizeSearchText(columns.map((column) => item[column.key]).join(' '));
        return searchTokens.every((token) => searchableText.includes(token));
      });
    }

    if (enableSort && sortConfig.key) {
      nextData.sort((leftItem, rightItem) => {
        const leftValue = leftItem[sortConfig.key];
        const rightValue = rightItem[sortConfig.key];

        if (leftValue === rightValue) return 0;
        if (leftValue === null || leftValue === undefined) return 1;
        if (rightValue === null || rightValue === undefined) return -1;

        const comparison = leftValue < rightValue ? -1 : 1;
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }

    return nextData;
  }, [columns, data, enableSort, searchTerm, serverSideSearch, sortConfig]);

  const handleSearch = useCallback(
    (value) => {
      const nextSearchTerm = String(value || '').trim();
      setSearchTerm(nextSearchTerm);
      onSearchChange?.(nextSearchTerm);
    },
    [onSearchChange]
  );

  const handleSort = useCallback(
    (key) => {
      if (!enableSort) {
        return;
      }

      setSortConfig((prev) => {
        if (prev.key === key && prev.direction === 'asc') {
          return { key, direction: 'desc' };
        }

        if (prev.key === key && prev.direction === 'desc') {
          return { key: null, direction: null };
        }

        return { key, direction: 'asc' };
      });
    },
    [enableSort]
  );

  const handleSelectAll = useCallback(
    (checked) => {
      if (!checked) {
        setSelectedRows(new Set());
        return;
      }

      setSelectedRows(new Set(filteredData.map((item) => item[idKey])));
    },
    [filteredData, idKey]
  );

  const handleSelectRow = useCallback((id, checked) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  return {
    searchTerm,
    sortConfig,
    selectedRows,
    setSelectedRows,
    filteredData,
    handleSearch,
    handleSort,
    handleSelectAll,
    handleSelectRow,
  };
}
