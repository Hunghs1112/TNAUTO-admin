# ✅ FRONTEND API - HOÀN CHỈNH

**Ngày cập nhật**: October 21, 2025  
**Trạng thái**: ✅ Đã cập nhật theo ADMIN_QUICK_REFERENCE.md  
**Tương thích**: 100% với backend

---

## 📋 TỔNG QUAN

Frontend đã được cập nhật để **khớp hoàn toàn** với tài liệu backend `ADMIN_QUICK_REFERENCE.md`.

### ✅ Nguyên tắc routing:

1. **GET operations** → Dùng **public endpoints** (không có `/admin`)
   - `GET /api/services` ✅
   - `GET /api/products` ✅
   - `GET /api/categories` ✅

2. **Admin operations** → Dùng **/admin prefix**
   - `POST /api/services/admin` ✅
   - `PUT /api/products/admin/:id` ✅
   - `DELETE /api/categories/admin/:id` ✅

3. **Stats endpoints** → Dùng **/admin/stats** hoặc **/stats**
   - `GET /api/services/admin/stats` ✅
   - `GET /api/customers/stats` ✅

---

## 📊 CÁC API MODULE

### 1️⃣ **CUSTOMERS API**

```javascript
import { customersAPI } from './services/api';

// List customers
await customersAPI.getAll({ page: 1, limit: 10, search: 'nguyen' });
// GET /api/customers?page=1&limit=10&search=nguyen

// Get by ID
await customersAPI.getById(123);
// GET /api/customers/123

// Update customer
await customersAPI.update(123, { name: 'New Name' });
// PUT /api/customers/123

// Delete customer
await customersAPI.delete(123);
// DELETE /api/customers/123

// Get stats
await customersAPI.getStats();
// GET /api/customers/stats

// Upload avatar
await customersAPI.uploadAvatar(123, fileObject);
// POST /api/customers/123/upload-avatar
```

---

### 2️⃣ **EMPLOYEES API**

```javascript
import { employeesAPI } from './services/api';

// List employees
await employeesAPI.getAll({ page: 1, limit: 10 });
// GET /api/employees?page=1&limit=10

// Create employee
await employeesAPI.create({ name: 'John', phone: '0901234567', password: '123456' });
// POST /api/employees

// Update employee
await employeesAPI.update(45, { name: 'Updated Name' });
// PUT /api/employees/45

// Delete employee
await employeesAPI.delete(45);
// DELETE /api/employees/45

// Get stats
await employeesAPI.getStats();
// GET /api/employees/stats

// Assign order
await employeesAPI.assignOrder({ order_id: 123, employee_id: 45 });
// POST /api/employees/assign-order

// Upload avatar
await employeesAPI.uploadAvatar(45, fileObject);
// POST /api/employees/45/upload-avatar
```

---

### 3️⃣ **SERVICES API**

```javascript
import { servicesAPI } from './services/api';

// List services (PUBLIC)
await servicesAPI.getAll();
// GET /api/services

// Create service (ADMIN)
await servicesAPI.create({ name: 'Rửa xe', description: '...', estimated_time: 2 });
// POST /api/services/admin

// Update service (ADMIN)
await servicesAPI.update(1, { name: 'Updated' });
// PUT /api/services/admin/1

// Delete service (ADMIN)
await servicesAPI.delete(1);
// DELETE /api/services/admin/1

// Get stats (ADMIN)
await servicesAPI.getStats();
// GET /api/services/admin/stats

// Upload image (ADMIN)
await servicesAPI.uploadImage(1, fileObject);
// POST /api/services/admin/1/upload-image
```

---

### 4️⃣ **PRODUCTS API**

```javascript
import { productsAPI } from './services/api';

// List products (PUBLIC)
await productsAPI.getAll();
// GET /api/products

// Create product (ADMIN)
await productsAPI.create({ category_id: 1, name: 'Dầu nhớt', price: 500000 });
// POST /api/products/admin

// Update product (ADMIN)
await productsAPI.update(1, { price: 550000 });
// PUT /api/products/admin/1

// Delete product (ADMIN)
await productsAPI.delete(1);
// DELETE /api/products/admin/1

// Get stats (ADMIN)
await productsAPI.getStats();
// GET /api/products/admin/stats

// Product images
await productsAPI.createImage({ product_id: 1, image_url: '...', is_primary: true });
// POST /api/products/images

await productsAPI.updateImage(1, { is_primary: false });
// PUT /api/products/images/1

await productsAPI.deleteImage(1);
// DELETE /api/products/images/1
```

---

### 5️⃣ **CATEGORIES API**

```javascript
import { categoriesAPI } from './services/api';

// List categories (PUBLIC)
await categoriesAPI.getAll();
// GET /api/categories

// Create category (ADMIN)
await categoriesAPI.create({ name: 'Phụ tùng', description: '...' });
// POST /api/categories/admin

// Update category (ADMIN)
await categoriesAPI.update(1, { name: 'Updated' });
// PUT /api/categories/admin/1

// Delete category (ADMIN)
await categoriesAPI.delete(1);
// DELETE /api/categories/admin/1

// Get stats (ADMIN)
await categoriesAPI.getStats();
// GET /api/categories/admin/stats

// Upload image (ADMIN)
await categoriesAPI.uploadImage(1, fileObject);
// POST /api/categories/admin/1/upload-image
```

---

### 6️⃣ **VEHICLES API**

```javascript
import { vehiclesAPI } from './services/api';

// List vehicles (ADMIN)
await vehiclesAPI.getAll({ page: 1, limit: 10 });
// GET /api/vehicles/admin/all?page=1&limit=10

// Update vehicle (ADMIN)
await vehiclesAPI.update(1, { license_plate: '30A-12345', model: 'Honda SH' });
// PUT /api/vehicles/admin/1

// Delete vehicle (ADMIN)
await vehiclesAPI.delete(1);
// DELETE /api/vehicles/admin/1

// Get stats (ADMIN)
await vehiclesAPI.getStats();
// GET /api/vehicles/admin/stats

// Upload image (ADMIN)
await vehiclesAPI.uploadImage(1, fileObject);
// POST /api/vehicles/admin/1/upload-image

// Search by plate (PUBLIC)
await vehiclesAPI.searchByPlate('30A-12345');
// GET /api/vehicles/search?plate=30A-12345
```

---

### 7️⃣ **SERVICE ORDERS API**

```javascript
import { serviceOrdersAPI } from './services/api';

// List orders
await serviceOrdersAPI.getAll({ status: 'received', page: 1, limit: 10 });
// GET /api/service-orders?status=received&page=1&limit=10

// Get stats (ADMIN)
await serviceOrdersAPI.getStats();
// GET /api/service-orders/admin/stats

// Update status (ADMIN)
await serviceOrdersAPI.updateStatus(123, { status: 'in_progress' });
// PUT /api/service-orders/admin/123/status

// Assign employee (ADMIN)
await serviceOrdersAPI.assign(123, { employee_id: 45 });
// PATCH /api/service-orders/admin/123/assign

// Complete order (ADMIN)
await serviceOrdersAPI.complete(123, { warranty_period: 12, note: '...' });
// PATCH /api/service-orders/admin/123/complete

// Delete order (ADMIN)
await serviceOrdersAPI.delete(123);
// DELETE /api/service-orders/admin/123
```

---

### 8️⃣ **OFFERS API**

```javascript
import { offersAPI } from './services/api';

// List offers (PUBLIC)
await offersAPI.getAll();
// GET /api/offers

// Create offer (ADMIN)
await offersAPI.create({ name: 'Giảm 50%', service_id: 1 });
// POST /api/offers/admin

// Update offer (ADMIN)
await offersAPI.update(1, { name: 'Giảm 60%' });
// PUT /api/offers/admin/1

// Delete offer (ADMIN)
await offersAPI.delete(1);
// DELETE /api/offers/admin/1

// Get stats (ADMIN)
await offersAPI.getStats();
// GET /api/offers/admin/stats

// Upload image (ADMIN)
await offersAPI.uploadImage(1, fileObject);
// POST /api/offers/admin/1/upload-image
```

---

### 9️⃣ **WARRANTIES API**

```javascript
import { warrantiesAPI } from './services/api';

// List warranties (PUBLIC)
await warrantiesAPI.getAll({ page: 1, limit: 10 });
// GET /api/warranties?page=1&limit=10

// Create warranty (ADMIN)
await warrantiesAPI.create({
  order_id: 123,
  customer_id: 1,
  warranty_period: 12,
  start_date: '2025-01-01'
});
// POST /api/warranties/admin

// Update warranty (ADMIN)
await warrantiesAPI.update(1, { warranty_period: 24 });
// PUT /api/warranties/admin/1

// Delete warranty (ADMIN)
await warrantiesAPI.delete(1);
// DELETE /api/warranties/admin/1

// Get stats (ADMIN)
await warrantiesAPI.getStats();
// GET /api/warranties/admin/stats
```

---

### 🔟 **NOTIFICATIONS API**

```javascript
import { notificationsAPI } from './services/api';

// List all notifications (ADMIN)
await notificationsAPI.getAll({ page: 1, limit: 10, recipient_type: 'customer' });
// GET /api/notifications/admin/all?page=1&limit=10&recipient_type=customer

// Send custom notification
await notificationsAPI.send({
  recipient_id: 123,
  recipient_type: 'customer',
  message: 'Hello',
  image_url: '...'
});
// POST /api/notifications/send

// Get stats (ADMIN)
await notificationsAPI.getStats();
// GET /api/notifications/admin/stats

// Mark as read
await notificationsAPI.markAsRead(1);
// PUT /api/notifications/1/read

// Mark all as read
await notificationsAPI.markAllAsRead({ user_id: 123, user_type: 'customer' });
// PUT /api/notifications/read-all

// Delete notification
await notificationsAPI.delete(1);
// DELETE /api/notifications/1
```

---

### 1️⃣1️⃣ **PUSH NOTIFICATIONS API**

```javascript
import { pushNotificationsAPI } from './services/api';

// Send to user
await pushNotificationsAPI.sendToUser({
  user_id: 123,
  user_type: 'customer',
  title: 'Đơn hàng hoàn thành',
  body: 'Xe của bạn đã sẵn sàng',
  data: { order_id: 456 }
});
// POST /api/push-notifications/send-to-user

// Send to all
await pushNotificationsAPI.sendToAll({
  user_type: 'customer',
  title: 'Khuyến mãi',
  body: 'Giảm 50% hôm nay'
});
// POST /api/push-notifications/send-to-all

// Send to topic
await pushNotificationsAPI.sendToTopic({
  topic: 'customers',
  title: 'Thông báo',
  body: 'Nội dung'
});
// POST /api/push-notifications/send-to-topic

// Health check
await pushNotificationsAPI.getHealth();
// GET /api/push-notifications/health

// Get stats
await pushNotificationsAPI.getStats();
// GET /api/push-notifications/stats
```

---

### 1️⃣2️⃣ **UPLOAD API**

```javascript
import { uploadAPI } from './services/api';

// Upload single file
const response = await uploadAPI.single(fileObject);
// POST /api/upload/single
// Response: { success: true, file: { url: '...', filename: '...' } }

// Upload multiple files
const response = await uploadAPI.multiple([file1, file2]);
// POST /api/upload/multiple

// Delete file
await uploadAPI.delete('filename.jpg');
// DELETE /api/upload/filename.jpg
```

---

## 🎯 MAPPING VỚI BACKEND

| Frontend Method | Backend Endpoint | Method |
|----------------|------------------|---------|
| `servicesAPI.getAll()` | `GET /api/services` | ✅ Public |
| `servicesAPI.create(data)` | `POST /api/services/admin` | ✅ Admin |
| `servicesAPI.update(id, data)` | `PUT /api/services/admin/:id` | ✅ Admin |
| `servicesAPI.delete(id)` | `DELETE /api/services/admin/:id` | ✅ Admin |
| `servicesAPI.getStats()` | `GET /api/services/admin/stats` | ✅ Admin |
| `productsAPI.getAll()` | `GET /api/products` | ✅ Public |
| `productsAPI.create(data)` | `POST /api/products/admin` | ✅ Admin |
| `categoriesAPI.getAll()` | `GET /api/categories` | ✅ Public |
| `categoriesAPI.create(data)` | `POST /api/categories/admin` | ✅ Admin |
| `vehiclesAPI.getAll()` | `GET /api/vehicles/admin/all` | ✅ Admin |
| `customersAPI.getStats()` | `GET /api/customers/stats` | ✅ |
| `employeesAPI.getStats()` | `GET /api/employees/stats` | ✅ |

---

## ✅ CHECKLIST HOÀN THÀNH

- [x] Customers API - Stats endpoint
- [x] Employees API - Stats endpoint  
- [x] Services API - Admin CRUD + Stats + Upload
- [x] Products API - Admin CRUD + Stats + Images
- [x] Categories API - Admin CRUD + Stats + Upload
- [x] Vehicles API - Admin CRUD + Stats + Upload
- [x] Service Orders API - Admin actions + Stats
- [x] Offers API - Admin CRUD + Stats + Upload
- [x] Warranties API - Admin CRUD + Stats
- [x] Notifications API - All endpoints
- [x] Push Notifications API - All endpoints
- [x] Upload API - Single/Multiple

---

## 📝 RESPONSE FORMAT

### Success Response
```javascript
{
  "success": true,
  "data": { ... } // or [...]
}
```

### Paginated Response
```javascript
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### Error Response
```javascript
{
  "success": false,
  "error": "Error message"
}
```

---

## 🚀 TRẠNG THÁI

- ✅ **100% tương thích** với ADMIN_QUICK_REFERENCE.md
- ✅ **Tất cả endpoints đã đúng**
- ✅ **Upload methods đã có**
- ✅ **Stats endpoints đầy đủ**
- ✅ **Không có linter errors**

---

**Cập nhật bởi**: AI Assistant  
**Ngày**: October 21, 2025  
**Sẵn sàng deploy**: ✅ YES

