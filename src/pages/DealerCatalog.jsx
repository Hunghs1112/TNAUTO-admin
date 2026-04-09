import { memo, useCallback, useMemo, useState } from 'react';
import { FolderOpen, Package, Store } from 'lucide-react';
import GenericCrudPage from '../components/features/GenericCrudPage';
import DealerProductDetailModal from '../components/features/DealerProductDetailModal';
import PageHeader from '../components/layout/PageHeader';
import TabView from '../components/ui/TabView';
import { dealerCategoriesConfig, dealerProductsConfig } from '../config/entityConfigs';
import { dealerCategoriesAPI, dealerProductsAPI } from '../services/api';

function DealerCategoriesSection() {
  return (
    <div className="space-y-4">
      <div className="app-panel">
        <div className="app-panel-body text-sm leading-6 text-[#f8ecd6]">
          <div className="rounded-2xl border border-[#c37b1e]/40 bg-[#c37b1e]/12 px-4 py-3">
            Danh mục sản phẩm đại lí là catalog riêng. Nếu danh mục vẫn còn sản phẩm, hệ thống sẽ chặn xóa để tránh mất liên kết dữ liệu.
          </div>
        </div>
      </div>

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

function DealerProductsSection() {
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
      <div className="app-panel">
        <div className="app-panel-body text-sm leading-6 text-[#dfe1e3]">
          <div className="rounded-2xl border border-[#1e406b]/40 bg-[#1e406b]/12 px-4 py-3">
            Tạo và chỉnh sửa sản phẩm dealer tại đây. Bấm vào từng dòng để mở chi tiết, quản lý ảnh, đổi ảnh chính và cập nhật video.
          </div>
        </div>
      </div>

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
        onView={handleViewProduct}
        onEdit={handleViewProduct}
        onRowClick={handleViewProduct}
        categoryChangeEventName={null}
      />

      <DealerProductDetailModal
        isOpen={showDetailModal}
        productId={selectedProductId}
        onClose={handleCloseModal}
        onRefresh={handleRefresh}
      />
    </>
  );
}

function DealerCatalog() {
  const [activeTab, setActiveTab] = useState('categories');

  const tabs = useMemo(
    () => [
      { id: 'categories', label: 'Danh mục sản phẩm đại lí', icon: FolderOpen },
      { id: 'products', label: 'Sản phẩm dealer', icon: Package },
    ],
    []
  );

  return (
    <div className="app-page">
      <PageHeader
        title="Danh mục sản phẩm đại lí"
        description="Quản lý module catalog tách riêng cho đại lí với nhóm danh mục, sản phẩm và ảnh sản phẩm theo bộ API `/api/dealer/*`."
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
          {activeTab === 'categories' ? <DealerCategoriesSection /> : <DealerProductsSection />}
        </div>
      </section>
    </div>
  );
}

export default memo(DealerCatalog);
