# Backend Summary - Search Feature

## 🎯 TL;DR (Too Long; Didn't Read)

**Frontend đã tự xử lý search. Backend KHÔNG CẦN làm gì với tham số `search`.**

---

## ✅ Backend CHỈ CẦN làm

### 1. Xử lý Pagination
```javascript
// Chỉ cần xử lý 2 tham số này:
const { page = 1, limit = 20 } = req.query;
```

### 2. Trả về đúng format
```json
{
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 20,
  "totalPages": 5
}
```

---

## ❌ Backend KHÔNG CẦN làm

### Bỏ qua các tham số này (nếu có):
- `search`
- `searchTerm`
- `query`
- `q`

### Ví dụ request từ frontend:
```
GET /api/customers?page=1&limit=20
GET /api/customers?page=1&limit=20&search=nguyen  ← Backend bỏ qua "search"
```

**Cả 2 request trên đều trả về kết quả giống nhau** (20 items đầu tiên)

---

## 🔧 Nếu backend đang xử lý search

### Loại bỏ code này:
```javascript
// ❌ XÓA CODE NÀY
if (req.query.search) {
  query = query.where('name', 'like', `%${req.query.search}%`);
}
```

### Giữ lại code này:
```javascript
// ✅ GIỮ CODE NÀY
const { page = 1, limit = 20 } = req.query;
const offset = (page - 1) * limit;

const data = await Model.findAll({ limit, offset });
const total = await Model.count();

res.json({
  data,
  total,
  page: parseInt(page),
  limit: parseInt(limit),
  totalPages: Math.ceil(total / limit)
});
```

---

## 📝 Các endpoint cần kiểm tra

Nếu các endpoint này đang xử lý `search`, có thể loại bỏ:

1. `/api/customers`
2. `/api/employees`
3. `/api/vehicles`
4. `/api/service-orders` hoặc `/api/web/service-orders`
5. `/api/services`
6. `/api/products`
7. `/api/offers`
8. `/api/categories`
9. `/api/service-categories`
10. `/api/warranties`
11. `/api/garages`
12. `/api/dealers`

---

## ❓ FAQ

**Q: Tại sao không dùng backend search?**  
A: Frontend search nhanh hơn (< 1ms), không tốn bandwidth, và đơn giản hơn.

**Q: Nếu có 10,000 records thì sao?**  
A: Frontend chỉ search trong 20 records đã load. User dùng pagination để xem trang khác.

**Q: Có ảnh hưởng performance không?**  
A: Không, thậm chí tốt hơn vì giảm API calls và database queries.

---

## 📚 Chi tiết đầy đủ

Xem file **`BACKEND_SEARCH_REMOVAL.md`** để biết:
- Ví dụ code chi tiết
- Migration plan
- Test cases
- Câu hỏi thường gặp

---

## ✨ Kết luận

**Action Required**: 
1. Kiểm tra xem backend có đang xử lý tham số `search` không
2. Nếu có, loại bỏ code đó
3. Giữ nguyên pagination logic
4. Deploy và test

**Thời gian ước tính**: 15-30 phút (nếu cần thay đổi)
