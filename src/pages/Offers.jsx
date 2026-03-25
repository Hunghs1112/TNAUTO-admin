import { memo, useCallback, useState } from 'react';
import GenericCrudPage from '../components/features/GenericCrudPage';
import OfferDetailModal from '../components/features/OfferDetailModal';
import { offersConfig } from '../config/entityConfigs.jsx';
import { offersAPI } from '../services/api';

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
    setRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <>
      <GenericCrudPage
        api={offersAPI}
        columns={offersConfig.columns}
        fieldsForModal={offersConfig.fieldsForModal}
        title={offersConfig.title}
        showPagination={true}
        limit={12}
        refreshTrigger={refreshKey}
        showActions={true}
        onView={handleViewOffer}
        onEdit={handleViewOffer}
        onRowClick={handleViewOffer}
      />

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
