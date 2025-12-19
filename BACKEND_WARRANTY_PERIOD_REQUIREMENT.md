# Yêu cầu cập nhật Backend: Thêm thời gian bảo hành cho dịch vụ

## Tổng quan

Hiện tại, thời gian bảo hành chỉ được quản lý trong bảng `warranties` (bảo hành cho từng đơn hàng cụ thể). Yêu cầu mới là mỗi dịch vụ (service) sẽ có thời gian bảo hành mặc định riêng, được nhập khi tạo/sửa dịch vụ.

## 1. Cập nhật Database Schema

### Bảng `services`

**Thêm cột mới:**
```sql
ALTER TABLE services 
ADD COLUMN warranty_period INT DEFAULT NULL COMMENT 'Thời gian bảo hành mặc định (giây)';
```

**Lưu ý:**
- Kiểu dữ liệu: `INT` (lưu bằng giây, giống như `estimated_time`)
- Cho phép NULL: Có (dịch vụ có thể không có bảo hành)
- Default: NULL
- Đơn vị: Giây (để đồng nhất với `estimated_time`)

### Ví dụ giá trị:
- 1 tháng = 2,592,000 giây (30 ngày × 24 giờ × 3600 giây)
- 3 tháng = 7,776,000 giây
- 6 tháng = 15,552,000 giây
- 12 tháng = 31,104,000 giây

## 2. Cập nhật API Endpoints

### 2.1. GET /services (và /services/admin)

**Response hiện tại:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Dịch vụ A",
      "category_id": 1,
      "description": "...",
      "estimated_time": 3600,
      "image_url": "...",
      "created_at": "..."
    }
  ]
}
```

**Response mới (thêm field):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Dịch vụ A",
      "category_id": 1,
      "description": "...",
      "estimated_time": 3600,
      "warranty_period": 2592000,  // ← THÊM FIELD NÀY (1 tháng = 2,592,000 giây)
      "image_url": "...",
      "created_at": "..."
    }
  ]
}
```

### 2.2. GET /services/:id (và /services/admin/:id)

**Response mới:**
- Thêm field `warranty_period` vào response

### 2.3. POST /services/admin (CREATE)

**Request body mới:**
```json
{
  "name": "Dịch vụ mới",
  "category_id": 1,
  "description": "...",
  "estimated_time": 3600,
  "warranty_period": 2592000,  // ← THÊM FIELD NÀY (optional)
  "image_url": "..."
}
```

**Validation:**
- `warranty_period`: Optional, nếu có phải là số nguyên >= 0
- Nếu không có, lưu NULL

### 2.4. PUT /services/admin/:id (UPDATE)

**Request body mới:**
```json
{
  "name": "Dịch vụ đã sửa",
  "category_id": 1,
  "description": "...",
  "estimated_time": 3600,
  "warranty_period": 5184000,  // ← THÊM FIELD NÀY (có thể cập nhật)
  "image_url": "..."
}
```

**Validation:**
- `warranty_period`: Optional, nếu có phải là số nguyên >= 0
- Cho phép set NULL để xóa thời gian bảo hành

## 3. Cập nhật Logic Bảo hành (Warranties)

### 3.1. Tự động tạo bảo hành khi hoàn thành đơn hàng

**Khi đơn hàng dịch vụ được hoàn thành (status = 'completed'):**

**Option A: Tự động tạo warranty record**
- Nếu service có `warranty_period`:
  - Tự động tạo record trong bảng `warranties`
  - `warranty_period` = service.warranty_period (chuyển từ giây sang tháng nếu cần)
  - `start_date` = ngày hoàn thành đơn hàng
  - `end_date` = start_date + warranty_period
  - `order_id` = ID đơn hàng
  - `customer_id` = ID khách hàng từ đơn hàng

**Option B: Lưu warranty_period trong order, tạo warranty khi cần**
- Lưu `warranty_period` vào bảng `service_orders` khi tạo đơn
- Khi cần tạo warranty, lấy từ order hoặc service

### 3.2. POST /warranties/admin (CREATE)

**Request body hiện tại:**
```json
{
  "order_id": 1,
  "customer_id": 1,
  "warranty_period": 3,  // Tháng
  "start_date": "2025-01-01",
  "note": "..."
}
```

**Cập nhật:**
- Nếu không có `warranty_period` trong request:
  - Lấy `warranty_period` từ service của đơn hàng
  - Chuyển đổi từ giây sang tháng (nếu service lưu bằng giây)
  - Tự động tính `end_date` = start_date + warranty_period

**Request body mới (có thể bỏ warranty_period):**
```json
{
  "order_id": 1,
  "customer_id": 1,
  "warranty_period": 3,  // Optional: nếu không có, lấy từ service
  "start_date": "2025-01-01",
  "note": "..."
}
```

## 4. Các Endpoint Khác Cần Xem Xét

### 4.1. Service Orders Endpoints

**GET /service-orders/:id**
- Response nên include `warranty_period` từ service:
```json
{
  "id": 1,
  "service_id": 1,
  "service": {
    "id": 1,
    "name": "Dịch vụ A",
    "warranty_period": 2592000  // ← THÊM
  },
  ...
}
```

**POST /service-orders/admin (CREATE)**
- Không cần thay đổi, nhưng có thể validate:
  - Nếu service có warranty_period, hiển thị thông tin cho admin

**PUT /service-orders/admin/:id/complete (COMPLETE)**
- Khi hoàn thành đơn hàng:
  - Nếu service có `warranty_period` và chưa có warranty:
    - Tự động tạo warranty record (theo Option A ở trên)

### 4.2. Service Categories Endpoints

**Không cần thay đổi** - Service categories không liên quan đến warranty

### 4.3. Statistics Endpoints

**GET /services/admin/stats**
- Có thể thêm thống kê:
  - Số dịch vụ có bảo hành
  - Số dịch vụ không có bảo hành
  - Thời gian bảo hành trung bình

**GET /warranties/admin/stats**
- Có thể thêm thống kê:
  - Số warranty được tạo tự động từ service
  - Số warranty được tạo thủ công

## 5. Migration Script

```sql
-- Thêm cột warranty_period vào bảng services
ALTER TABLE services 
ADD COLUMN warranty_period INT DEFAULT NULL 
COMMENT 'Thời gian bảo hành mặc định (giây)';

-- Cập nhật dữ liệu cũ (nếu cần)
-- Ví dụ: set warranty_period = 2592000 (1 tháng) cho các dịch vụ hiện có
-- UPDATE services SET warranty_period = 2592000 WHERE warranty_period IS NULL;
```

## 6. Validation Rules

1. **warranty_period trong services:**
   - Type: Integer
   - Min: 0 (0 = không có bảo hành, hoặc NULL)
   - Max: Không giới hạn (nhưng hợp lý là < 10 năm)
   - Unit: Giây

2. **Khi tạo warranty từ service:**
   - Nếu service.warranty_period = NULL → không tự động tạo warranty
   - Nếu service.warranty_period > 0 → tự động tạo warranty khi hoàn thành đơn

## 7. Test Cases

### Test 1: Tạo dịch vụ với warranty_period
```json
POST /services/admin
{
  "name": "Dịch vụ test",
  "category_id": 1,
  "warranty_period": 2592000
}
```
**Expected:** Service được tạo với warranty_period = 2592000

### Test 2: Cập nhật warranty_period
```json
PUT /services/admin/1
{
  "warranty_period": 5184000
}
```
**Expected:** Service được cập nhật với warranty_period mới

### Test 3: Hoàn thành đơn hàng với service có warranty
```
PATCH /service-orders/admin/1/complete
```
**Expected:** Tự động tạo warranty record với warranty_period từ service

### Test 4: Tạo warranty không có warranty_period
```json
POST /warranties/admin
{
  "order_id": 1,
  "customer_id": 1,
  "start_date": "2025-01-01"
}
```
**Expected:** Tự động lấy warranty_period từ service của đơn hàng

## 8. Ưu tiên

**HIGH** - Tính năng này ảnh hưởng đến quy trình quản lý bảo hành và trải nghiệm người dùng.

## 9. Lưu ý

1. **Đơn vị thời gian:**
   - Services: Lưu bằng **giây** (đồng nhất với estimated_time)
   - Warranties: Có thể giữ **tháng** (như hiện tại) hoặc chuyển sang giây
   - Cần có hàm chuyển đổi giữa giây và tháng khi cần

2. **Backward Compatibility:**
   - Các dịch vụ cũ không có warranty_period → NULL
   - API vẫn hoạt động bình thường với các field cũ

3. **Performance:**
   - Thêm index nếu cần query theo warranty_period
   - Đảm bảo auto-create warranty không làm chậm quá trình complete order

