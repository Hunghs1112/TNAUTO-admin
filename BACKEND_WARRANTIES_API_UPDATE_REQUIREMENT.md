# Yêu cầu cập nhật Backend: Thêm thông tin khách hàng, dịch vụ và nhân viên vào API Warranties

## Tổng quan

Hiện tại API `GET /warranties` chỉ trả về các ID (`customer_id`, `order_id`) mà không có thông tin chi tiết về khách hàng, dịch vụ và nhân viên. Frontend cần hiển thị tên thay vì ID để người dùng dễ đọc hơn.

## 1. Cập nhật API GET /warranties

### 1.1. Response hiện tại (ước tính)

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "order_id": 123,
      "customer_id": 5,
      "warranty_period": 3,
      "start_date": "2025-01-01",
      "end_date": "2025-04-01",
      "note": "...",
      "created_at": "2025-01-01 10:00:00"
    }
  ],
  "count": 10
}
```

### 1.2. Response mới (yêu cầu)

**Option 1: Flat fields (Khuyến nghị - đơn giản hơn)**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "order_id": 123,
      "order_number": "SO-2025-001",  // ← THÊM (nếu có)
      "customer_id": 5,
      "customer_name": "Nguyễn Văn A",  // ← THÊM
      "service_id": 10,  // ← THÊM
      "service_name": "Dịch vụ sửa chữa",  // ← THÊM
      "employee_id": 3,  // ← THÊM (có thể NULL nếu chưa giao)
      "employee_name": "Trần Văn B",  // ← THÊM (có thể NULL)
      "warranty_period": 3,
      "start_date": "2025-01-01",
      "end_date": "2025-04-01",
      "note": "...",
      "created_at": "2025-01-01 10:00:00"
    }
  ],
  "count": 10
}
```

**Option 2: Nested objects (Phức tạp hơn nhưng đầy đủ thông tin)**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "order_id": 123,
      "order": {  // ← THÊM
        "id": 123,
        "order_number": "SO-2025-001",
        "license_plate": "30A-12345"
      },
      "customer_id": 5,
      "customer": {  // ← THÊM
        "id": 5,
        "name": "Nguyễn Văn A",
        "phone": "0912345678"
      },
      "service_id": 10,  // ← THÊM
      "service": {  // ← THÊM
        "id": 10,
        "name": "Dịch vụ sửa chữa",
        "category_name": "Sửa chữa"
      },
      "employee_id": 3,  // ← THÊM (có thể NULL)
      "employee": {  // ← THÊM (có thể NULL)
        "id": 3,
        "name": "Trần Văn B",
        "phone": "0987654321"
      },
      "warranty_period": 3,
      "start_date": "2025-01-01",
      "end_date": "2025-04-01",
      "note": "...",
      "created_at": "2025-01-01 10:00:00"
    }
  ],
  "count": 10
}
```

**Khuyến nghị:** Sử dụng **Option 1** (flat fields) vì đơn giản hơn và đủ cho nhu cầu hiển thị.

## 2. Các trường cần thêm

### 2.1. Thông tin đơn hàng

| Field | Type | Required | Mô tả |
|-------|------|----------|-------|
| `order_number` | String | No | Số đơn hàng (nếu có), format: "SO-2025-001" |

### 2.2. Thông tin dịch vụ

| Field | Type | Required | Mô tả |
|-------|------|----------|-------|
| `service_id` | Integer | Yes | ID dịch vụ từ bảng `services` |
| `service_name` | String | Yes | Tên dịch vụ từ bảng `services` |

**Lưu ý:** 
- `service_id` có thể lấy từ bảng `service_orders` (warranty liên kết với order, order có service_id)
- JOIN: `warranties` → `service_orders` → `services`

### 2.3. Thông tin nhân viên

| Field | Type | Required | Mô tả |
|-------|------|----------|-------|
| `employee_id` | Integer | No | ID nhân viên từ bảng `employees` hoặc `staff` (có thể NULL nếu chưa giao) |
| `employee_name` | String | No | Tên nhân viên (có thể NULL) |

**Lưu ý:**
- `employee_id` có thể lấy từ bảng `service_orders` (order có employee_id khi đã giao)
- Nếu order chưa giao → `employee_id` và `employee_name` = NULL
- JOIN: `warranties` → `service_orders` → `employees` hoặc `staff`

## 3. SQL Query mẫu

### Option 1: Flat fields

```sql
SELECT 
  w.id,
  w.order_id,
  so.order_number,  -- Nếu có
  w.customer_id,
  c.name AS customer_name,
  so.service_id,
  s.name AS service_name,
  so.employee_id,
  e.name AS employee_name,
  w.warranty_period,
  w.start_date,
  w.end_date,
  w.note,
  w.created_at
FROM warranties w
LEFT JOIN service_orders so ON w.order_id = so.id
LEFT JOIN customers c ON w.customer_id = c.id
LEFT JOIN services s ON so.service_id = s.id
LEFT JOIN employees e ON so.employee_id = e.id  -- Hoặc staff nếu dùng bảng staff
ORDER BY w.created_at DESC;
```

### Option 2: Nested objects (nếu dùng ORM)

```sql
-- Với ORM như Sequelize, TypeORM, etc.
-- Cần include/join các bảng:
-- - service_orders (để lấy service_id, employee_id, order_number)
-- - customers (để lấy customer info)
-- - services (để lấy service info)
-- - employees/staff (để lấy employee info)
```

## 4. Cập nhật API GET /warranties/:id

**Response mới cũng cần bao gồm các trường trên:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "order_id": 123,
    "order_number": "SO-2025-001",
    "customer_id": 5,
    "customer_name": "Nguyễn Văn A",
    "service_id": 10,
    "service_name": "Dịch vụ sửa chữa",
    "employee_id": 3,
    "employee_name": "Trần Văn B",
    "warranty_period": 3,
    "start_date": "2025-01-01",
    "end_date": "2025-04-01",
    "note": "...",
    "created_at": "2025-01-01 10:00:00"
  }
}
```

## 5. Xử lý trường hợp NULL

### 5.1. employee_id và employee_name

- **NULL khi:** Đơn hàng chưa được giao cho nhân viên
- **Có giá trị khi:** Đơn hàng đã được giao cho nhân viên

### 5.2. service_id và service_name

- **Luôn có giá trị** vì mỗi đơn hàng phải có dịch vụ
- Nếu không có → trả về `service_id: null, service_name: "Không xác định"`

### 5.3. order_number

- **Có thể NULL** nếu bảng `service_orders` không có field `order_number`
- Nếu không có → frontend sẽ hiển thị `#order_id`

## 6. Performance Considerations

### 6.1. Indexing

Đảm bảo có index trên các foreign keys:
```sql
-- Indexes để tối ưu JOIN
CREATE INDEX idx_warranties_order_id ON warranties(order_id);
CREATE INDEX idx_service_orders_customer_id ON service_orders(customer_id);
CREATE INDEX idx_service_orders_service_id ON service_orders(service_id);
CREATE INDEX idx_service_orders_employee_id ON service_orders(employee_id);
```

### 6.2. Caching

- Có thể cache danh sách customers, services, employees nếu không thay đổi thường xuyên
- Không cache warranty data vì cần real-time

## 7. Test Cases

### Test 1: Warranty có đầy đủ thông tin
```json
{
  "id": 1,
  "order_id": 123,
  "customer_id": 5,
  "customer_name": "Nguyễn Văn A",
  "service_id": 10,
  "service_name": "Dịch vụ A",
  "employee_id": 3,
  "employee_name": "Nhân viên B"
}
```
**Expected:** Tất cả fields đều có giá trị

### Test 2: Warranty chưa giao (không có employee)
```json
{
  "id": 2,
  "order_id": 124,
  "customer_id": 6,
  "customer_name": "Trần Văn C",
  "service_id": 11,
  "service_name": "Dịch vụ B",
  "employee_id": null,
  "employee_name": null
}
```
**Expected:** `employee_id` và `employee_name` = null

### Test 3: Warranty không có service (edge case)
```json
{
  "id": 3,
  "order_id": 125,
  "customer_id": 7,
  "customer_name": "Lê Văn D",
  "service_id": null,
  "service_name": null,
  "employee_id": 4,
  "employee_name": "Nhân viên E"
}
```
**Expected:** `service_id` và `service_name` = null (hoặc "Không xác định")

## 8. Migration Notes

### 8.1. Backward Compatibility

- API cũ chỉ trả về `customer_id`, `order_id`
- API mới thêm các field mới nhưng vẫn giữ các field cũ
- Frontend cũ vẫn hoạt động bình thường (chỉ không hiển thị tên)

### 8.2. Database Schema

Không cần thay đổi schema, chỉ cần JOIN các bảng hiện có:
- `warranties` (bảng chính)
- `service_orders` (để lấy service_id, employee_id)
- `customers` (để lấy customer_name)
- `services` (để lấy service_name)
- `employees` hoặc `staff` (để lấy employee_name)

## 9. Ưu tiên

**HIGH** - Tính năng này cải thiện đáng kể trải nghiệm người dùng khi xem danh sách bảo hành.

## 10. Lưu ý

1. **Tên bảng:** Kiểm tra tên bảng chính xác:
   - `employees` hay `staff`?
   - `service_orders` hay `orders`?

2. **Field names:** Kiểm tra tên field chính xác:
   - `order_number` hay `order_code`?
   - `employee_id` hay `staff_id`?

3. **Relationships:** Đảm bảo relationships đúng:
   - `warranties.order_id` → `service_orders.id`
   - `service_orders.service_id` → `services.id`
   - `service_orders.employee_id` → `employees.id` (hoặc `staff.id`)

4. **NULL handling:** Xử lý NULL đúng cách để tránh lỗi JOIN

