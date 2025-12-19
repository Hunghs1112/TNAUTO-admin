# Yêu cầu Backend: Nhúng Video và Review Sản phẩm

## Tổng quan

Thêm tính năng:
1. **Nhúng video** cho sản phẩm (quản trị viên có thể thêm video YouTube, Vimeo, hoặc video tự host)
2. **Review sản phẩm** (khách hàng có thể đánh giá và review sản phẩm)

## 1. Cập nhật Database Schema

### 1.1. Bảng `products` - Thêm field video

**Thêm cột mới:**
```sql
ALTER TABLE products 
ADD COLUMN video_url VARCHAR(500) DEFAULT NULL COMMENT 'URL video nhúng (YouTube, Vimeo, hoặc direct video URL)';
```

**Lưu ý:**
- Kiểu dữ liệu: `VARCHAR(500)` (đủ cho URL dài)
- Cho phép NULL: Có (sản phẩm có thể không có video)
- Default: NULL
- Format: URL video (YouTube embed URL, Vimeo embed URL, hoặc direct video URL)

### 1.2. Bảng mới `product_reviews`

**Tạo bảng mới:**
```sql
CREATE TABLE product_reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  customer_id INT NOT NULL,
  order_id INT NULL COMMENT 'ID đơn hàng nếu review từ đơn hàng',
  rating INT NOT NULL COMMENT 'Điểm đánh giá từ 1-5',
  title VARCHAR(255) NULL COMMENT 'Tiêu đề review',
  content TEXT NULL COMMENT 'Nội dung review',
  images JSON NULL COMMENT 'Mảng URL hình ảnh review (JSON array)',
  is_approved TINYINT(1) DEFAULT 0 COMMENT 'Đã được duyệt chưa (0=chưa, 1=đã duyệt)',
  is_verified_purchase TINYINT(1) DEFAULT 0 COMMENT 'Đã mua hàng chưa (0=chưa, 1=đã mua)',
  helpful_count INT DEFAULT 0 COMMENT 'Số người đánh giá hữu ích',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES service_orders(id) ON DELETE SET NULL,
  
  INDEX idx_product_id (product_id),
  INDEX idx_customer_id (customer_id),
  INDEX idx_is_approved (is_approved),
  INDEX idx_rating (rating),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Giải thích các field:**
- `id`: Primary key
- `product_id`: ID sản phẩm được review
- `customer_id`: ID khách hàng viết review
- `order_id`: ID đơn hàng (nếu review từ đơn hàng đã mua)
- `rating`: Điểm đánh giá (1-5 sao)
- `title`: Tiêu đề review (optional)
- `content`: Nội dung review chi tiết
- `images`: JSON array chứa URLs hình ảnh review
- `is_approved`: Trạng thái duyệt (admin phải duyệt trước khi hiển thị)
- `is_verified_purchase`: Đánh dấu đã mua hàng (từ order_id)
- `helpful_count`: Số lượt "hữu ích" (có thể thêm bảng riêng sau)
- `created_at`, `updated_at`: Timestamps

### 1.3. Bảng `product_review_helpful` (Optional - cho tính năng "Hữu ích")

```sql
CREATE TABLE product_review_helpful (
  id INT AUTO_INCREMENT PRIMARY KEY,
  review_id INT NOT NULL,
  customer_id INT NOT NULL COMMENT 'Khách hàng đánh giá hữu ích',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (review_id) REFERENCES product_reviews(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  
  UNIQUE KEY unique_review_customer (review_id, customer_id),
  INDEX idx_review_id (review_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## 2. Cập nhật API Endpoints

### 2.1. Products API - Thêm video_url

#### GET /products (và /products/admin)

**Response mới (thêm field):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Sản phẩm A",
      "price": 1000000,
      "category_id": 1,
      "description": "...",
      "image_url": "...",
      "video_url": "https://www.youtube.com/embed/xxxxx",  // ← THÊM FIELD NÀY
      "created_at": "..."
    }
  ]
}
```

#### GET /products/:id (và /products/admin/:id)

**Response mới:**
- Thêm field `video_url` vào response

#### POST /products/admin (CREATE)

**Request body mới:**
```json
{
  "name": "Sản phẩm mới",
  "price": 1000000,
  "category_id": 1,
  "description": "...",
  "image_url": "...",
  "video_url": "https://www.youtube.com/embed/xxxxx"  // ← THÊM FIELD NÀY (optional)
}
```

**Validation:**
- `video_url`: Optional
- Nếu có, phải là URL hợp lệ (YouTube embed URL, Vimeo embed URL, hoặc direct video URL)
- Format YouTube embed: `https://www.youtube.com/embed/VIDEO_ID` hoặc `https://youtu.be/VIDEO_ID`
- Format Vimeo embed: `https://player.vimeo.com/video/VIDEO_ID`

#### PUT /products/admin/:id (UPDATE)

**Request body mới:**
```json
{
  "name": "Sản phẩm đã sửa",
  "video_url": "https://www.youtube.com/embed/xxxxx",  // ← CÓ THỂ CẬP NHẬT
  ...
}
```

**Validation:**
- `video_url`: Optional, có thể set NULL để xóa video

### 2.2. Product Reviews API - CRUD mới

#### GET /product-reviews

**Query Parameters:**
- `product_id` (required): ID sản phẩm
- `approved_only` (optional, default: true): Chỉ lấy reviews đã được duyệt
- `rating` (optional): Lọc theo rating (1-5)
- `page` (optional): Số trang
- `limit` (optional): Số lượng mỗi trang

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "product_id": 1,
      "customer_id": 5,
      "customer_name": "Nguyễn Văn A",  // ← JOIN từ customers
      "customer_avatar": "...",  // ← JOIN từ customers
      "order_id": 10,
      "rating": 5,
      "title": "Sản phẩm rất tốt",
      "content": "Tôi rất hài lòng với sản phẩm này...",
      "images": ["url1", "url2"],  // JSON array
      "is_approved": true,
      "is_verified_purchase": true,
      "helpful_count": 10,
      "created_at": "2025-11-15 10:00:00",
      "updated_at": "2025-11-15 10:00:00"
    }
  ],
  "count": 10,
  "average_rating": 4.5,
  "rating_distribution": {
    "5": 5,
    "4": 3,
    "3": 1,
    "2": 1,
    "1": 0
  }
}
```

#### GET /product-reviews/:id

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "product_id": 1,
    "product_name": "Sản phẩm A",  // ← JOIN từ products
    "customer_id": 5,
    "customer_name": "Nguyễn Văn A",
    "customer_avatar": "...",
    "order_id": 10,
    "rating": 5,
    "title": "Sản phẩm rất tốt",
    "content": "...",
    "images": ["url1", "url2"],
    "is_approved": true,
    "is_verified_purchase": true,
    "helpful_count": 10,
    "created_at": "2025-11-15 10:00:00",
    "updated_at": "2025-11-15 10:00:00"
  }
}
```

#### POST /product-reviews (CREATE - Public endpoint)

**Request body:**
```json
{
  "product_id": 1,
  "customer_id": 5,
  "order_id": 10,  // Optional - nếu có thì is_verified_purchase = true
  "rating": 5,
  "title": "Sản phẩm rất tốt",  // Optional
  "content": "Tôi rất hài lòng...",
  "images": ["url1", "url2"]  // Optional - JSON array
}
```

**Validation:**
- `product_id`: Required, phải tồn tại trong bảng products
- `customer_id`: Required, phải tồn tại trong bảng customers
- `rating`: Required, phải là số nguyên từ 1-5
- `content`: Required, tối thiểu 10 ký tự
- `order_id`: Optional, nếu có thì kiểm tra:
  - Order phải thuộc về customer_id
  - Order phải có product_id trong order items
  - Nếu hợp lệ → set `is_verified_purchase = true`
- `images`: Optional, phải là array, mỗi item là URL hợp lệ
- `is_approved`: Mặc định = false (cần admin duyệt)

**Response:**
```json
{
  "success": true,
  "message": "Review đã được gửi và đang chờ duyệt",
  "data": {
    "id": 1,
    "product_id": 1,
    "customer_id": 5,
    "rating": 5,
    "is_approved": false,
    ...
  }
}
```

#### PUT /product-reviews/admin/:id (UPDATE - Admin only)

**Request body:**
```json
{
  "rating": 4,
  "title": "Đã sửa tiêu đề",
  "content": "Đã sửa nội dung",
  "images": ["url1"],
  "is_approved": true  // Admin có thể duyệt/không duyệt
}
```

**Validation:**
- Tất cả fields đều optional
- Chỉ admin mới có quyền update

#### DELETE /product-reviews/admin/:id (DELETE - Admin only)

**Response:**
```json
{
  "success": true,
  "message": "Đã xóa review thành công"
}
```

#### POST /product-reviews/admin/:id/approve (APPROVE - Admin only)

**Request body:** (empty)

**Response:**
```json
{
  "success": true,
  "message": "Đã duyệt review thành công",
  "data": {
    "id": 1,
    "is_approved": true,
    ...
  }
}
```

#### POST /product-reviews/:id/helpful (MARK HELPFUL - Public)

**Request body:**
```json
{
  "customer_id": 5
}
```

**Validation:**
- Mỗi customer chỉ có thể đánh giá "hữu ích" 1 lần cho mỗi review
- Tăng `helpful_count` lên 1

**Response:**
```json
{
  "success": true,
  "message": "Đã đánh giá hữu ích",
  "data": {
    "helpful_count": 11
  }
}
```

### 2.3. Products API - Thêm thống kê reviews

#### GET /products/:id/reviews/stats

**Response:**
```json
{
  "success": true,
  "data": {
    "total_reviews": 50,
    "average_rating": 4.5,
    "rating_distribution": {
      "5": 30,
      "4": 15,
      "3": 3,
      "2": 1,
      "1": 1
    },
    "verified_purchase_count": 45,
    "with_images_count": 20
  }
}
```

## 3. Logic xử lý

### 3.1. Validate video URL

**Function validate video URL:**
```javascript
function validateVideoUrl(url) {
  if (!url) return { valid: true, type: null }; // NULL is allowed
  
  // Remove query params for validation (but keep them in stored URL)
  const cleanUrl = url.split('?')[0];
  
  // YouTube embed URL: https://www.youtube.com/embed/VIDEO_ID
  const youtubeEmbedRegex = /^https?:\/\/(www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]+)/;
  // YouTube short URL: https://youtu.be/VIDEO_ID
  const youtubeShortRegex = /^https?:\/\/youtu\.be\/([a-zA-Z0-9_-]+)/;
  // YouTube watch URL: https://www.youtube.com/watch?v=VIDEO_ID
  const youtubeWatchRegex = /^https?:\/\/(www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/;
  
  // Vimeo embed URL: https://player.vimeo.com/video/VIDEO_ID
  const vimeoEmbedRegex = /^https?:\/\/player\.vimeo\.com\/video\/([0-9]+)/;
  // Vimeo URL: https://vimeo.com/VIDEO_ID
  const vimeoRegex = /^https?:\/\/(www\.)?vimeo\.com\/([0-9]+)/;
  
  // TikTok URL: https://www.tiktok.com/@username/video/VIDEO_ID
  const tiktokRegex = /^https?:\/\/(www\.)?tiktok\.com\/@([^\/]+)\/video\/(\d+)/;
  // TikTok short URL: https://vm.tiktok.com/CODE
  const tiktokShortRegex = /^https?:\/\/vm\.tiktok\.com\/[a-zA-Z0-9]+/;
  
  // Facebook Video
  const facebookRegex = /^https?:\/\/(www\.)?(facebook\.com|fb\.com|fb\.watch)\/.+/;
  
  // Instagram Video/Reel
  const instagramPostRegex = /^https?:\/\/(www\.)?instagram\.com\/p\/([a-zA-Z0-9_-]+)/;
  const instagramReelRegex = /^https?:\/\/(www\.)?instagram\.com\/reel\/([a-zA-Z0-9_-]+)/;
  
  // Direct video URL (mp4, webm, etc.)
  const directVideoRegex = /^https?:\/\/.+\.(mp4|webm|ogg|mov|avi|mkv|flv|wmv)(\?.*)?$/i;
  
  // YouTube
  if (youtubeEmbedRegex.test(cleanUrl) || youtubeShortRegex.test(cleanUrl) || youtubeWatchRegex.test(cleanUrl)) {
    return { valid: true, type: 'youtube', url: url };
  }
  
  // Vimeo
  if (vimeoEmbedRegex.test(cleanUrl) || vimeoRegex.test(cleanUrl)) {
    return { valid: true, type: 'vimeo', url: url };
  }
  
  // TikTok
  if (tiktokRegex.test(cleanUrl) || tiktokShortRegex.test(cleanUrl)) {
    return { valid: true, type: 'tiktok', url: url };
  }
  
  // Facebook
  if (facebookRegex.test(cleanUrl)) {
    return { valid: true, type: 'facebook', url: url };
  }
  
  // Instagram
  if (instagramPostRegex.test(cleanUrl) || instagramReelRegex.test(cleanUrl)) {
    return { valid: true, type: 'instagram', url: url };
  }
  
  // Direct video
  if (directVideoRegex.test(url)) {
    return { valid: true, type: 'direct', url: url };
  }
  
  return { valid: false, type: null, error: 'Invalid video URL format' };
}
```

### 3.2. Auto-detect verified purchase

**Khi tạo review với order_id:**
```javascript
async function createReview(data) {
  // Validate order_id nếu có
  if (data.order_id) {
    const order = await getOrderById(data.order_id);
    
    // Check if order belongs to customer
    if (order.customer_id !== data.customer_id) {
      throw new Error('Order does not belong to customer');
    }
    
    // Check if order contains this product
    const orderItems = await getOrderItems(data.order_id);
    const hasProduct = orderItems.some(item => item.product_id === data.product_id);
    
    if (hasProduct) {
      data.is_verified_purchase = true;
    }
  }
  
  // Create review
  return await createReviewInDB(data);
}
```

### 3.3. Tính toán average rating

**Khi có review mới hoặc cập nhật:**
```sql
-- Update average rating trong bảng products (hoặc tính real-time)
UPDATE products 
SET average_rating = (
  SELECT AVG(rating) 
  FROM product_reviews 
  WHERE product_id = products.id AND is_approved = 1
)
WHERE id = ?;
```

**Hoặc tính real-time khi GET:**
```sql
SELECT 
  p.*,
  COALESCE(AVG(pr.rating), 0) as average_rating,
  COUNT(pr.id) as review_count
FROM products p
LEFT JOIN product_reviews pr ON p.id = pr.product_id AND pr.is_approved = 1
WHERE p.id = ?
GROUP BY p.id;
```

## 4. Migration Scripts

### 4.1. Thêm video_url vào products

```sql
-- Thêm cột video_url
ALTER TABLE products 
ADD COLUMN video_url VARCHAR(500) DEFAULT NULL 
COMMENT 'URL video nhúng (YouTube, Vimeo, hoặc direct video URL)';

-- Thêm index nếu cần query theo video_url
-- CREATE INDEX idx_products_video_url ON products(video_url) WHERE video_url IS NOT NULL;
```

### 4.2. Tạo bảng product_reviews

```sql
-- Tạo bảng product_reviews (xem ở phần 1.2)
-- Tạo bảng product_review_helpful (xem ở phần 1.3)
```

### 4.3. Thêm average_rating vào products (Optional)

```sql
ALTER TABLE products 
ADD COLUMN average_rating DECIMAL(3,2) DEFAULT NULL 
COMMENT 'Điểm đánh giá trung bình (tính từ reviews đã duyệt)';

ALTER TABLE products 
ADD COLUMN review_count INT DEFAULT 0 
COMMENT 'Số lượng reviews đã duyệt';
```

## 5. Validation Rules

### 5.1. Video URL

- **Format hợp lệ:**
  - YouTube: `https://www.youtube.com/embed/VIDEO_ID` hoặc `https://youtu.be/VIDEO_ID`
  - Vimeo: `https://player.vimeo.com/video/VIDEO_ID` hoặc `https://vimeo.com/VIDEO_ID`
  - Direct video: `https://example.com/video.mp4`
- **Max length:** 500 ký tự
- **Required:** No (có thể NULL)

### 5.2. Review

- **rating:** Required, integer từ 1-5
- **content:** Required, tối thiểu 10 ký tự, tối đa 5000 ký tự
- **title:** Optional, tối đa 255 ký tự
- **images:** Optional, array tối đa 5 URLs
- **product_id:** Required, phải tồn tại
- **customer_id:** Required, phải tồn tại
- **order_id:** Optional, nếu có phải thuộc về customer và có product trong order

## 6. Test Cases

### Test 1: Thêm video vào sản phẩm
```json
PUT /products/admin/1
{
  "video_url": "https://www.youtube.com/embed/dQw4w9WgXcQ"
}
```
**Expected:** Video URL được lưu và trả về trong response

### Test 2: Tạo review mới
```json
POST /product-reviews
{
  "product_id": 1,
  "customer_id": 5,
  "rating": 5,
  "content": "Sản phẩm rất tốt, tôi rất hài lòng"
}
```
**Expected:** Review được tạo với `is_approved = false`

### Test 3: Tạo review với order_id (verified purchase)
```json
POST /product-reviews
{
  "product_id": 1,
  "customer_id": 5,
  "order_id": 10,
  "rating": 5,
  "content": "..."
}
```
**Expected:** Review được tạo với `is_verified_purchase = true`

### Test 4: Duyệt review
```
POST /product-reviews/admin/1/approve
```
**Expected:** `is_approved = true`, review hiển thị trong GET /product-reviews

### Test 5: Đánh giá hữu ích
```json
POST /product-reviews/1/helpful
{
  "customer_id": 5
}
```
**Expected:** `helpful_count` tăng lên 1

## 7. Ưu tiên

**HIGH** - Tính năng này cải thiện đáng kể trải nghiệm người dùng và giúp tăng độ tin cậy của sản phẩm.

## 8. Lưu ý

1. **Security:**
   - Validate và sanitize video URLs để tránh XSS
   - Chỉ cho phép embed URLs, không cho phép arbitrary JavaScript
   - Validate image URLs trong reviews

2. **Performance:**
   - Cache average_rating nếu có nhiều reviews
   - Index các foreign keys và fields thường query
   - Pagination cho reviews list

3. **Moderation:**
   - Admin phải duyệt reviews trước khi hiển thị công khai
   - Có thể thêm tính năng report spam/abuse sau

4. **Notifications:**
   - Gửi email thông báo khi có review mới (cho admin)
   - Gửi email khi review được duyệt (cho customer)

