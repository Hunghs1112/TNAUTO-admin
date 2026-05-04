# 🔍 Backend Search - Hướng Dẫn Hoàn Chỉnh (All-in-One)

> **Tài liệu này gộp tất cả thông tin cần thiết để implement search ở backend**

---

## 📋 MỤC LỤC

1. [🎯 TÓM TẮT NHANH](#-tóm-tắt-nhanh)
2. [⚠️ VẤN ĐỀ CẦN GIẢI QUYẾT](#️-vấn-đề-cần-giải-quyết)
3. [✅ GIẢI PHÁP](#-giải-pháp)
4. [🔧 IMPLEMENTATION CHI TIẾT](#-implementation-chi-tiết)
5. [🔒 SECURITY - BẢO MẬT](#-security---bảo-mật)
6. [🧪 TESTING](#-testing)
7. [📈 PERFORMANCE](#-performance)
8. [🐛 TROUBLESHOOTING](#-troubleshooting)
9. [✅ CHECKLIST](#-checklist)

---

## 🎯 TÓM TẮT NHANH

### Vấn đề
```
❌ Frontend chỉ search trong 20 items của trang hiện tại
❌ User không thể tìm được data ở các trang khác
```

### Giải pháp
```
✅ Backend search trong toàn bộ database
✅ Trả về kết quả với pagination
✅ User có thể tìm được tất cả data
```

### Timeline
```
Đọc tài liệu:     30 phút
Implementation:   2-3 giờ
Testing:          1 giờ
Deploy:           30 phút
─────────────────────────
TỔNG:             4-5 giờ
```

### Controllers Cần Cập Nhật (7 controllers)
1. ✅ `customerController.js` - getAllCustomers()
2. ✅ `employeeController.js` - getEmployees()
3. ✅ `employeeController.js` - getAvailableOrdersForClaim()
4. ✅ `dealerController.js` - getAllDealers()
5. ✅ `vehicleController.js` - getAllVehicles()
6. ✅ `webGarageController.js` - getAllGarages()
7. ✅ `garageManagerController.js` - getAllGarageManagers()

---

## ⚠️ VẤN ĐỀ CẦN GIẢI QUYẾT

### Tình huống hiện tại
```
Database: 1000 customers
Backend pagination: 20 customers/trang
Frontend chỉ có: 20 customers trong trang hiện tại

User search "Nguyễn":
❌ Chỉ tìm được trong 20 customers đó
❌ Thiếu 980 customers khác có tên "Nguyễn"
```

### Ví dụ cụ thể
```
Trang 1: 20 customers (A1-A20)
Trang 2: 20 customers (B1-B20) ← Có "Nguyễn Văn B5"
Trang 3: 20 customers (C1-C20) ← Có "Nguyễn Thị C10"

User ở trang 1, search "Nguyễn":
❌ Chỉ tìm trong A1-A20
❌ Không tìm được B5 và C10
```

---

## ✅ GIẢI PHÁP

### Simple LIKE Search

**Đặc điểm:**
- ✅ Đơn giản, dễ hiểu
- ✅ An toàn với parameterized queries
- ✅ Hoạt động tốt với < 10,000 records
- ✅ Không cần thay đổi database schema
- ✅ Dễ maintain và debug

**Cách hoạt động:**
```sql
-- Không có search: Lấy tất cả
SELECT * FROM customers ORDER BY id DESC LIMIT 20 OFFSET 0;

-- Có search: Lọc trước, sau đó pagination
SELECT * FROM customers 
WHERE name LIKE '%nguyen%' 
   OR phone LIKE '%nguyen%' 
   OR email LIKE '%nguyen%'
ORDER BY id DESC 
LIMIT 20 OFFSET 0;
```

**API Request/Response:**
```bash
# Request
GET /api/customers?search=nguyen&page=1&limit=20

# Response
{
  "success": true,
  "data": [...],        // 20 items
  "total": 45,          // ← Tổng số kết quả tìm được trong toàn bộ database
  "page": 1,
  "limit": 20,
  "totalPages": 3,      // ← 45 / 20 = 3 pages
  "searchTerm": "nguyen"
}
```

---

## 🔧 IMPLEMENTATION CHI TIẾT

### BƯỚC 1: Code Hiện Tại (Chỉ có pagination)

```javascript
// ❌ CODE HIỆN TẠI - Chỉ có pagination, không có search
const getAllCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    const query = 'SELECT * FROM customers ORDER BY id DESC LIMIT ? OFFSET ?';
    const [data] = await db.query(query, [parseInt(limit), offset]);
    
    const [countResult] = await db.query('SELECT COUNT(*) as total FROM customers');
    const total = countResult[0].total;
    
    res.json({
      success: true,
      data: data,
      total: total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
```

---

### BƯỚC 2: Code Mới (Có search + pagination)

```javascript
// ✅ CODE MỚI - Có search + pagination
const getAllCustomers = async (req, res) => {
  try {
    // 1. Lấy parameters từ request
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (page - 1) * limit;
    const searchTerm = search.trim(); // Loại bỏ khoảng trắng thừa
    
    // 2. Khởi tạo query và params
    let query = 'SELECT * FROM customers';
    let countQuery = 'SELECT COUNT(*) as total FROM customers';
    const params = [];
    const countParams = [];
    
    // 3. Nếu có search, thêm WHERE clause
    if (searchTerm) {
      const searchPattern = `%${searchTerm}%`;
      const whereClause = ' WHERE name LIKE ? OR phone LIKE ? OR email LIKE ?';
      
      query += whereClause;
      countQuery += whereClause;
      
      // Thêm search pattern cho mỗi field
      params.push(searchPattern, searchPattern, searchPattern);
      countParams.push(searchPattern, searchPattern, searchPattern);
    }
    
    // 4. Thêm ORDER BY và LIMIT
    query += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    // 5. Execute queries
    const [data] = await db.query(query, params);
    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;
    
    // 6. Trả về response
    res.json({
      success: true,
      data: data,
      total: total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
      searchTerm: searchTerm || null // Thêm searchTerm vào response
    });
  } catch (error) {
    console.error('Error in getAllCustomers:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
```

---

### BƯỚC 3: Áp Dụng Cho Tất Cả Controllers

#### 1. **customerController.js** - `getAllCustomers()`
```javascript
// Search fields: name, phone, email
const whereClause = ' WHERE name LIKE ? OR phone LIKE ? OR email LIKE ?';
params.push(searchPattern, searchPattern, searchPattern);
```

#### 2. **employeeController.js** - `getEmployees()`
```javascript
// Search fields: name, phone
const whereClause = ' WHERE name LIKE ? OR phone LIKE ?';
params.push(searchPattern, searchPattern);
```

#### 3. **employeeController.js** - `getAvailableOrdersForClaim()`
```javascript
// Search fields: license_plate, customer name, customer phone, service name
const whereClause = `
  WHERE so.license_plate LIKE ? 
     OR c.name LIKE ? 
     OR c.phone LIKE ? 
     OR s.name LIKE ?
`;
params.push(searchPattern, searchPattern, searchPattern, searchPattern);
```

#### 4. **dealerController.js** - `getAllDealers()`
```javascript
// Search fields: name, phone, email
const whereClause = ' WHERE name LIKE ? OR phone LIKE ? OR email LIKE ?';
params.push(searchPattern, searchPattern, searchPattern);
```

#### 5. **vehicleController.js** - `getAllVehicles()`
```javascript
// Search fields: license_plate, model, customer name, customer phone
const whereClause = `
  WHERE v.license_plate LIKE ? 
     OR v.model LIKE ? 
     OR c.name LIKE ? 
     OR c.phone LIKE ?
`;
params.push(searchPattern, searchPattern, searchPattern, searchPattern);
```

#### 6. **webGarageController.js** - `getAllGarages()`
```javascript
// Search fields: code, name, address, admin_phone
const whereClause = `
  WHERE g.code LIKE ? 
     OR g.name LIKE ? 
     OR g.address LIKE ? 
     OR g.admin_phone LIKE ?
`;
params.push(searchPattern, searchPattern, searchPattern, searchPattern);
```

#### 7. **garageManagerController.js** - `getAllGarageManagers()`
```javascript
// Search fields: manager name, phone, email, garage name, garage code
const whereClause = `
  WHERE gm.name LIKE ? 
     OR gm.phone LIKE ? 
     OR gm.email LIKE ? 
     OR g.name LIKE ? 
     OR g.code LIKE ?
`;
params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
```

---

### BƯỚC 4: Code Template Hoàn Chỉnh (Copy & Paste)

```javascript
/**
 * Get all customers with search and pagination
 * 
 * @route GET /api/customers
 * @query {string} search - Search term (optional)
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 20, max: 100)
 * @returns {Object} Response with customers data and pagination info
 */
const getAllCustomers = async (req, res) => {
  try {
    // 1. Extract and validate parameters
    const { 
      page = 1, 
      limit = 20, 
      search = '' 
    } = req.query;
    
    // Validate limit
    const validLimit = Math.min(Math.max(parseInt(limit), 1), 100);
    const validPage = Math.max(parseInt(page), 1);
    const offset = (validPage - 1) * validLimit;
    
    // Validate and sanitize search
    const searchTerm = search.trim();
    if (search && search.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Search term too long. Maximum 100 characters.'
      });
    }
    
    // 2. Build queries
    let query = 'SELECT id, name, phone, email, created_at FROM customers';
    let countQuery = 'SELECT COUNT(*) as total FROM customers';
    const params = [];
    const countParams = [];
    
    // 3. Add search filter if provided
    if (searchTerm) {
      const searchPattern = `%${searchTerm}%`;
      const whereClause = ' WHERE name LIKE ? OR phone LIKE ? OR email LIKE ?';
      
      query += whereClause;
      countQuery += whereClause;
      
      params.push(searchPattern, searchPattern, searchPattern);
      countParams.push(searchPattern, searchPattern, searchPattern);
    }
    
    // 4. Add ordering and pagination
    query += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    params.push(validLimit, offset);
    
    // 5. Execute queries
    const [data] = await db.query(query, params);
    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / validLimit);
    
    // 6. Return response
    res.json({
      success: true,
      data: data,
      total: total,
      page: validPage,
      limit: validLimit,
      totalPages: totalPages,
      searchTerm: searchTerm || null
    });
    
  } catch (error) {
    console.error('Error in getAllCustomers:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};

module.exports = {
  getAllCustomers
};
```

---

## 🔒 SECURITY - BẢO MẬT

### ⚠️ QUAN TRỌNG NHẤT: Phòng chống SQL Injection

#### ❌ NGUY HIỂM - KHÔNG BAO GIỜ LÀM THẾ NÀY
```javascript
// ❌ String concatenation - DỄ BỊ SQL INJECTION
const query = `SELECT * FROM customers WHERE name LIKE '%${search}%'`;
await db.query(query);

// Hacker có thể gửi: search = "'; DROP TABLE customers; --"
// Query trở thành: SELECT * FROM customers WHERE name LIKE '%'; DROP TABLE customers; --%'
// → DATABASE BỊ XÓA!
```

#### ✅ AN TOÀN - Parameterized Queries
```javascript
// ✅ Sử dụng placeholders (?)
const query = 'SELECT * FROM customers WHERE name LIKE ?';
const params = [`%${search}%`];
await db.query(query, params);

// Database tự động escape special characters
// Hacker gửi: search = "'; DROP TABLE customers; --"
// Query tìm kiếm: name LIKE "%'; DROP TABLE customers; --%"
// → Chỉ tìm kiếm, KHÔNG thực thi DROP TABLE
```

### Input Validation

```javascript
// 1. Giới hạn độ dài
const MAX_SEARCH_LENGTH = 100;

if (search && search.length > MAX_SEARCH_LENGTH) {
  return res.status(400).json({
    success: false,
    error: `Search term too long. Maximum ${MAX_SEARCH_LENGTH} characters.`
  });
}

// 2. Trim whitespace
const searchTerm = search.trim();

// 3. Reject nếu chỉ có whitespace
if (search && !searchTerm) {
  return res.status(400).json({
    success: false,
    error: 'Search term cannot be empty'
  });
}

// 4. Optional: Sanitize HTML/Script tags (nếu cần)
const sanitizedSearch = searchTerm.replace(/[<>]/g, '');
```

### Rate Limiting (Optional)

```javascript
// Cài đặt: npm install express-rate-limit
const rateLimit = require('express-rate-limit');

// Giới hạn 30 requests/phút cho search
const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: {
    success: false,
    error: 'Too many search requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Áp dụng cho route
app.get('/api/customers', searchLimiter, getAllCustomers);
```

---

## 🧪 TESTING

### Test Case 1: Search cơ bản

```bash
curl -X GET "http://localhost:3000/api/customers?search=nguyen&page=1&limit=20"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Nguyễn Văn A",
      "phone": "0901234567",
      "email": "nguyenvana@example.com"
    }
    // ... 19 more
  ],
  "total": 45,          // ← Tổng số kết quả tìm được
  "page": 1,
  "limit": 20,
  "totalPages": 3,      // ← 45 / 20 = 3 pages
  "searchTerm": "nguyen"
}
```

**Verify:**
- ✅ `total` = 45 (tổng số kết quả trong toàn bộ database)
- ✅ `data` có 20 items
- ✅ `totalPages` = 3
- ✅ `searchTerm` = "nguyen"

---

### Test Case 2: Search + Pagination

```bash
# Trang 1
curl "http://localhost:3000/api/customers?search=nguyen&page=1&limit=20"
# → 20 kết quả đầu tiên

# Trang 2
curl "http://localhost:3000/api/customers?search=nguyen&page=2&limit=20"
# → 20 kết quả tiếp theo (items 21-40)

# Trang 3
curl "http://localhost:3000/api/customers?search=nguyen&page=3&limit=20"
# → 5 kết quả cuối cùng (items 41-45)
```

---

### Test Case 3: Search không có kết quả

```bash
curl "http://localhost:3000/api/customers?search=xyz123notfound&page=1&limit=20"
```

**Expected:**
```json
{
  "success": true,
  "data": [],
  "total": 0,
  "page": 1,
  "limit": 20,
  "totalPages": 0,
  "searchTerm": "xyz123notfound"
}
```

---

### Test Case 4: Không có search (pagination bình thường)

```bash
curl "http://localhost:3000/api/customers?page=1&limit=20"
```

**Expected:**
```json
{
  "success": true,
  "data": [...],        // 20 customers
  "total": 1000,        // Tổng số customers trong database
  "page": 1,
  "limit": 20,
  "totalPages": 50,
  "searchTerm": null
}
```

---

### Test Case 5: Empty search

```bash
curl "http://localhost:3000/api/customers?search=&page=1&limit=20"
```

**Expected:** Giống như không có search

---

### Test Case 6: Search case-insensitive

```bash
# Lowercase
curl "http://localhost:3000/api/customers?search=nguyen&page=1&limit=20"

# Uppercase
curl "http://localhost:3000/api/customers?search=NGUYEN&page=1&limit=20"

# Mixed case
curl "http://localhost:3000/api/customers?search=NgUyEn&page=1&limit=20"
```

**Expected:** Tất cả 3 requests trả về kết quả giống nhau

---

### Test Case 7: Security - SQL Injection

```bash
curl "http://localhost:3000/api/customers?search='; DROP TABLE customers; --&page=1&limit=20"
```

**Expected:**
- ✅ KHÔNG xóa table
- ✅ Chỉ tìm kiếm string "'; DROP TABLE customers; --"
- ✅ Trả về empty results

---

### Test Case 8: Search theo số điện thoại

```bash
curl "http://localhost:3000/api/customers?search=0901&page=1&limit=20"
```

**Expected:** Tìm tất cả customers có phone chứa "0901"

---

### Test Case 9: Search theo email

```bash
curl "http://localhost:3000/api/customers?search=gmail&page=1&limit=20"
```

**Expected:** Tìm tất cả customers có email chứa "gmail"

---

### Test Case 10: Search với khoảng trắng

```bash
curl "http://localhost:3000/api/customers?search=%20%20%20&page=1&limit=20"
# URL encoded spaces: "   "
```

**Expected:** Backend trim() → searchTerm = "" → Trả về tất cả customers

---

## 📈 PERFORMANCE

### 1. Tạo Database Indexes (QUAN TRỌNG!)

```sql
-- Customers
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);

-- Employees
CREATE INDEX idx_employees_name ON employees(name);
CREATE INDEX idx_employees_phone ON employees(phone);

-- Vehicles
CREATE INDEX idx_vehicles_license_plate ON vehicles(license_plate);
CREATE INDEX idx_vehicles_model ON vehicles(model);

-- Dealers
CREATE INDEX idx_dealers_name ON dealers(name);
CREATE INDEX idx_dealers_phone ON dealers(phone);

-- Garages
CREATE INDEX idx_garages_code ON garages(code);
CREATE INDEX idx_garages_name ON garages(name);
CREATE INDEX idx_garages_address ON garages(address);

-- Garage Managers
CREATE INDEX idx_garage_managers_name ON garage_managers(name);
CREATE INDEX idx_garage_managers_phone ON garage_managers(phone);
```

### 2. Query Optimization

```javascript
// ❌ Không tốt: SELECT *
const query = 'SELECT * FROM customers WHERE name LIKE ?';

// ✅ Tốt hơn: Chỉ SELECT các cột cần thiết
const query = `
  SELECT id, name, phone, email, created_at 
  FROM customers 
  WHERE name LIKE ? OR phone LIKE ? OR email LIKE ?
  ORDER BY id DESC 
  LIMIT ? OFFSET ?
`;
```

### 3. Monitoring Performance

```javascript
const getAllCustomers = async (req, res) => {
  const startTime = Date.now();
  
  try {
    // ... query logic ...
    
    const duration = Date.now() - startTime;
    
    // Log slow queries
    if (duration > 1000) { // > 1 second
      console.warn(`Slow query detected: ${duration}ms`, {
        search: searchTerm,
        page,
        limit
      });
    }
    
    res.json({
      success: true,
      data: data,
      // ... other fields ...
      _debug: {
        queryTime: `${duration}ms`
      }
    });
  } catch (error) {
    // ... error handling ...
  }
};
```

---

## 🐛 TROUBLESHOOTING

### Vấn đề 1: Search không trả về kết quả

**Nguyên nhân:**
- Database không có data match
- Search term có dấu tiếng Việt

**Giải pháp:**
```javascript
// Option A: Normalize search term
function normalizeVietnamese(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

const normalizedSearch = normalizeVietnamese(searchTerm);
const searchPattern = `%${normalizedSearch}%`;
```

---

### Vấn đề 2: Search quá chậm

**Nguyên nhân:**
- Không có indexes
- Database quá lớn

**Giải pháp:**
```sql
-- Tạo indexes
CREATE INDEX idx_customers_name ON customers(name);

-- Analyze query
EXPLAIN SELECT * FROM customers WHERE name LIKE '%nguyen%';
```

---

### Vấn đề 3: Pagination sai khi search

**Nguyên nhân:**
- Count query không có WHERE clause giống data query

**Giải pháp:**
```javascript
// ✅ Đảm bảo WHERE clause giống nhau
if (searchTerm) {
  const whereClause = ' WHERE name LIKE ? OR phone LIKE ?';
  query += whereClause;
  countQuery += whereClause; // ← QUAN TRỌNG: Phải giống nhau
  
  params.push(searchPattern, searchPattern);
  countParams.push(searchPattern, searchPattern); // ← Params cũng phải giống
}
```

---

### Vấn đề 4: SQL Injection

**Nguyên nhân:**
- Sử dụng string concatenation

**Giải pháp:**
```javascript
// ❌ NGUY HIỂM
const query = `SELECT * FROM customers WHERE name LIKE '%${search}%'`;

// ✅ AN TOÀN
const query = 'SELECT * FROM customers WHERE name LIKE ?';
const params = [`%${search}%`];
await db.query(query, params);
```

---

## ✅ CHECKLIST

### Preparation
- [ ] Backup database trước khi thay đổi
- [ ] Đọc kỹ tài liệu này
- [ ] Chuẩn bị môi trường test

### Implementation (7 controllers)
- [ ] `customerController.js` - getAllCustomers()
- [ ] `employeeController.js` - getEmployees()
- [ ] `employeeController.js` - getAvailableOrdersForClaim()
- [ ] `dealerController.js` - getAllDealers()
- [ ] `vehicleController.js` - getAllVehicles()
- [ ] `webGarageController.js` - getAllGarages()
- [ ] `garageManagerController.js` - getAllGarageManagers()

### Security (QUAN TRỌNG!)
- [ ] Sử dụng parameterized queries (KHÔNG string concatenation)
- [ ] Thêm input validation (max length, trim)
- [ ] Test SQL injection
- [ ] Optional: Thêm rate limiting

### Database
- [ ] Tạo indexes cho các cột search
- [ ] Test performance với data thật
- [ ] Monitor slow queries

### Testing (10 test cases)
- [ ] Test 1: Search cơ bản
- [ ] Test 2: Search + pagination
- [ ] Test 3: Search không có kết quả
- [ ] Test 4: Không có search
- [ ] Test 5: Empty search
- [ ] Test 6: Case-insensitive
- [ ] Test 7: SQL injection
- [ ] Test 8: Search theo phone
- [ ] Test 9: Search theo email
- [ ] Test 10: Search với khoảng trắng

### Deployment
- [ ] Test trên staging environment
- [ ] Monitor performance sau deploy
- [ ] Rollback plan nếu có vấn đề

---

## 🎉 KẾT LUẬN

### Tóm tắt
- ✅ Sử dụng Simple LIKE Search với parameterized queries
- ✅ An toàn, đơn giản, dễ maintain
- ✅ Phù hợp cho hầu hết use cases
- ✅ Có thể scale lên Full-Text Search sau nếu cần

### Timeline Ước Tính
- Đọc tài liệu: 30 phút
- Implementation: 2-3 giờ
- Testing: 1 giờ
- Deploy: 30 phút
- **TỔNG: 4-5 giờ**

### Next Steps
1. ✅ Backup database
2. ✅ Implement theo template
3. ✅ Test kỹ càng với 10 test cases
4. ✅ Tạo indexes
5. ✅ Deploy

### Frontend (Đã xong)
- ✅ `src/hooks/useListFetch.js` - Gửi search parameter
- ✅ `src/hooks/useEntityCrud.js` - Gửi search parameter

---

## 📞 SUPPORT

### Gặp vấn đề?
1. Kiểm tra lại checklist
2. Xem phần Troubleshooting
3. Test với data nhỏ trước
4. Check logs và error messages

### Lưu ý quan trọng
- ✅ **LUÔN LUÔN** sử dụng parameterized queries
- ❌ **KHÔNG BAO GIỜ** dùng string concatenation
- ✅ Validate input
- ✅ Test SQL injection
- ✅ Tạo indexes
- ✅ Backup database trước khi deploy

---

**Last Updated:** 2026-05-04  
**Version:** 1.0.0  
**Author:** Development Team  
**Status:** ✅ READY FOR IMPLEMENTATION

**Good luck! 🚀**
