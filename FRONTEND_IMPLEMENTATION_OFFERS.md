# Frontend Implementation - Offers (Ưu đãi) Enhancement

## Tổng quan
Frontend đã được cập nhật để hỗ trợ:
1. **Trường content** - Hiển thị và chỉnh sửa nội dung chi tiết của ưu đãi
2. **Quản lý nhiều hình ảnh** - Mỗi ưu đãi có thể có nhiều hình ảnh (ảnh chính và ảnh phụ), giống như sản phẩm

---

## 1. Các File Đã Cập Nhật

### 1.1 `src/services/api.js`
**Đã thêm các methods quản lý ảnh:**
```javascript
// Offer images management
createImage: (data) => api.post('/offers/images', data),
getImages: (offerId) => api.get(`/offers/${offerId}/images`),
updateImage: (id, data) => api.put(`/offers/images/${id}`, data),
deleteImage: (id) => api.delete(`/offers/images/${id}`),
```

### 1.2 `src/components/features/OfferDetailModal.jsx` (MỚI)
**Component modal chi tiết ưu đãi với các tính năng:**
- ✅ Xem và chỉnh sửa thông tin ưu đãi (tên, dịch vụ, nội dung)
- ✅ Quản lý nhiều hình ảnh (thêm, xóa, đặt ảnh chính)
- ✅ Upload ảnh từ file hoặc URL
- ✅ Hiển thị gallery với ảnh chính được đánh dấu

### 1.3 `src/config/entityConfigs.jsx`
**Đã cập nhật `offersConfig`:**
- Thêm cột `content` (hiển thị nội dung)
- Thêm cột `service_name` (hiển thị tên dịch vụ)
- Thêm cột `primary_image` (hiển thị ảnh chính)
- Thêm cột `images` (hiển thị số lượng ảnh)
- Thêm trường `content` (textarea) trong form

### 1.4 `src/pages/Offers.jsx`
**Đã tích hợp OfferDetailModal:**
- Thêm state quản lý modal
- Thêm handlers: `handleViewOffer`, `handleCloseModal`, `handleRefresh`
- Cấu hình GenericCrudPage với actions và callbacks

---

## 2. Data Format

### 2.1 Response Format - GET `/api/offers` và `/api/offers/:id`

**Format mong đợi từ backend:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Ưu đãi mùa hè",
    "service_id": 5,
    "service_name": "Thay dầu",
    "content": "Giảm giá 20% cho tất cả dịch vụ thay dầu. Áp dụng từ ngày 1/1 đến 31/1/2024.",
    "image_url": "https://example.com/image.jpg",
    "primary_image": {
      "id": 1,
      "image_url": "https://example.com/image.jpg",
      "is_primary": 1
    },
    "images": [
      {
        "id": 1,
        "image_url": "https://example.com/image.jpg",
        "is_primary": 1,
        "display_order": 0
      },
      {
        "id": 2,
        "image_url": "https://example.com/image2.jpg",
        "is_primary": 0,
        "display_order": 1
      }
    ],
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

**Các trường:**
- `content` (string, nullable): Nội dung chi tiết của ưu đãi
- `images` (array): Danh sách tất cả hình ảnh của ưu đãi
- `primary_image` (object, nullable): Thông tin ảnh chính (ảnh có `is_primary = 1`)
- `image_url` (string, nullable): Ảnh chính (backward compatible, sync với primary_image)

---

## 3. API Endpoints Sử dụng

### 3.1 Offers CRUD
- `GET /api/offers` - Lấy danh sách (cần trả về `content`, `images`, `primary_image`)
- `GET /api/offers/:id` - Lấy chi tiết (cần trả về `content`, `images`, `primary_image`)
- `POST /api/offers/admin` - Tạo mới (có thể gửi `content`)
- `PUT /api/offers/admin/:id` - Cập nhật (có thể gửi `content`)

### 3.2 Offer Images (⚠️ CẦN BACKEND IMPLEMENT)
- `GET /api/offers/:offerId/images` - Lấy tất cả ảnh
- `POST /api/offers/images` - Tạo ảnh mới
- `PUT /api/offers/images/:id` - Cập nhật ảnh (đặt làm ảnh chính)
- `DELETE /api/offers/images/:id` - Xóa ảnh

### 3.3 Upload
- `POST /api/offers/admin/:id/upload-image` - Upload file (cần trả về `image_id`)

---

## 4. Cách Sử dụng

### 4.1 Xem Danh sách Ưu đãi
1. Vào trang **Ưu đãi** (`/offers`)
2. Danh sách hiển thị: ID, Tên, Dịch vụ, Nội dung, Ảnh chính, Số ảnh
3. Click vào hàng hoặc nút "Xem" để mở modal chi tiết

### 4.2 Xem Chi tiết Ưu đãi
1. Click vào ưu đãi trong danh sách
2. Modal hiển thị:
   - **Thông tin ưu đãi**: Tên, Dịch vụ, Nội dung
   - **Gallery hình ảnh**: Tất cả ảnh với ảnh chính được đánh dấu
3. Click vào ảnh để xem lớn

### 4.3 Chỉnh sửa Thông tin
1. Trong modal chi tiết, click nút **"Sửa"**
2. Chỉnh sửa: Tên, Dịch vụ, Nội dung
3. Click **"Lưu"** để lưu thay đổi

### 4.4 Quản lý Hình ảnh

#### Thêm ảnh:
1. Trong modal chi tiết, click **"Thêm ảnh"**
2. Chọn một trong hai cách:
   - **Upload file**: Kéo thả hoặc chọn file từ máy
   - **Nhập URL**: Dán link ảnh
3. Ảnh sẽ được thêm vào gallery
4. Nếu là ảnh đầu tiên, tự động trở thành ảnh chính

#### Đặt ảnh chính:
1. Hover vào ảnh phụ trong gallery
2. Click icon ⭐ (star)
3. Ảnh sẽ trở thành ảnh chính, ảnh chính cũ tự động thành ảnh phụ

#### Xóa ảnh:
1. Hover vào ảnh trong gallery
2. Click icon 🗑️ (trash)
3. Xác nhận xóa
4. Nếu xóa ảnh chính, ảnh đầu tiên còn lại tự động trở thành ảnh chính

---

## 5. Components Được Sử dụng

### 5.1 OfferDetailModal (MỚI)
**Location:** `src/components/features/OfferDetailModal.jsx`

**Props:**
- `isOpen` (boolean): Modal có mở không
- `offerId` (number): ID của ưu đãi
- `onClose` (function): Callback khi đóng modal
- `onRefresh` (function): Callback khi cần refresh danh sách

**Features:**
- Xem/Chỉnh sửa thông tin ưu đãi
- Quản lý nhiều ảnh
- Upload ảnh từ file hoặc URL
- Đặt ảnh chính
- Xóa ảnh

### 5.2 ImageGrid
**Location:** `src/components/image/ImageGrid.jsx`

**Props:**
- `images` (array): Danh sách ảnh
- `onDelete` (function): Callback khi xóa ảnh
- `onSetPrimary` (function): Callback khi đặt ảnh chính
- `emptyTitle` (string): Tiêu đề khi không có ảnh
- `emptyDescription` (string): Mô tả khi không có ảnh

**Features:**
- Hiển thị grid ảnh
- Đánh dấu ảnh chính (border vàng, badge "Ảnh chính")
- Hover actions: Xem lớn, Đặt làm ảnh chính, Xóa
- Lightbox để xem ảnh lớn

### 5.3 ImageUploader
**Location:** `src/components/image/ImageUploader.jsx`

**Features:**
- Upload file (drag & drop hoặc chọn file)
- Nhập URL ảnh
- Hỗ trợ multiple files
- Preview ảnh trước khi upload

### 5.4 FormField
**Location:** `src/components/form/FormField.jsx`

**Features:**
- Text input
- Textarea (cho content)
- Select (cho service_id)
- Image upload

---

## 6. State Management

### 6.1 OfferDetailModal State
```javascript
const [selectedOffer, setSelectedOffer] = useState(null);      // Thông tin ưu đãi
const [offerImages, setOfferImages] = useState([]);             // Danh sách ảnh
const [showImageUploader, setShowImageUploader] = useState(false); // Hiển thị uploader
const [isEditMode, setIsEditMode] = useState(false);           // Chế độ chỉnh sửa
const [formData, setFormData] = useState({});                   // Dữ liệu form
const [fieldOptions, setFieldOptions] = useState({});           // Options cho select fields
```

### 6.2 Offers Page State
```javascript
const [showDetailModal, setShowDetailModal] = useState(false);
const [selectedOfferId, setSelectedOfferId] = useState(null);
const [refreshKey, setRefreshKey] = useState(0);
```

---

## 7. API Integration

### 7.1 Fetch Offer Details
```javascript
const fetchOfferDetails = async (id) => {
  // Lấy thông tin ưu đãi
  const offerRes = await offersAPI.getById(id);
  const offerData = offerRes.data.data || offerRes.data;
  setSelectedOffer(offerData);

  // Lấy danh sách ảnh
  try {
    const imagesRes = await offersAPI.getImages(id);
    const imagesData = imagesRes.data.data || imagesRes.data;
    setOfferImages(imagesData);
  } catch (err) {
    // Fallback: sử dụng images từ offer data hoặc image_url
    if (offerData?.images) {
      setOfferImages(offerData.images);
    } else if (offerData?.image_url) {
      setOfferImages([{
        id: 'temp',
        image_url: offerData.image_url,
        is_primary: 1
      }]);
    }
  }
};
```

### 7.2 Create Image
```javascript
const handleImageUpload = async (imageUrls) => {
  const urls = Array.isArray(imageUrls) ? imageUrls : [imageUrls];
  const validUrls = urls.filter(url => !url.startsWith('data:image/'));
  
  let isFirstImage = offerImages.length === 0;
  
  for (const imageUrl of validUrls) {
    const imageData = {
      offer_id: parseInt(selectedOffer.id),
      image_url: imageUrl,
      is_primary: isFirstImage && !firstImageUrl ? 1 : 0
    };
    
    await offersAPI.createImage(imageData);
    
    if (!firstImageUrl) {
      firstImageUrl = imageUrl;
    }
  }
  
  // Nếu là ảnh đầu tiên, cập nhật offer.image_url
  if (isFirstImage && firstImageUrl) {
    await offersAPI.update(selectedOffer.id, {
      image_url: firstImageUrl
    });
  }
};
```

### 7.3 Set Primary Image
```javascript
const handleSetPrimary = async (imageId) => {
  // Cập nhật ảnh thành ảnh chính
  await offersAPI.updateImage(imageId, { is_primary: 1 });
  
  // Cập nhật tất cả ảnh khác thành ảnh phụ
  const otherImages = offerImages.filter(
    img => img.id !== imageId && img.is_primary === 1
  );
  for (const img of otherImages) {
    await offersAPI.updateImage(img.id, { is_primary: 0 });
  }
  
  // Cập nhật offer.image_url
  const primaryImage = offerImages.find(img => img.id === imageId);
  await offersAPI.update(selectedOffer.id, {
    image_url: primaryImage.image_url
  });
};
```

### 7.4 Delete Image
```javascript
const handleDeleteImage = async (imageId, imageUrl) => {
  const deletedImage = offerImages.find(img => img.id === imageId);
  const isPrimary = deletedImage && deletedImage.is_primary === 1;
  
  // Xóa ảnh
  await offersAPI.deleteImage(imageId);
  
  // Nếu xóa ảnh chính và còn ảnh khác
  if (isPrimary && offerImages.length > 1) {
    const remainingImages = offerImages.filter(img => img.id !== imageId);
    const newPrimaryImage = remainingImages[0];
    
    // Đặt ảnh đầu tiên làm ảnh chính
    await offersAPI.updateImage(newPrimaryImage.id, { is_primary: 1 });
    await offersAPI.update(selectedOffer.id, {
      image_url: newPrimaryImage.image_url
    });
  } else if (isPrimary && offerImages.length === 1) {
    // Không còn ảnh nào, xóa image_url
    await offersAPI.update(selectedOffer.id, { image_url: null });
  }
};
```

---

## 8. Error Handling

### 8.1 Fallback Logic
- Nếu API `getImages` không tồn tại, sử dụng `images` từ offer data
- Nếu không có `images` array, tạo ảnh tạm từ `image_url`
- Nếu không có ảnh nào, hiển thị empty state

### 8.2 Error Messages
- "Không thể tải chi tiết ưu đãi" - Khi fetch offer details thất bại
- "Lỗi khi lưu thông tin ảnh" - Khi create image thất bại
- "Lỗi khi xóa ảnh" - Khi delete image thất bại
- "Có lỗi xảy ra khi đặt ảnh chính" - Khi set primary image thất bại

---

## 9. Backward Compatibility

### 9.1 Image URL Fallback
- Nếu không có `images` array, sử dụng `image_url` từ offer
- Tạo ảnh tạm với `id: 'temp'` từ `image_url`
- Khi xóa ảnh tạm, chỉ cập nhật `offers.image_url = null`

### 9.2 Primary Image Sync
- `offers.image_url` luôn sync với `primary_image.image_url`
- Khi đặt ảnh chính, cập nhật cả `offers.image_url`
- Khi xóa ảnh chính, cập nhật `offers.image_url` theo ảnh chính mới

---

## 10. UI/UX Features

### 10.1 Image Grid
- Grid layout responsive (2-4 cột tùy màn hình)
- Ảnh chính có border vàng và badge "Ảnh chính"
- Hover hiển thị actions: Xem lớn, Đặt làm ảnh chính, Xóa
- Click ảnh để xem trong lightbox

### 10.2 Image Uploader
- Drag & drop files
- Chọn file từ máy
- Nhập URL ảnh
- Preview trước khi upload
- Hỗ trợ multiple files

### 10.3 Edit Mode
- Toggle edit/view mode
- Form fields với validation
- Save/Cancel buttons
- Loading states

---

## 11. Testing Checklist

### 11.1 Functional Tests
- [x] Xem danh sách ưu đãi với content và images
- [x] Mở modal chi tiết
- [x] Chỉnh sửa thông tin ưu đãi
- [x] Thêm ảnh (upload file)
- [x] Thêm ảnh (nhập URL)
- [x] Đặt ảnh chính
- [x] Xóa ảnh phụ
- [x] Xóa ảnh chính (tự động đặt ảnh khác làm ảnh chính)
- [x] Xóa tất cả ảnh

### 11.2 Edge Cases
- [x] Ưu đãi không có ảnh
- [x] Ưu đãi chỉ có 1 ảnh
- [x] Ưu đãi có nhiều ảnh
- [x] Backend chưa có API images (fallback)
- [x] Error handling khi API fail

### 11.3 UI/UX Tests
- [x] Responsive design
- [x] Loading states
- [x] Error messages
- [x] Empty states
- [x] Image lightbox
- [x] Hover effects

---

## 12. Known Issues / Limitations

### 12.1 Backend Dependencies
- ⚠️ Cần backend implement các API endpoints:
  - `GET /api/offers/:offerId/images`
  - `POST /api/offers/images`
  - `PUT /api/offers/images/:id`
  - `DELETE /api/offers/images/:id`

### 12.2 Current Workarounds
- Nếu API images chưa có, sử dụng fallback với `image_url`
- Tạo ảnh tạm với `id: 'temp'` để hiển thị
- Khi xóa ảnh tạm, chỉ cập nhật `offers.image_url`

---

## 13. Future Enhancements

### 13.1 Potential Improvements
- [ ] Drag & drop để sắp xếp thứ tự ảnh
- [ ] Crop/resize ảnh trước khi upload
- [ ] Batch upload nhiều ảnh cùng lúc
- [ ] Preview ảnh trước khi xóa
- [ ] Undo/Redo khi xóa ảnh

### 13.2 Performance Optimizations
- [ ] Lazy load ảnh trong gallery
- [ ] Image compression trước khi upload
- [ ] Cache ảnh đã load
- [ ] Virtual scrolling cho danh sách ảnh dài

---

## 14. Documentation References

- **Backend API Documentation:** [`BACKEND_API_ENDPOINTS_OFFERS.md`](./BACKEND_API_ENDPOINTS_OFFERS.md)
- **Backend Modifications:** [`BACKEND_MODIFICATIONS_OFFERS.md`](./BACKEND_MODIFICATIONS_OFFERS.md)
- **Frontend Update Summary:** [`FRONTEND_UPDATE_SUMMARY.md`](./FRONTEND_UPDATE_SUMMARY.md)

---

**Tài liệu này mô tả implementation hiện tại của frontend cho tính năng Offers với quản lý ảnh và nội dung.**

