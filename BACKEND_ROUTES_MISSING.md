# 🔴 CÁC ROUTE BACKEND CÒN THIẾU

**Ngày tạo**: October 21, 2025  
**Cập nhật**: October 21, 2025  
**Mục đích**: Hướng dẫn cập nhật backend để khớp với ADMIN_QUICK_REFERENCE.md  
**Frontend status**: ✅ ĐÃ CẬP NHẬT HOÀN CHỈNH (xem `FRONTEND_API_SUMMARY.md`)

---

## ⚠️ VẤN ĐỀ HIỆN TẠI

Frontend đang gọi các endpoint theo tài liệu `ADMIN_QUICK_REFERENCE.md`.

### ✅ **Frontend đã được cập nhật để:**
- GET operations → Dùng **public endpoints** (không `/admin`)
- Create/Update/Delete → Dùng **/admin endpoints**
- Stats → Dùng **/admin/stats** hoặc **/stats**

### ⚠️ **Backend cần có các route sau:**

```
// Đã hoạt động (public)
✅ GET  /api/services           - List services
✅ GET  /api/products           - List products  
✅ GET  /api/categories         - List categories
✅ GET  /api/offers             - List offers
✅ GET  /api/warranties         - List warranties
✅ GET  /api/customers          - List customers
✅ GET  /api/employees          - List employees
✅ GET  /api/vehicles/admin/all - List vehicles

// Cần kiểm tra (admin operations)
❓ POST   /api/services/admin              - Create service
❓ PUT    /api/services/admin/:id          - Update service
❓ DELETE /api/services/admin/:id          - Delete service
❓ GET    /api/services/admin/stats        - Stats

❓ POST   /api/products/admin              - Create product
❓ PUT    /api/products/admin/:id          - Update product
❓ DELETE /api/products/admin/:id          - Delete product
❓ GET    /api/products/admin/stats        - Stats

❓ POST   /api/categories/admin            - Create category
❓ PUT    /api/categories/admin/:id        - Update category
❓ DELETE /api/categories/admin/:id        - Delete category
❓ GET    /api/categories/admin/stats      - Stats

❓ POST   /api/offers/admin                - Create offer
❓ PUT    /api/offers/admin/:id            - Update offer
❓ DELETE /api/offers/admin/:id            - Delete offer
❓ GET    /api/offers/admin/stats          - Stats

❓ POST   /api/warranties/admin            - Create warranty
❓ PUT    /api/warranties/admin/:id        - Update warranty
❓ DELETE /api/warranties/admin/:id        - Delete warranty
❓ GET    /api/warranties/admin/stats      - Stats

❓ GET    /api/customers/stats             - Stats
❓ GET    /api/employees/stats             - Stats
```

---

## 📋 DANH SÁCH ROUTES CẦN THÊM/SỬA

### 1️⃣ **SERVICES ROUTES**

#### Routes hiện có (public):
```javascript
✅ GET  /api/services           - Lấy danh sách dịch vụ (public)
✅ GET  /api/services/:id       - Lấy chi tiết dịch vụ
```

#### Routes CẦN THÊM (admin):
```javascript
// services.routes.js hoặc services.admin.routes.js

// ADMIN - Quản lý dịch vụ
❌ GET    /api/services/admin/stats        - Thống kê dịch vụ
❌ POST   /api/services/admin               - Tạo dịch vụ mới (ADMIN ONLY)
❌ PUT    /api/services/admin/:id           - Cập nhật dịch vụ (ADMIN ONLY)
❌ DELETE /api/services/admin/:id           - Xóa dịch vụ (ADMIN ONLY)
❌ POST   /api/services/admin/:id/upload-image - Upload ảnh dịch vụ
```

#### Controller cần implement:
```javascript
// controllers/services.admin.controller.js

// Stats
exports.getStats = async (req, res) => {
  // Trả về: { total, active, popular_services, etc. }
};

// Create
exports.createService = async (req, res) => {
  const { name, description, estimated_time, image_url } = req.body;
  // Validate và tạo dịch vụ
};

// Update
exports.updateService = async (req, res) => {
  const { id } = req.params;
  const { name, description, estimated_time, image_url } = req.body;
  // Update dịch vụ
};

// Delete
exports.deleteService = async (req, res) => {
  const { id } = req.params;
  // Soft delete hoặc hard delete
};

// Upload image
exports.uploadImage = async (req, res) => {
  const { id } = req.params;
  const file = req.file; // multer
  // Upload và update image_url
};
```

---

### 2️⃣ **PRODUCTS ROUTES**

#### Routes hiện có (public):
```javascript
✅ GET  /api/products           - Lấy danh sách sản phẩm (public)
✅ GET  /api/products/:id       - Lấy chi tiết sản phẩm
```

#### Routes CẦN THÊM (admin):
```javascript
// products.routes.js hoặc products.admin.routes.js

// ADMIN - Quản lý sản phẩm
❌ GET    /api/products/admin/stats        - Thống kê sản phẩm
❌ POST   /api/products/admin               - Tạo sản phẩm mới (ADMIN ONLY)
❌ PUT    /api/products/admin/:id           - Cập nhật sản phẩm (ADMIN ONLY)
❌ DELETE /api/products/admin/:id           - Xóa sản phẩm (ADMIN ONLY)
```

#### Controller cần implement:
```javascript
// controllers/products.admin.controller.js

// Stats
exports.getStats = async (req, res) => {
  // Trả về: { total, by_category, low_stock, etc. }
};

// Create
exports.createProduct = async (req, res) => {
  const { category_id, name, description, price } = req.body;
  // Validate và tạo sản phẩm
};

// Update
exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const { category_id, name, description, price } = req.body;
  // Update sản phẩm
};

// Delete
exports.deleteProduct = async (req, res) => {
  const { id } = req.params;
  // Xóa sản phẩm
};
```

---

### 3️⃣ **CATEGORIES ROUTES**

#### Routes hiện có (public):
```javascript
✅ GET  /api/categories         - Lấy danh sách danh mục (public)
✅ GET  /api/categories/:id     - Lấy chi tiết danh mục
```

#### Routes CẦN THÊM (admin):
```javascript
// categories.routes.js hoặc categories.admin.routes.js

// ADMIN - Quản lý danh mục
❌ GET    /api/categories/admin/stats         - Thống kê danh mục
❌ POST   /api/categories/admin                - Tạo danh mục mới (ADMIN ONLY)
❌ PUT    /api/categories/admin/:id            - Cập nhật danh mục (ADMIN ONLY)
❌ DELETE /api/categories/admin/:id            - Xóa danh mục (ADMIN ONLY)
❌ POST   /api/categories/admin/:id/upload-image - Upload ảnh danh mục
```

#### Controller cần implement:
```javascript
// controllers/categories.admin.controller.js

// Stats
exports.getStats = async (req, res) => {
  // Trả về: { total, products_per_category, etc. }
};

// Create
exports.createCategory = async (req, res) => {
  const { name, description, image_url } = req.body;
  // Tạo danh mục
};

// Update
exports.updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, description, image_url } = req.body;
  // Update danh mục
};

// Delete
exports.deleteCategory = async (req, res) => {
  const { id } = req.params;
  // Xóa danh mục (kiểm tra xem còn sản phẩm không)
};

// Upload image
exports.uploadImage = async (req, res) => {
  const { id } = req.params;
  const file = req.file;
  // Upload và update image_url
};
```

---

### 4️⃣ **OFFERS ROUTES**

#### Routes hiện có (public):
```javascript
✅ GET  /api/offers             - Lấy danh sách ưu đãi (public)
```

#### Routes CẦN THÊM (admin):
```javascript
// offers.routes.js hoặc offers.admin.routes.js

// ADMIN - Quản lý ưu đãi
❌ GET    /api/offers/admin/stats          - Thống kê ưu đãi
❌ POST   /api/offers/admin                 - Tạo ưu đãi mới (ADMIN ONLY)
❌ PUT    /api/offers/admin/:id             - Cập nhật ưu đãi (ADMIN ONLY)
❌ DELETE /api/offers/admin/:id             - Xóa ưu đãi (ADMIN ONLY)
❌ POST   /api/offers/admin/:id/upload-image - Upload ảnh ưu đãi
```

---

### 5️⃣ **WARRANTIES ROUTES**

#### Routes hiện có:
```javascript
✅ GET  /api/warranties         - Lấy danh sách bảo hành
```

#### Routes CẦN THÊM (admin):
```javascript
// warranties.routes.js hoặc warranties.admin.routes.js

// ADMIN - Quản lý bảo hành
❌ GET    /api/warranties/admin/stats      - Thống kê bảo hành
❌ POST   /api/warranties/admin             - Tạo bảo hành mới (ADMIN ONLY)
❌ PUT    /api/warranties/admin/:id         - Cập nhật bảo hành (ADMIN ONLY)
❌ DELETE /api/warranties/admin/:id         - Xóa bảo hành (ADMIN ONLY)
```

---

### 6️⃣ **VEHICLES ROUTES** (ĐÃ CÓ - CHỈ CẦN KIỂM TRA)

```javascript
✅ GET    /api/vehicles/admin/all          - Danh sách xe
✅ GET    /api/vehicles/admin/stats        - Thống kê xe (CẦN THÊM NẾU CHƯA CÓ)
✅ PUT    /api/vehicles/admin/:id          - Cập nhật xe
✅ DELETE /api/vehicles/admin/:id          - Xóa xe
```

---

### 7️⃣ **SERVICE ORDERS ROUTES** (ĐÃ CÓ - CHỈ CẦN KIỂM TRA)

```javascript
✅ GET    /api/service-orders              - Danh sách đơn hàng
✅ GET    /api/service-orders/admin/stats  - Thống kê (CẦN THÊM NẾU CHƯA CÓ)
✅ PUT    /api/service-orders/admin/:id/status    - Cập nhật trạng thái
✅ PATCH  /api/service-orders/admin/:id/assign    - Phân công nhân viên
✅ PATCH  /api/service-orders/admin/:id/complete  - Hoàn thành đơn
✅ DELETE /api/service-orders/admin/:id           - Xóa đơn hàng
```

---

## 🔧 HƯỚNG DẪN IMPLEMENT

### Option 1: Tạo Admin Routes riêng (KHUYẾN NGHỊ)

```javascript
// routes/admin/services.admin.routes.js
const express = require('express');
const router = express.Router();
const servicesAdminController = require('../../controllers/admin/services.admin.controller');
const upload = require('../../middleware/upload');

// Stats
router.get('/stats', servicesAdminController.getStats);

// CRUD
router.post('/', servicesAdminController.create);
router.put('/:id', servicesAdminController.update);
router.delete('/:id', servicesAdminController.delete);

// Upload
router.post('/:id/upload-image', upload.single('image'), servicesAdminController.uploadImage);

module.exports = router;
```

```javascript
// routes/index.js hoặc app.js
const servicesAdminRoutes = require('./admin/services.admin.routes');
const productsAdminRoutes = require('./admin/products.admin.routes');
const categoriesAdminRoutes = require('./admin/categories.admin.routes');
const offersAdminRoutes = require('./admin/offers.admin.routes');
const warrantiesAdminRoutes = require('./admin/warranties.admin.routes');

// Mount admin routes
app.use('/api/services/admin', servicesAdminRoutes);
app.use('/api/products/admin', productsAdminRoutes);
app.use('/api/categories/admin', categoriesAdminRoutes);
app.use('/api/offers/admin', offersAdminRoutes);
app.use('/api/warranties/admin', warrantiesAdminRoutes);
```

---

### Option 2: Thêm vào routes hiện có

```javascript
// routes/services.routes.js
const express = require('express');
const router = express.Router();
const servicesController = require('../controllers/services.controller');
const servicesAdminController = require('../controllers/services.admin.controller');

// Public routes
router.get('/', servicesController.getAll);
router.get('/:id', servicesController.getById);

// Admin routes (với /admin prefix)
router.get('/admin/stats', servicesAdminController.getStats);
router.post('/admin', servicesAdminController.create);
router.put('/admin/:id', servicesAdminController.update);
router.delete('/admin/:id', servicesAdminController.delete);

module.exports = router;
```

⚠️ **LƯU Ý**: Đặt admin routes TRƯỚC public routes để tránh conflict (vì `/admin/:id` sẽ bị nhầm với `/:id`)

---

## 📊 REQUEST/RESPONSE FORMAT

### POST /api/services/admin
```javascript
// Request
{
  "name": "Dịch vụ rửa xe",
  "description": "Rửa xe cao cấp",
  "estimated_time": 2,
  "image_url": "http://domain.com/uploads/service1.jpg"
}

// Response
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Dịch vụ rửa xe",
    "description": "Rửa xe cao cấp",
    "estimated_time": 2,
    "image_url": "http://domain.com/uploads/service1.jpg",
    "created_at": "2025-10-21T10:00:00Z",
    "updated_at": "2025-10-21T10:00:00Z"
  }
}
```

### GET /api/services/admin/stats
```javascript
// Response
{
  "success": true,
  "stats": {
    "total": 10,
    "active": 8,
    "inactive": 2,
    "most_popular": {
      "id": 1,
      "name": "Rửa xe",
      "order_count": 150
    }
  }
}
```

---

## ✅ CHECKLIST IMPLEMENTATION

### Services Module
- [ ] Tạo controller `services.admin.controller.js`
- [ ] Implement `getStats()`
- [ ] Implement `create()`
- [ ] Implement `update()`
- [ ] Implement `delete()`
- [ ] Implement `uploadImage()`
- [ ] Tạo routes `/api/services/admin/*`
- [ ] Test tất cả endpoints

### Products Module
- [ ] Tạo controller `products.admin.controller.js`
- [ ] Implement `getStats()`
- [ ] Implement `create()`
- [ ] Implement `update()`
- [ ] Implement `delete()`
- [ ] Tạo routes `/api/products/admin/*`
- [ ] Test tất cả endpoints

### Categories Module
- [ ] Tạo controller `categories.admin.controller.js`
- [ ] Implement `getStats()`
- [ ] Implement `create()`
- [ ] Implement `update()`
- [ ] Implement `delete()`
- [ ] Implement `uploadImage()`
- [ ] Tạo routes `/api/categories/admin/*`
- [ ] Test tất cả endpoints

### Offers Module
- [ ] Tạo controller `offers.admin.controller.js`
- [ ] Implement `getStats()`
- [ ] Implement `create()`
- [ ] Implement `update()`
- [ ] Implement `delete()`
- [ ] Implement `uploadImage()`
- [ ] Tạo routes `/api/offers/admin/*`
- [ ] Test tất cả endpoints

### Warranties Module
- [ ] Tạo controller `warranties.admin.controller.js`
- [ ] Implement `getStats()`
- [ ] Implement `create()`
- [ ] Implement `update()`
- [ ] Implement `delete()`
- [ ] Tạo routes `/api/warranties/admin/*`
- [ ] Test tất cả endpoints

---

## 🔐 AUTHENTICATION MIDDLEWARE (QUAN TRỌNG!)

Tất cả admin routes cần có authentication middleware:

```javascript
// middleware/auth.js
const verifyAdmin = (req, res, next) => {
  // TODO: Kiểm tra JWT token
  // TODO: Kiểm tra role = 'admin'
  // if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });
  next();
};

// routes/admin/services.admin.routes.js
router.post('/', verifyAdmin, servicesAdminController.create);
router.put('/:id', verifyAdmin, servicesAdminController.update);
router.delete('/:id', verifyAdmin, servicesAdminController.delete);
```

---

## 📝 SQL QUERIES MẪU

### Stats Query Example
```sql
-- Services stats
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active,
  SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive
FROM services;

-- Most popular service
SELECT s.*, COUNT(so.id) as order_count
FROM services s
LEFT JOIN service_orders so ON s.id = so.service_id
GROUP BY s.id
ORDER BY order_count DESC
LIMIT 1;
```

---

## 🚀 PRIORITY ORDER (Độ ưu tiên implement)

1. **HIGH** - Services Admin Routes (dùng nhiều nhất)
2. **HIGH** - Categories Admin Routes (cần cho products)
3. **HIGH** - Products Admin Routes
4. **MEDIUM** - Offers Admin Routes
5. **MEDIUM** - Warranties Admin Routes
6. **LOW** - Stats endpoints (có thể làm sau)

---

## 📞 CONTACT

Nếu cần giúp đỡ khi implement, hãy tham khảo:
- File `ADMIN_API_REFERENCE.md` - Spec đầy đủ
- Các controller hiện có như `customers.controller.js`, `employees.controller.js`
- Các routes hiện có như `vehicles.routes.js`

---

**Tạo bởi**: AI Assistant  
**Ngày**: October 21, 2025  
**Trạng thái**: ⚠️ CẦN IMPLEMENT BACKEND

