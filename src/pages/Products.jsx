// src/pages/Products.jsx
import { useState } from 'react';
import GenericCrudPage from '../components/features/GenericCrudPage';
import ProductDetailModal from '../components/features/ProductDetailModal';
import { productsAPI } from '../services/api';
import { productsConfig } from '../config/entityConfigs.jsx';

export default function Products() {
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleViewProduct = (item) => {
    setSelectedProductId(item.id);
    setShowDetailModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailModal(false);
    setSelectedProductId(null);
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <>
      <GenericCrudPage
        key={refreshKey}
        api={productsAPI}
        columns={productsConfig.columns}
        fieldsForModal={productsConfig.fieldsForModal}
        title={productsConfig.title}
        showActions={true}
        onView={handleViewProduct}
        onEdit={handleViewProduct}
        onRowClick={handleViewProduct}
      />

      {/* Product Detail Modal - Form riêng cho sản phẩm với quản lý ảnh */}
      <ProductDetailModal
        isOpen={showDetailModal}
        productId={selectedProductId}
        onClose={handleCloseModal}
        onRefresh={handleRefresh}
      />
    </>
  );
}