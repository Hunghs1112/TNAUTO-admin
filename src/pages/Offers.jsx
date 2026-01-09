// src/pages/Offers.jsx
import { useState, memo, useCallback } from 'react';
import GenericCrudPage from '../components/features/GenericCrudPage';
import OfferDetailModal from '../components/features/OfferDetailModal';
import { offersAPI } from '../services/api';
import { offersConfig } from '../config/entityConfigs.jsx';

function Offers() {
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOfferId, setSelectedOfferId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleViewOffer = useCallback((item) => {
    setSelectedOfferId(item.id);
    setShowDetailModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowDetailModal(false);
    setSelectedOfferId(null);
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  return (
    <>
      <GenericCrudPage
        key={refreshKey}
        api={offersAPI}
        columns={offersConfig.columns}
        fieldsForModal={offersConfig.fieldsForModal}
        title={offersConfig.title}
        showActions={true}
        onView={handleViewOffer}
        onEdit={handleViewOffer}
        onRowClick={handleViewOffer}
      />

      {/* Offer Detail Modal - Form riêng cho ưu đãi với quản lý ảnh */}
      <OfferDetailModal
        isOpen={showDetailModal}
        offerId={selectedOfferId}
        onClose={handleCloseModal}
        onRefresh={handleRefresh}
      />
    </>
  );
}

export default memo(Offers);