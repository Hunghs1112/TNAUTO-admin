import { memo } from 'react';
import { Store } from 'lucide-react';
import GenericCrudPage from '../components/features/GenericCrudPage';
import DealerProductDetailModal from '../components/features/DealerProductDetailModal';
import PageHeader from '../components/layout/PageHeader';
import TabView from '../components/ui/TabView';
import { dealerCategoriesConfig, dealerProductsConfig } from '../config/entityConfigs';
import useDealerCatalogPage from '../hooks/useDealerCatalogPage';
import { dealerCategoriesAPI, dealerProductsAPI } from '../services/api';

function DealerCategoriesSection() {
  return (
    <div className="space-y-4">
      <GenericCrudPage
        api={dealerCategoriesAPI}
        columns={dealerCategoriesConfig.columns}
        fieldsForModal={dealerCategoriesConfig.fieldsForModal}
        title={dealerCategoriesConfig.title}
        showPagination={true}
        limit={20}
        hideTitle={true}
      />
    </div>
  );
}

function DealerProductsSection({ refreshKey, onOpenProductDetail, onCloseProductDetail, onRefresh, selectedProductId, showDetailModal }) {
  return (
    <>
      <GenericCrudPage
        api={dealerProductsAPI}
        columns={dealerProductsConfig.columns}
        fieldsForModal={dealerProductsConfig.fieldsForModal}
        title={dealerProductsConfig.title}
        showPagination={true}
        limit={12}
        refreshTrigger={refreshKey}
        showActions={true}
        hideTitle={true}
        onView={onOpenProductDetail}
        onEdit={onOpenProductDetail}
        onRowClick={onOpenProductDetail}
        categoryChangeEventName={null}
      />

      <DealerProductDetailModal
        isOpen={showDetailModal}
        productId={selectedProductId}
        onClose={onCloseProductDetail}
        onRefresh={onRefresh}
      />
    </>
  );
}

function DealerCatalog() {
  const {
    activeTab,
    setActiveTab,
    tabs,
    showDetailModal,
    selectedProductId,
    refreshKey,
    openProductDetail,
    closeProductDetail,
    triggerProductsRefresh,
  } = useDealerCatalogPage();

  return (
    <div className="app-page">
      <PageHeader
        title="Danh mục sản phẩm đại lý"
        badge="API riêng"
      >
        <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-2 text-sm font-medium text-slate-200 shadow-sm">
          <Store className="h-4 w-4" />
          <span>/api/dealer</span>
        </div>
      </PageHeader>

      <section className="app-panel">
        <div className="app-panel-body space-y-5">
          <TabView tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
          {activeTab === 'categories' ? (
            <DealerCategoriesSection />
          ) : (
            <DealerProductsSection
              refreshKey={refreshKey}
              onOpenProductDetail={openProductDetail}
              onCloseProductDetail={closeProductDetail}
              onRefresh={triggerProductsRefresh}
              selectedProductId={selectedProductId}
              showDetailModal={showDetailModal}
            />
          )}
        </div>
      </section>
    </div>
  );
}

export default memo(DealerCatalog);
