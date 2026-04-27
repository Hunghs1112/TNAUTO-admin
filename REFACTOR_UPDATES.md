# Refactor Updates Log

## Date
- 2026-04-25

## Goal
Tách logic khỏi các file giao diện theo hướng **custom hooks + service layer**, giữ UI component tập trung render.

---

## Completed

### 1) Generic CRUD foundation

#### Added
- `src/hooks/useServerPagination.js`
  - Quản lý phân trang/search state: `currentPage`, `totalItems`, `totalPages`, `searchTerm`
  - Expose handlers: `handlePageChange`, `handleSearchChange`, `applyMeta`, `resetPagination`, `setClientModeTotals`

- `src/hooks/useListFetch.js`
  - Quản lý fetch list + loading state (`isInitialLoading`, `isRefreshing`)
  - Tách parse list response và pagination meta khỏi UI
  - Chuẩn hóa handling cho `additionalParams`, `search`, `page`

#### Refactored
- `src/components/features/GenericCrudPage.jsx`
  - Di chuyển phần lớn logic fetch/pagination/search sang hooks
  - Giữ nguyên public props và hành vi UI
  - Vẫn hỗ trợ refresh trigger và optimistic delete counters

---

### 2) Dealer Catalog page

#### Added
- `src/hooks/useDealerCatalogPage.js`
  - Quản lý state tab, modal, selected product, refresh trigger
  - Tách toàn bộ handler mở/đóng modal và refresh

#### Refactored
- `src/pages/DealerCatalog.jsx`
  - Giữ UI/markup, giảm logic inline

---

### 3) Service Reminder Rules page

#### Added
- `src/hooks/useServiceReminderRulesPage.js`
  - Quản lý load data, filter, edit modal, form state, toggle enabled, save config
  - Tách helper xử lý reminder days và preview template
  - Export `renderTemplate` để UI dùng trực tiếp

#### Refactored
- `src/pages/ServiceReminderRules.jsx`
  - UI file chỉ còn render và bind handlers từ hook

---

### 4) Notification Management

#### Added
- `src/hooks/useNotificationManagement.js`
  - Quản lý state cho list/filter/pagination/limit/modal
  - Chuẩn hóa build params và normalize response
  - Tách actions: apply/clear filter, delete, refetch

#### Refactored
- `src/components/features/NotificationManagement.jsx`
  - Rút logic dữ liệu sang hook
  - Sửa lỗi cũ liên quan `limit`/`offset` không khai báo trong filter section
  - Dùng `limit` động và `changeLimit` thống nhất với fetch

---

### 5) Generic Table interaction split

#### Added
- `src/hooks/useTableInteraction.js`
  - Quản lý logic search/sort/bulk-select
  - Tách normalize/tokenize tìm kiếm và xử lý sort

#### Refactored
- `src/components/table/Table.jsx`
  - Di chuyển phần interaction logic sang hook
  - Giữ nguyên render structure và API của component

---

## Validation

- Đã chạy lint cho toàn bộ file chỉnh sửa trong đợt này.
- Kết quả: **No linter errors found**.

---

## Notes

- Tất cả thay đổi ưu tiên **không làm đổi behavior UI hiện có**.
- Refactor theo hướng incremental, có thể tiếp tục bóc tách sâu hơn ở:
  - modal/detail components lớn (`ProductDetailModal`, `OfferDetailModal`, `ServiceOrderDetailModal`)
  - `entityConfigs.jsx` (tách module theo domain để giảm kích thước file)
