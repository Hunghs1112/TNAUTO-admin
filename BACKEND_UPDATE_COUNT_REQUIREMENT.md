# Yêu cầu cập nhật Backend: Tự động cập nhật số lượng sản phẩm/dịch vụ trong danh mục

## Vấn đề hiện tại

Khi thay đổi `category_id` của sản phẩm hoặc dịch vụ, số lượng sản phẩm/dịch vụ (`product_count`/`service_count`) trong các danh mục không được cập nhật tự động trong database.

## Yêu cầu

### 1. Tự động cập nhật count khi thay đổi category_id

**Khi UPDATE sản phẩm (products):**
- Nếu `category_id` thay đổi:
  - **Giảm** `product_count` của danh mục cũ (old `category_id`)
  - **Tăng** `product_count` của danh mục mới (new `category_id`)
  - Đảm bảo count không bao giờ < 0

**Khi UPDATE dịch vụ (services):**
- Nếu `category_id` thay đổi:
  - **Giảm** `service_count` của danh mục dịch vụ cũ (old `category_id`)
  - **Tăng** `service_count` của danh mục dịch vụ mới (new `category_id`)
  - Đảm bảo count không bao giờ < 0

**Khi CREATE sản phẩm/dịch vụ:**
- Nếu có `category_id`:
  - **Tăng** `product_count` hoặc `service_count` của danh mục tương ứng

**Khi DELETE sản phẩm/dịch vụ:**
- Nếu có `category_id`:
  - **Giảm** `product_count` hoặc `service_count` của danh mục tương ứng

### 2. API GET categories phải trả về count mới nhất

API `GET /categories` và `GET /service-categories` phải:
- Tính toán `product_count`/`service_count` real-time mỗi lần được gọi
- HOẶC đảm bảo count được cập nhật ngay sau khi có thay đổi category_id

### 3. Cách triển khai đề xuất

**Option 1: Database Triggers (Khuyến nghị)**
- Tạo trigger trên bảng `products` và `services`
- Trigger tự động cập nhật count khi INSERT/UPDATE/DELETE

**Option 2: Application Logic**
- Trong API endpoint UPDATE/CREATE/DELETE products/services:
  - Kiểm tra category_id có thay đổi không
  - Cập nhật count của danh mục cũ và mới

**Option 3: Recalculate on GET**
- Mỗi lần GET categories, tính lại count từ database:
  ```sql
  SELECT COUNT(*) FROM products WHERE category_id = ?
  ```

### 4. Ví dụ logic cần implement

```javascript
// Pseudo code cho UPDATE product
async function updateProduct(productId, data) {
  const oldProduct = await getProductById(productId);
  const oldCategoryId = oldProduct.category_id;
  const newCategoryId = data.category_id;
  
  // Update product
  await updateProductInDB(productId, data);
  
  // Update counts if category changed
  if (oldCategoryId !== newCategoryId) {
    // Decrease old category count
    if (oldCategoryId) {
      await decreaseCategoryProductCount(oldCategoryId);
    }
    // Increase new category count
    if (newCategoryId) {
      await increaseCategoryProductCount(newCategoryId);
    }
  }
}
```

### 5. Response format

API GET categories phải trả về:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Danh mục A",
      "product_count": 5,  // Phải là số lượng mới nhất
      ...
    }
  ]
}
```

## Test cases

1. **Test UPDATE product category:**
   - Product A thuộc Category 1 (count = 5)
   - Chuyển Product A sang Category 2
   - Category 1 count phải = 4
   - Category 2 count phải = 6

2. **Test CREATE product:**
   - Tạo Product mới thuộc Category 1 (count = 5)
   - Category 1 count phải = 6

3. **Test DELETE product:**
   - Xóa Product thuộc Category 1 (count = 5)
   - Category 1 count phải = 4

4. **Test GET categories sau khi thay đổi:**
   - Thay đổi category của product
   - Gọi GET /categories ngay sau đó
   - Count phải được cập nhật ngay lập tức

## Ưu tiên

**HIGH** - Tính năng này ảnh hưởng trực tiếp đến trải nghiệm người dùng và tính chính xác của dữ liệu hiển thị.

## Lưu ý

- Đảm bảo count không bao giờ < 0
- Xử lý trường hợp category_id = NULL
- Xử lý transaction để đảm bảo data consistency
- Nếu dùng trigger, đảm bảo performance không bị ảnh hưởng

