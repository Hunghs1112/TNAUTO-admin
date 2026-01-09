# Backend API Endpoints - Offers (Ưu đãi) - Chi tiết Implementation

## Tổng quan
Tài liệu này mô tả chi tiết tất cả các API endpoints cần thiết cho tính năng Offers với quản lý hình ảnh và nội dung.

**⚠️ QUAN TRỌNG:** Tất cả các endpoints dưới đây đều **BẮT BUỘC** phải được implement để frontend hoạt động đúng.

---

## 1. Offers CRUD Endpoints (Đã có, cần cập nhật)

### 1.1 GET `/api/offers` - Lấy danh sách ưu đãi

**Method:** `GET`  
**URL:** `/api/offers`  
**Query Parameters (optional):**
- `page` (number): Số trang
- `limit` (number): Số lượng mỗi trang
- `search` (string): Tìm kiếm theo tên

**Response Format:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Ưu đãi mùa hè",
      "service_id": 5,
      "service_name": "Thay dầu", // JOIN từ services table
      "content": "Giảm giá 20% cho tất cả dịch vụ thay dầu...",
      "image_url": "https://example.com/image.jpg", // Ảnh chính (backward compatible)
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
  ],
  "count": 10,
  "total": 50,
  "page": 1,
  "limit": 10
}
```

**Implementation Notes:**
- JOIN với `services` table để lấy `service_name`
- LEFT JOIN với `offer_images` để lấy tất cả ảnh
- `primary_image` là ảnh có `is_primary = 1` (nếu có)
- `image_url` phải luôn sync với `primary_image.image_url` (backward compatible)
- Nếu không có ảnh, `images` = `[]`, `primary_image` = `null`, `image_url` = `null`

---

### 1.2 GET `/api/offers/:id` - Lấy chi tiết ưu đãi

**Method:** `GET`  
**URL:** `/api/offers/:id`  
**Path Parameters:**
- `id` (number, required): ID của ưu đãi

**Response Format:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Ưu đãi mùa hè",
    "service_id": 5,
    "service_name": "Thay dầu",
    "content": "Giảm giá 20% cho tất cả dịch vụ thay dầu...",
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
        "display_order": 0,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
      },
      {
        "id": 2,
        "image_url": "https://example.com/image2.jpg",
        "is_primary": 0,
        "display_order": 1,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
      }
    ],
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Ưu đãi không tồn tại"
}
```

---

### 1.3 POST `/api/offers/admin` - Tạo ưu đãi mới

**Method:** `POST`  
**URL:** `/api/offers/admin`  
**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer <token>` (nếu có authentication)

**Request Body:**
```json
{
  "name": "Ưu đãi mùa hè",
  "service_id": 5,
  "content": "Giảm giá 20% cho tất cả dịch vụ thay dầu. Áp dụng từ ngày 1/1 đến 31/1/2024.",
  "image_url": "https://example.com/image.jpg" // Optional
}
```

**Validation:**
- `name`: Required, string, max 255 chars
- `service_id`: Required, integer, must exist in `services` table
- `content`: Optional, text (no limit)
- `image_url`: Optional, string, max 500 chars, valid URL format

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Ưu đãi mùa hè",
    "service_id": 5,
    "service_name": "Thay dầu",
    "content": "Giảm giá 20% cho tất cả dịch vụ thay dầu...",
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
      }
    ],
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "message": "Tạo ưu đãi thành công"
}
```

**Business Logic:**
- Nếu có `image_url` trong request, tự động tạo record trong `offer_images` với `is_primary = 1`
- Nếu không có `image_url`, `image_url` trong `offers` table = `null`

**Error Response (400):**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "name": "Tên ưu đãi là bắt buộc",
    "service_id": "Dịch vụ không tồn tại"
  }
}
```

---

### 1.4 PUT `/api/offers/admin/:id` - Cập nhật ưu đãi

**Method:** `PUT`  
**URL:** `/api/offers/admin/:id`  
**Path Parameters:**
- `id` (number, required): ID của ưu đãi

**Request Body:**
```json
{
  "name": "Ưu đãi mùa hè (cập nhật)",
  "service_id": 5,
  "content": "Giảm giá 25% cho tất cả dịch vụ thay dầu...",
  "image_url": "https://example.com/new-image.jpg" // Optional
}
```

**Validation:** Giống như POST

**Response:** Giống như GET `/api/offers/:id`

**Business Logic:**
- Nếu có `image_url` trong request:
  - Nếu đã có ảnh chính, cập nhật `image_url` của ảnh chính
  - Nếu chưa có ảnh chính, tạo mới record trong `offer_images` với `is_primary = 1`
  - Cập nhật `offers.image_url` = `image_url` mới

**Error Response (404):**
```json
{
  "success": false,
  "message": "Ưu đãi không tồn tại"
}
```

---

### 1.5 DELETE `/api/offers/admin/:id` - Xóa ưu đãi

**Method:** `DELETE`  
**URL:** `/api/offers/admin/:id`  
**Path Parameters:**
- `id` (number, required): ID của ưu đãi

**Response:**
```json
{
  "success": true,
  "message": "Xóa ưu đãi thành công"
}
```

**Business Logic:**
- Xóa tất cả records trong `offer_images` có `offer_id = id` (CASCADE)
- Xóa record trong `offers` table

**Error Response (404):**
```json
{
  "success": false,
  "message": "Ưu đãi không tồn tại"
}
```

---

## 2. Offer Images Management Endpoints (⚠️ CHƯA CÓ - CẦN IMPLEMENT)

### 2.1 GET `/api/offers/:offerId/images` - Lấy tất cả ảnh của ưu đãi

**Method:** `GET`  
**URL:** `/api/offers/:offerId/images`  
**Path Parameters:**
- `offerId` (number, required): ID của ưu đãi

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "offer_id": 1,
      "image_url": "https://example.com/image.jpg",
      "is_primary": 1,
      "display_order": 0,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    },
    {
      "id": 2,
      "offer_id": 1,
      "image_url": "https://example.com/image2.jpg",
      "is_primary": 0,
      "display_order": 1,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "count": 2
}
```

**Sorting:**
- Ảnh chính (`is_primary = 1`) hiển thị trước
- Sau đó sắp xếp theo `display_order` ASC
- Nếu `display_order` giống nhau, sắp xếp theo `created_at` ASC

**Error Response (404):**
```json
{
  "success": false,
  "message": "Ưu đãi không tồn tại"
}
```

**Implementation Example (Node.js/Express):**
```javascript
router.get('/offers/:offerId/images', async (req, res) => {
  try {
    const { offerId } = req.params;
    
    // Kiểm tra offer có tồn tại không
    const offer = await db.query('SELECT id FROM offers WHERE id = ?', [offerId]);
    if (!offer || offer.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ưu đãi không tồn tại'
      });
    }
    
    // Lấy tất cả ảnh
    const images = await db.query(
      `SELECT * FROM offer_images 
       WHERE offer_id = ? 
       ORDER BY is_primary DESC, display_order ASC, created_at ASC`,
      [offerId]
    );
    
    res.json({
      success: true,
      data: images,
      count: images.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});
```

---

### 2.2 POST `/api/offers/images` - Tạo ảnh mới

**Method:** `POST`  
**URL:** `/api/offers/images`  
**Headers:**
- `Content-Type: application/json`

**Request Body:**
```json
{
  "offer_id": 1,
  "image_url": "https://example.com/new-image.jpg",
  "is_primary": 0, // Optional, default 0
  "display_order": 1 // Optional, default 0
}
```

**Validation:**
- `offer_id`: Required, integer, must exist in `offers` table
- `image_url`: Required, string, max 500 chars, valid URL format
- `is_primary`: Optional, 0 or 1, default 0
- `display_order`: Optional, integer, default 0

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 3,
    "offer_id": 1,
    "image_url": "https://example.com/new-image.jpg",
    "is_primary": 0,
    "display_order": 1,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "message": "Tạo hình ảnh ưu đãi thành công"
}
```

**Business Logic:**
1. Kiểm tra `offer_id` có tồn tại không
2. Nếu `is_primary = 1`:
   - Tìm tất cả ảnh khác của cùng `offer_id` có `is_primary = 1`
   - Set tất cả thành `is_primary = 0`
3. Nếu không chỉ định `is_primary` và đây là ảnh đầu tiên của ưu đãi:
   - Tự động set `is_primary = 1`
4. Tạo record mới trong `offer_images`
5. Nếu đặt làm ảnh chính (`is_primary = 1`):
   - Cập nhật `offers.image_url` = `image_url` mới

**Error Response (400):**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "offer_id": "Ưu đãi không tồn tại",
    "image_url": "URL hình ảnh không hợp lệ"
  }
}
```

**Implementation Example:**
```javascript
router.post('/offers/images', async (req, res) => {
  try {
    const { offer_id, image_url, is_primary = 0, display_order = 0 } = req.body;
    
    // Validation
    if (!offer_id || !image_url) {
      return res.status(400).json({
        success: false,
        message: 'offer_id và image_url là bắt buộc'
      });
    }
    
    // Kiểm tra offer có tồn tại không
    const offer = await db.query('SELECT id FROM offers WHERE id = ?', [offer_id]);
    if (!offer || offer.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Ưu đãi không tồn tại'
      });
    }
    
    // Kiểm tra xem đây có phải là ảnh đầu tiên không
    const existingImages = await db.query(
      'SELECT COUNT(*) as count FROM offer_images WHERE offer_id = ?',
      [offer_id]
    );
    const isFirstImage = existingImages[0].count === 0;
    
    // Nếu là ảnh đầu tiên và không chỉ định is_primary, tự động đặt làm ảnh chính
    let finalIsPrimary = is_primary;
    if (isFirstImage && is_primary === 0) {
      finalIsPrimary = 1;
    }
    
    // Nếu đặt làm ảnh chính, cập nhật tất cả ảnh khác
    if (finalIsPrimary === 1) {
      await db.query(
        'UPDATE offer_images SET is_primary = 0 WHERE offer_id = ?',
        [offer_id]
      );
    }
    
    // Tạo ảnh mới
    const result = await db.query(
      `INSERT INTO offer_images (offer_id, image_url, is_primary, display_order) 
       VALUES (?, ?, ?, ?)`,
      [offer_id, image_url, finalIsPrimary, display_order]
    );
    
    const imageId = result.insertId;
    
    // Nếu là ảnh chính, cập nhật offers.image_url
    if (finalIsPrimary === 1) {
      await db.query(
        'UPDATE offers SET image_url = ? WHERE id = ?',
        [image_url, offer_id]
      );
    }
    
    // Lấy ảnh vừa tạo
    const newImage = await db.query(
      'SELECT * FROM offer_images WHERE id = ?',
      [imageId]
    );
    
    res.json({
      success: true,
      data: newImage[0],
      message: 'Tạo hình ảnh ưu đãi thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});
```

---

### 2.3 PUT `/api/offers/images/:id` - Cập nhật ảnh

**Method:** `PUT`  
**URL:** `/api/offers/images/:id`  
**Path Parameters:**
- `id` (number, required): ID của ảnh

**Request Body:**
```json
{
  "image_url": "https://example.com/updated-image.jpg", // Optional
  "is_primary": 1, // Optional
  "display_order": 2 // Optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "offer_id": 1,
    "image_url": "https://example.com/updated-image.jpg",
    "is_primary": 1,
    "display_order": 2,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T01:00:00Z"
  },
  "message": "Cập nhật hình ảnh ưu đãi thành công"
}
```

**Business Logic:**
1. Kiểm tra ảnh có tồn tại không
2. Nếu `is_primary = 1`:
   - Tìm tất cả ảnh khác của cùng `offer_id` có `is_primary = 1`
   - Set tất cả thành `is_primary = 0`
   - Cập nhật `offers.image_url` = `image_url` mới (nếu có)
3. Cập nhật các trường được cung cấp

**Error Response (404):**
```json
{
  "success": false,
  "message": "Hình ảnh không tồn tại"
}
```

**Implementation Example:**
```javascript
router.put('/offers/images/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { image_url, is_primary, display_order } = req.body;
    
    // Kiểm tra ảnh có tồn tại không
    const image = await db.query('SELECT * FROM offer_images WHERE id = ?', [id]);
    if (!image || image.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Hình ảnh không tồn tại'
      });
    }
    
    const currentImage = image[0];
    const offer_id = currentImage.offer_id;
    
    // Nếu đặt làm ảnh chính
    if (is_primary === 1) {
      // Cập nhật tất cả ảnh khác thành ảnh phụ
      await db.query(
        'UPDATE offer_images SET is_primary = 0 WHERE offer_id = ? AND id != ?',
        [offer_id, id]
      );
      
      // Cập nhật offers.image_url
      const finalImageUrl = image_url || currentImage.image_url;
      await db.query(
        'UPDATE offers SET image_url = ? WHERE id = ?',
        [finalImageUrl, offer_id]
      );
    }
    
    // Cập nhật ảnh
    const updateFields = [];
    const updateValues = [];
    
    if (image_url !== undefined) {
      updateFields.push('image_url = ?');
      updateValues.push(image_url);
    }
    if (is_primary !== undefined) {
      updateFields.push('is_primary = ?');
      updateValues.push(is_primary);
    }
    if (display_order !== undefined) {
      updateFields.push('display_order = ?');
      updateValues.push(display_order);
    }
    
    if (updateFields.length > 0) {
      updateValues.push(id);
      await db.query(
        `UPDATE offer_images SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
    }
    
    // Lấy ảnh đã cập nhật
    const updatedImage = await db.query('SELECT * FROM offer_images WHERE id = ?', [id]);
    
    res.json({
      success: true,
      data: updatedImage[0],
      message: 'Cập nhật hình ảnh ưu đãi thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});
```

---

### 2.4 DELETE `/api/offers/images/:id` - Xóa ảnh

**Method:** `DELETE`  
**URL:** `/api/offers/images/:id`  
**Path Parameters:**
- `id` (number, required): ID của ảnh

**Response:**
```json
{
  "success": true,
  "message": "Xóa hình ảnh ưu đãi thành công"
}
```

**Business Logic:**
1. Kiểm tra ảnh có tồn tại không
2. Kiểm tra ảnh có phải là ảnh chính không (`is_primary = 1`)
3. Xóa ảnh
4. Nếu xóa ảnh chính:
   - Tìm ảnh đầu tiên còn lại (theo `display_order`, `created_at`)
   - Nếu có, đặt làm ảnh chính và cập nhật `offers.image_url`
   - Nếu không có, set `offers.image_url` = `null`

**Error Response (404):**
```json
{
  "success": false,
  "message": "Hình ảnh không tồn tại"
}
```

**Implementation Example:**
```javascript
router.delete('/offers/images/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Kiểm tra ảnh có tồn tại không
    const image = await db.query('SELECT * FROM offer_images WHERE id = ?', [id]);
    if (!image || image.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Hình ảnh không tồn tại'
      });
    }
    
    const currentImage = image[0];
    const offer_id = currentImage.offer_id;
    const isPrimary = currentImage.is_primary === 1;
    
    // Xóa ảnh
    await db.query('DELETE FROM offer_images WHERE id = ?', [id]);
    
    // Nếu xóa ảnh chính
    if (isPrimary) {
      // Tìm ảnh đầu tiên còn lại
      const remainingImages = await db.query(
        `SELECT * FROM offer_images 
         WHERE offer_id = ? 
         ORDER BY display_order ASC, created_at ASC 
         LIMIT 1`,
        [offer_id]
      );
      
      if (remainingImages.length > 0) {
        // Đặt ảnh đầu tiên làm ảnh chính
        const newPrimaryImage = remainingImages[0];
        await db.query(
          'UPDATE offer_images SET is_primary = 1 WHERE id = ?',
          [newPrimaryImage.id]
        );
        
        // Cập nhật offers.image_url
        await db.query(
          'UPDATE offers SET image_url = ? WHERE id = ?',
          [newPrimaryImage.image_url, offer_id]
        );
      } else {
        // Không còn ảnh nào, xóa image_url
        await db.query(
          'UPDATE offers SET image_url = NULL WHERE id = ?',
          [offer_id]
        );
      }
    }
    
    res.json({
      success: true,
      message: 'Xóa hình ảnh ưu đãi thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});
```

---

## 3. Image Upload Endpoint (Cần cập nhật)

### 3.1 POST `/api/offers/admin/:id/upload-image` - Upload file ảnh

**Method:** `POST`  
**URL:** `/api/offers/admin/:id/upload-image`  
**Path Parameters:**
- `id` (number, required): ID của ưu đãi

**Content-Type:** `multipart/form-data`

**Form Data:**
- `image` (file, required): File ảnh cần upload

**Response:**
```json
{
  "success": true,
  "data": {
    "image_url": "http://localhost:5000/uploads/offer-1-image-1234567890.jpg",
    "image_id": 3
  },
  "message": "Tải hình ảnh ưu đãi thành công"
}
```

**Business Logic:**
1. Kiểm tra offer có tồn tại không
2. Upload file lên server (lưu vào thư mục `uploads/`)
3. Tạo record trong `offer_images`:
   - Nếu đây là ảnh đầu tiên, set `is_primary = 1`
   - Nếu không, set `is_primary = 0`
4. Nếu là ảnh chính, cập nhật `offers.image_url`
5. Trả về `image_url` và `image_id`

**Error Response (400):**
```json
{
  "success": false,
  "message": "File không hợp lệ hoặc ưu đãi không tồn tại"
}
```

**Implementation Example:**
```javascript
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `offer-${req.params.id}-image-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Chỉ cho phép upload file ảnh (jpeg, jpg, png, gif, webp)'));
    }
  }
});

router.post('/offers/admin/:id/upload-image', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn file ảnh'
      });
    }
    
    // Kiểm tra offer có tồn tại không
    const offer = await db.query('SELECT id FROM offers WHERE id = ?', [id]);
    if (!offer || offer.length === 0) {
      // Xóa file đã upload
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Ưu đãi không tồn tại'
      });
    }
    
    const imageUrl = `${req.protocol}://${req.get('host')}/${req.file.path}`;
    
    // Kiểm tra xem đây có phải là ảnh đầu tiên không
    const existingImages = await db.query(
      'SELECT COUNT(*) as count FROM offer_images WHERE offer_id = ?',
      [id]
    );
    const isFirstImage = existingImages[0].count === 0;
    const isPrimary = isFirstImage ? 1 : 0;
    
    // Nếu đặt làm ảnh chính, cập nhật tất cả ảnh khác
    if (isPrimary === 1) {
      await db.query(
        'UPDATE offer_images SET is_primary = 0 WHERE offer_id = ?',
        [id]
      );
    }
    
    // Tạo record trong offer_images
    const result = await db.query(
      `INSERT INTO offer_images (offer_id, image_url, is_primary, display_order) 
       VALUES (?, ?, ?, ?)`,
      [id, imageUrl, isPrimary, 0]
    );
    
    const imageId = result.insertId;
    
    // Nếu là ảnh chính, cập nhật offers.image_url
    if (isPrimary === 1) {
      await db.query(
        'UPDATE offers SET image_url = ? WHERE id = ?',
        [imageUrl, id]
      );
    }
    
    res.json({
      success: true,
      data: {
        image_url: imageUrl,
        image_id: imageId
      },
      message: 'Tải hình ảnh ưu đãi thành công'
    });
  } catch (error) {
    // Xóa file nếu có lỗi
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});
```

---

## 4. Tóm tắt Endpoints Cần Implement

### ✅ Đã có (cần cập nhật để hỗ trợ content và images):
- `GET /api/offers`
- `GET /api/offers/:id`
- `POST /api/offers/admin`
- `PUT /api/offers/admin/:id`
- `DELETE /api/offers/admin/:id`
- `POST /api/offers/admin/:id/upload-image` (cần cập nhật để tạo record trong offer_images)

### ⚠️ CHƯA CÓ - CẦN IMPLEMENT NGAY:
1. **`GET /api/offers/:offerId/images`** - Lấy tất cả ảnh
2. **`POST /api/offers/images`** - Tạo ảnh mới
3. **`PUT /api/offers/images/:id`** - Cập nhật ảnh
4. **`DELETE /api/offers/images/:id`** - Xóa ảnh

---

## 5. Database Schema

### 5.1 Bảng `offers` (cần thêm cột `content`)
```sql
ALTER TABLE offers 
ADD COLUMN content TEXT NULL COMMENT 'Nội dung chi tiết của ưu đãi';
```

### 5.2 Bảng `offer_images` (cần tạo mới)
```sql
CREATE TABLE offer_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    offer_id INT NOT NULL,
    image_url VARCHAR(500) NOT NULL COMMENT 'URL của hình ảnh',
    is_primary TINYINT(1) DEFAULT 0 COMMENT '1 nếu là ảnh chính, 0 nếu không',
    display_order INT DEFAULT 0 COMMENT 'Thứ tự hiển thị',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE,
    INDEX idx_offer_id (offer_id),
    INDEX idx_is_primary (is_primary),
    INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng lưu hình ảnh của ưu đãi';
```

---

## 6. Testing Checklist

Sau khi implement, cần test các trường hợp sau:

### 6.1 Test GET `/api/offers/:offerId/images`
- [ ] Lấy ảnh của ưu đãi có ảnh
- [ ] Lấy ảnh của ưu đãi không có ảnh (trả về mảng rỗng)
- [ ] Lấy ảnh của ưu đãi không tồn tại (404)

### 6.2 Test POST `/api/offers/images`
- [ ] Tạo ảnh đầu tiên (tự động đặt làm ảnh chính)
- [ ] Tạo ảnh phụ
- [ ] Tạo ảnh và đặt làm ảnh chính (ảnh chính cũ tự động thành ảnh phụ)
- [ ] Tạo ảnh với offer_id không tồn tại (400)
- [ ] Tạo ảnh với image_url không hợp lệ (400)

### 6.3 Test PUT `/api/offers/images/:id`
- [ ] Cập nhật image_url
- [ ] Đặt làm ảnh chính (ảnh chính cũ tự động thành ảnh phụ)
- [ ] Cập nhật display_order
- [ ] Cập nhật ảnh không tồn tại (404)

### 6.4 Test DELETE `/api/offers/images/:id`
- [ ] Xóa ảnh phụ
- [ ] Xóa ảnh chính (còn ảnh khác → ảnh đầu tiên tự động thành ảnh chính)
- [ ] Xóa ảnh chính (không còn ảnh nào → offers.image_url = null)
- [ ] Xóa ảnh không tồn tại (404)

---

## 7. Lưu ý Quan trọng

1. **Ảnh chính:** Mỗi ưu đãi chỉ có thể có 1 ảnh chính (`is_primary = 1`)
2. **Tự động cập nhật:** Khi đặt ảnh mới làm ảnh chính, ảnh chính cũ tự động thành ảnh phụ
3. **Xóa ảnh chính:** Nếu xóa ảnh chính và còn ảnh khác, ảnh đầu tiên tự động trở thành ảnh chính
4. **Backward compatibility:** `offers.image_url` phải luôn sync với ảnh chính
5. **CASCADE DELETE:** Xóa ưu đãi sẽ tự động xóa tất cả ảnh liên quan

---

**Tài liệu này cung cấp đầy đủ thông tin để backend implement các API endpoints cần thiết.**


