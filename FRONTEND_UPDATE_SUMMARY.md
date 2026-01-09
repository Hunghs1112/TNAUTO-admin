# Frontend Update Summary - Offers (Ưu đãi) Enhancement

## Tổng quan
Đã cập nhật frontend để hỗ trợ:
1. **Trường content** - Hiển thị và chỉnh sửa nội dung chi tiết của ưu đãi
2. **Quản lý nhiều hình ảnh** - Mỗi ưu đãi có thể có nhiều hình ảnh (ảnh chính và ảnh phụ), giống như sản phẩm

---

## Các File Đã Cập Nhật

### 1. `src/services/api.js`
**Thay đổi:**
- Thêm các method quản lý hình ảnh cho offers:
  - `createImage(data)` - Tạo ảnh mới
  - `getImages(offerId)` - Lấy tất cả ảnh của ưu đãi
  - `updateImage(id, data)` - Cập nhật ảnh (đặt làm ảnh chính, v.v.)
  - `deleteImage(id)` - Xóa ảnh

**Code:**
```javascript
// Offer images management
createImage: (data) => api.post('/offers/images', data),
getImages: (offerId) => api.get(`/offers/${offerId}/images`),
updateImage: (id, data) => api.put(`/offers/images/${id}`, data),
deleteImage: (id) => api.delete(`/offers/images/${id}`),
```

---

### 2. `src/components/features/OfferDetailModal.jsx` (MỚI)
**Mô tả:**
- Component modal chi tiết ưu đãi, tương tự như `ProductDetailModal` và `ServiceDetailModal`
- Hỗ trợ:
  - Xem và chỉnh sửa thông tin ưu đãi (tên, dịch vụ, nội dung)
  - Quản lý nhiều hình ảnh (thêm, xóa, đặt ảnh chính)
  - Upload ảnh từ file hoặc URL
  - Hiển thị gallery với ảnh chính được đánh dấu

**Tính năng:**
- ✅ Xem thông tin ưu đãi
- ✅ Chỉnh sửa thông tin (tên, dịch vụ, nội dung)
- ✅ Thêm ảnh (upload file hoặc nhập URL)
- ✅ Xóa ảnh
- ✅ Đặt ảnh chính
- ✅ Hiển thị gallery với ảnh chính được highlight
- ✅ Tự động cập nhật ảnh chính khi xóa ảnh chính hiện tại

---

### 3. `src/config/entityConfigs.jsx`
**Thay đổi trong `offersConfig`:**

**Columns (cột hiển thị):**
- Thêm cột `service_name` (hiển thị tên dịch vụ thay vì chỉ ID)
- Thêm cột `content` (hiển thị nội dung, được truncate)
- Thêm cột `primary_image` (hiển thị ảnh chính)
- Thêm cột `images` (hiển thị số lượng ảnh)

**FieldsForModal (trường trong form):**
- Thêm trường `content` (textarea) để nhập nội dung ưu đãi
- Xóa trường `image_url` (vì giờ quản lý ảnh qua modal riêng)

**Code:**
```javascript
columns: [
  createIdColumn(),
  createTextField('name', 'Tên ưu đãi'),
  { key: 'service_name', label: 'Dịch vụ', render: (val, item) => {
    if (val) return val;
    if (item.service_id) return `ID: ${item.service_id}`;
    return '--';
  }},
  { key: 'content', label: 'Nội dung', render: (val) => truncateText(val) },
  { key: 'primary_image', label: 'Ảnh chính', render: (val) => val?.image_url ? <ImagePreview ... /> : '-' },
  { key: 'images', label: 'Số ảnh', render: (val) => val ? `${val.length} ảnh` : '0 ảnh' },
  createDateColumn('created_at', 'Ngày tạo'),
  createDateColumn('updated_at', 'Ngày cập nhật'),
],
fieldsForModal: [
  createTextFieldForModal('name', 'Tên ưu đãi', 'text', true),
  createSelectField('service_id', 'Dịch vụ', '/services'),
  createTextAreaField('content', 'Nội dung ưu đãi'),
],
```

---

### 4. `src/pages/Offers.jsx`
**Thay đổi:**
- Thêm state quản lý modal chi tiết
- Thêm handlers: `handleViewOffer`, `handleCloseModal`, `handleRefresh`
- Thêm `OfferDetailModal` component
- Cấu hình `GenericCrudPage` với `showActions={true}` và các callbacks

**Code:**
```javascript
const [showDetailModal, setShowDetailModal] = useState(false);
const [selectedOfferId, setSelectedOfferId] = useState(null);
const [refreshKey, setRefreshKey] = useState(0);

// ... handlers ...

<GenericCrudPage
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
```

---

## Cách Sử dụng

### 1. Xem Danh sách Ưu đãi
- Trang Offers hiển thị danh sách với các cột: ID, Tên, Dịch vụ, Nội dung, Ảnh chính, Số ảnh
- Click vào hàng hoặc nút "Xem" để mở modal chi tiết

### 2. Xem Chi tiết Ưu đãi
- Modal hiển thị:
  - Thông tin ưu đãi (tên, dịch vụ, nội dung)
  - Gallery hình ảnh với ảnh chính được đánh dấu
- Click vào ảnh để xem lớn

### 3. Chỉnh sửa Thông tin
- Click nút "Sửa" trong modal
- Chỉnh sửa: Tên, Dịch vụ, Nội dung
- Click "Lưu" để lưu thay đổi

### 4. Quản lý Hình ảnh
- **Thêm ảnh:** Click "Thêm ảnh" → Upload file hoặc nhập URL
- **Đặt ảnh chính:** Hover vào ảnh phụ → Click icon ⭐
- **Xóa ảnh:** Hover vào ảnh → Click icon 🗑️
- **Xem lớn:** Click vào ảnh

---

## Tương thích Ngược

- Code vẫn hỗ trợ `image_url` cũ (fallback)
- Nếu backend chưa có API images, sẽ sử dụng `image_url` từ offer data
- Nếu không có `images` array, sẽ tạo ảnh tạm từ `image_url`

---

## Components Được Sử dụng

1. **OfferDetailModal** - Modal chi tiết ưu đãi (MỚI)
2. **ImageGrid** - Hiển thị gallery ảnh (đã có, hỗ trợ is_primary)
3. **ImageUploader** - Upload ảnh từ file/URL (đã có)
4. **FormField** - Form fields (đã có)
5. **LoadingSpinner** - Loading state (đã có)
6. **ImagePreview** - Preview ảnh trong table (đã có)

---

## API Endpoints Sử dụng

### Offers CRUD
- `GET /api/offers` - Lấy danh sách
- `GET /api/offers/:id` - Lấy chi tiết
- `POST /api/offers/admin` - Tạo mới
- `PUT /api/offers/admin/:id` - Cập nhật
- `DELETE /api/offers/admin/:id` - Xóa

### Offer Images
- `GET /api/offers/:offerId/images` - Lấy tất cả ảnh
- `POST /api/offers/images` - Tạo ảnh mới
- `PUT /api/offers/images/:id` - Cập nhật ảnh
- `DELETE /api/offers/images/:id` - Xóa ảnh

### Upload
- `POST /api/offers/admin/:id/upload-image` - Upload file

---

## Checklist Hoàn thành

- [x] Cập nhật API service với methods quản lý ảnh
- [x] Tạo OfferDetailModal component
- [x] Cập nhật offersConfig với content field
- [x] Cập nhật offersConfig columns để hiển thị ảnh và nội dung
- [x] Cập nhật Offers page để sử dụng OfferDetailModal
- [x] Hỗ trợ thêm/xóa/đặt ảnh chính
- [x] Hỗ trợ upload ảnh từ file hoặc URL
- [x] Hiển thị gallery với ảnh chính được highlight
- [x] Tương thích ngược với image_url cũ
- [x] Xử lý loading states và errors
- [x] Không có linter errors

---

## Lưu ý

1. **Backend phải sẵn sàng:** Frontend đã sẵn sàng, nhưng cần backend implement các API endpoints mới
2. **Ảnh chính:** Mỗi ưu đãi chỉ có 1 ảnh chính, được đánh dấu bằng `is_primary = 1`
3. **Tự động cập nhật:** Khi đặt ảnh mới làm ảnh chính, ảnh chính cũ tự động thành ảnh phụ
4. **Xóa ảnh chính:** Nếu xóa ảnh chính và còn ảnh khác, ảnh đầu tiên tự động trở thành ảnh chính

---

**Tất cả các thay đổi đã hoàn thành và sẵn sàng sử dụng!**


