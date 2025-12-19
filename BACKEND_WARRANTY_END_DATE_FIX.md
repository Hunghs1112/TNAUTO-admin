# Yêu cầu sửa Backend: Tính toán end_date cho Warranty

## Vấn đề hiện tại

Trong database, có warranty record với:
- `start_date`: 2025-11-15
- `warranty_period`: 12 (tháng)
- `end_date`: **2109-05-15** ❌ (SAI - phải là 2026-11-15)

## Nguyên nhân

Backend đang tính toán `end_date` sai khi:
1. Tạo warranty mới (POST /warranties/admin)
2. Cập nhật warranty (PUT /warranties/admin/:id)

## Yêu cầu sửa

### 1. Logic tính toán đúng

**Công thức:**
```
end_date = start_date + warranty_period (tháng)
```

**Ví dụ:**
- `start_date`: 2025-11-15
- `warranty_period`: 12 tháng
- `end_date`: 2026-11-15 ✅

### 2. Xử lý edge cases

#### 2.1. Ngày cuối tháng
- Nếu `start_date` là ngày 31 và tháng sau không có ngày 31 → set về ngày cuối tháng
- Ví dụ: 2025-01-31 + 1 tháng = 2025-02-28 (hoặc 29 nếu năm nhuận)

#### 2.2. Qua năm
- Nếu `start_date` + `warranty_period` vượt qua tháng 12 → chuyển sang năm sau
- Ví dụ: 2025-11-15 + 3 tháng = 2026-02-15

### 3. Code mẫu (JavaScript/Node.js)

```javascript
function calculateEndDate(startDate, warrantyPeriodMonths) {
  // Parse start_date
  const start = new Date(startDate);
  
  // Get components
  const year = start.getFullYear();
  const month = start.getMonth(); // 0-11
  const day = start.getDate();
  
  // Calculate new year and month
  const totalMonths = month + warrantyPeriodMonths;
  const newYear = year + Math.floor(totalMonths / 12);
  const newMonth = totalMonths % 12;
  
  // Create end date
  const endDate = new Date(newYear, newMonth, day);
  
  // Handle day overflow (e.g., Jan 31 -> Feb 31 -> Mar 3 is wrong)
  // If day doesn't exist in target month, set to last day of that month
  const lastDayOfTargetMonth = new Date(newYear, newMonth + 1, 0).getDate();
  if (day > lastDayOfTargetMonth) {
    endDate.setDate(lastDayOfTargetMonth);
  }
  
  // Format as YYYY-MM-DD
  const formattedYear = endDate.getFullYear();
  const formattedMonth = String(endDate.getMonth() + 1).padStart(2, '0');
  const formattedDay = String(endDate.getDate()).padStart(2, '0');
  
  return `${formattedYear}-${formattedMonth}-${formattedDay}`;
}

// Test cases
console.log(calculateEndDate('2025-11-15', 12)); // Should return: 2026-11-15
console.log(calculateEndDate('2025-01-31', 1)); // Should return: 2025-02-28
console.log(calculateEndDate('2025-01-31', 2)); // Should return: 2025-03-31
```

### 4. Code mẫu (PHP)

```php
function calculateEndDate($startDate, $warrantyPeriodMonths) {
    $start = new DateTime($startDate);
    
    // Add months
    $start->modify("+{$warrantyPeriodMonths} months");
    
    // Format as Y-m-d
    return $start->format('Y-m-d');
}

// Test
echo calculateEndDate('2025-11-15', 12); // Output: 2026-11-15
```

### 5. Code mẫu (Python)

```python
from datetime import datetime
from dateutil.relativedelta import relativedelta

def calculate_end_date(start_date_str, warranty_period_months):
    start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
    end_date = start_date + relativedelta(months=warranty_period_months)
    return end_date.strftime('%Y-%m-%d')

# Test
print(calculate_end_date('2025-11-15', 12))  # Output: 2026-11-15
```

### 6. Cập nhật API Endpoints

#### 6.1. POST /warranties/admin

**Request:**
```json
{
  "order_id": 5,
  "customer_id": 1,
  "warranty_period": 12,
  "start_date": "2025-11-15",
  "note": "..."
}
```

**Backend phải:**
1. Validate `start_date` và `warranty_period`
2. **Tự động tính `end_date`** = start_date + warranty_period
3. Lưu cả `end_date` vào database

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "order_id": 5,
    "customer_id": 1,
    "warranty_period": 12,
    "start_date": "2025-11-15",
    "end_date": "2026-11-15",  // ← Tự động tính
    "note": "...",
    "created_at": "2025-11-15 23:46:58"
  }
}
```

#### 6.2. PUT /warranties/admin/:id

**Khi cập nhật:**
- Nếu `warranty_period` thay đổi → tính lại `end_date`
- Nếu `start_date` thay đổi → tính lại `end_date`
- Nếu cả hai thay đổi → tính lại `end_date`

**Request:**
```json
{
  "warranty_period": 6,
  "start_date": "2025-11-15"
}
```

**Backend phải:**
1. Lấy `warranty_period` mới (hoặc giữ nguyên nếu không có)
2. Lấy `start_date` mới (hoặc giữ nguyên nếu không có)
3. **Tính lại `end_date`** = start_date + warranty_period
4. Cập nhật database

### 7. Validation

**Kiểm tra:**
- `warranty_period` phải là số nguyên > 0
- `start_date` phải là ngày hợp lệ (format YYYY-MM-DD)
- `end_date` phải > `start_date`

### 8. Sửa dữ liệu cũ

**Cần sửa record ID 5 trong database:**
```sql
UPDATE warranties 
SET end_date = DATE_ADD(start_date, INTERVAL warranty_period MONTH)
WHERE id = 5;
```

**Hoặc sửa tất cả records có end_date sai:**
```sql
-- Kiểm tra records có end_date sai (quá xa trong tương lai)
SELECT * FROM warranties 
WHERE end_date > DATE_ADD(start_date, INTERVAL warranty_period + 10 YEAR);

-- Sửa tất cả
UPDATE warranties 
SET end_date = DATE_ADD(start_date, INTERVAL warranty_period MONTH)
WHERE end_date != DATE_ADD(start_date, INTERVAL warranty_period MONTH)
   OR end_date IS NULL;
```

### 9. Test Cases

1. **Test cơ bản:**
   - Input: start_date = "2025-11-15", warranty_period = 12
   - Expected: end_date = "2026-11-15"

2. **Test qua năm:**
   - Input: start_date = "2025-11-15", warranty_period = 3
   - Expected: end_date = "2026-02-15"

3. **Test ngày cuối tháng:**
   - Input: start_date = "2025-01-31", warranty_period = 1
   - Expected: end_date = "2025-02-28" (hoặc 29 nếu năm nhuận)

4. **Test năm nhuận:**
   - Input: start_date = "2024-01-31", warranty_period = 1
   - Expected: end_date = "2024-02-29"

### 10. Ưu tiên

**HIGH** - Dữ liệu hiện tại đang sai, cần sửa ngay để đảm bảo tính chính xác của hệ thống.

### 11. Lưu ý

1. **Không để frontend tự tính:** Backend phải đảm bảo `end_date` luôn đúng, ngay cả khi frontend gửi sai
2. **Validate input:** Kiểm tra `warranty_period` và `start_date` trước khi tính toán
3. **Database constraint:** Có thể thêm trigger hoặc constraint để đảm bảo `end_date` luôn đúng

