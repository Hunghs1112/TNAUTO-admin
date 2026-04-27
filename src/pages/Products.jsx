import { memo, useCallback, useState } from 'react';
import ProductDetailModal from '../components/features/ProductDetailModal';
import GenericCrudPage from '../components/features/GenericCrudPage';
import { productsConfig } from '../config/entityConfigs.jsx';
import { productsAPI } from '../services/api';

function Products() {
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleViewProduct = useCallback((item) => {
    setSelectedProductId(item.id);
    setShowDetailModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowDetailModal(false);
    setSelectedProductId(null);
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <>
      <GenericCrudPage
        api={productsAPI}
        columns={productsConfig.columns}
        fieldsForModal={productsConfig.fieldsForModal}
        title={productsConfig.title}
        description="Theo dõi và quản lý thông tin sản phẩm."
        showPagination={true}
        limit={12}
        refreshTrigger={refreshKey}
        showActions={true}
        onView={handleViewProduct}
        onEdit={handleViewProduct}
        onRowClick={handleViewProduct}
      />

      <ProductDetailModal
        isOpen={showDetailModal}
        productId={selectedProductId}
        onClose={handleCloseModal}
        onRefresh={handleRefresh}
      />
    </>
  );
}

export default memo(Products);


