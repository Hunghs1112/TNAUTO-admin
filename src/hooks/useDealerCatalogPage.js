import { useCallback, useMemo, useState } from 'react';
import { FolderOpen, Package } from 'lucide-react';

export default function useDealerCatalogPage() {
  const [activeTab, setActiveTab] = useState('categories');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const tabs = useMemo(
    () => [
      { id: 'categories', label: 'Danh mục sản phẩm đại lý', icon: FolderOpen },
      { id: 'products', label: 'Sản phẩm đại lý', icon: Package },
    ],
    []
  );

  const openProductDetail = useCallback((item) => {
    if (!item?.id) {
      return;
    }

    setSelectedProductId(item.id);
    setShowDetailModal(true);
  }, []);

  const closeProductDetail = useCallback(() => {
    setShowDetailModal(false);
    setSelectedProductId(null);
  }, []);

  const triggerProductsRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  return {
    activeTab,
    setActiveTab,
    tabs,
    showDetailModal,
    selectedProductId,
    refreshKey,
    openProductDetail,
    closeProductDetail,
    triggerProductsRefresh,
  };
}
