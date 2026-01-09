# 后端修改说明 - Ưu đãi (Offers) 功能增强

## ⚠️ QUAN TRỌNG
**Xem tài liệu chi tiết API endpoints tại:** [`BACKEND_API_ENDPOINTS_OFFERS.md`](./BACKEND_API_ENDPOINTS_OFFERS.md)

Tài liệu đó chứa:
- Chi tiết đầy đủ tất cả API endpoints cần implement
- Code examples cho từng endpoint
- Validation rules và business logic
- Error handling
- Testing checklist

## 概述
需要在 Ưu đãi (Offers) 功能中添加以下内容：
1. **图片管理功能** - 支持多图片上传和管理（类似产品）
2. **优惠内容字段** - 添加描述/内容字段用于存储优惠详情

## ⚠️ CÁC API ENDPOINTS CHƯA CÓ - CẦN IMPLEMENT NGAY
Frontend đang gặp lỗi vì các endpoints sau chưa được implement:

1. **`GET /api/offers/:offerId/images`** - Lấy tất cả ảnh của ưu đãi
2. **`POST /api/offers/images`** - Tạo ảnh mới (⚠️ Đang báo lỗi "Route not found")
3. **`PUT /api/offers/images/:id`** - Cập nhật ảnh
4. **`DELETE /api/offers/images/:id`** - Xóa ảnh

**Xem chi tiết implementation tại:** [`BACKEND_API_ENDPOINTS_OFFERS.md`](./BACKEND_API_ENDPOINTS_OFFERS.md)

---

## 1. 数据库修改

### 1.1 添加 `content` 字段到 `offers` 表

在 `offers` 表中添加新字段：

```sql
ALTER TABLE offers 
ADD COLUMN content TEXT NULL COMMENT 'Nội dung chi tiết của ưu đãi';
```

**字段说明：**
- `content` (TEXT): 优惠的详细内容/描述
- 允许 NULL，因为现有数据可能没有内容
- 用于存储优惠的详细说明、条款、使用条件等

### 1.2 创建 `offer_images` 表

创建新表用于存储优惠的多个图片：

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

**表结构说明：**
- `id`: 主键
- `offer_id`: 外键关联到 `offers` 表
- `image_url`: 图片URL（支持完整URL或相对路径）
- `is_primary`: 是否为主图（1=是，0=否），每个优惠只能有一个主图
- `display_order`: 显示顺序，数字越小越靠前
- `created_at`, `updated_at`: 时间戳

**约束规则：**
- 每个优惠可以有多个图片
- 每个优惠只能有一个主图（is_primary=1）
- 删除优惠时，关联的图片也会被删除（CASCADE）

---

## 2. API 端点修改

### 2.1 更新 Offers CRUD API

#### GET `/api/offers` - 获取所有优惠
**响应格式保持不变，但需要包含：**
- `content` 字段（如果存在）
- `images` 数组（包含所有图片）
- `primary_image` 对象（主图信息）

**响应示例：**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Ưu đãi mùa hè",
      "service_id": 5,
      "content": "Giảm giá 20% cho tất cả dịch vụ...",
      "image_url": "https://example.com/image.jpg", // 主图URL（向后兼容）
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
  ]
}
```

#### GET `/api/offers/:id` - 获取单个优惠
**响应格式同上，返回单个对象**

#### POST `/api/offers/admin` - 创建优惠
**请求体：**
```json
{
  "name": "Ưu đãi mùa hè",
  "service_id": 5,
  "content": "Giảm giá 20% cho tất cả dịch vụ...",
  "image_url": "https://example.com/image.jpg" // 可选，向后兼容
}
```

**响应：** 返回创建的优惠对象（包含 images 数组）

#### PUT `/api/offers/admin/:id` - 更新优惠
**请求体：**
```json
{
  "name": "Ưu đãi mùa hè (cập nhật)",
  "service_id": 5,
  "content": "Giảm giá 25% cho tất cả dịch vụ...",
  "image_url": "https://example.com/new-image.jpg" // 可选，如果提供则更新主图
}
```

**注意：**
- 如果提供了 `image_url`，应该更新主图的 `image_url`
- 如果主图不存在，应该创建新的图片记录并设置为主图

### 2.2 新增 Offer Images API

#### GET `/api/offers/:offerId/images` - 获取优惠的所有图片
**响应格式：**
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
    }
  ]
}
```

#### POST `/api/offers/images` - 创建图片记录
**请求体：**
```json
{
  "offer_id": 1,
  "image_url": "https://example.com/new-image.jpg",
  "is_primary": 0, // 可选，默认0
  "display_order": 1 // 可选，默认0
}
```

**业务逻辑：**
- 如果 `is_primary` 为 1，需要将其他图片的 `is_primary` 设置为 0
- 如果这是第一张图片且没有指定 `is_primary`，自动设置为 1
- 如果设置了主图，同时更新 `offers.image_url` 字段（向后兼容）

**响应：** 返回创建的图片对象

#### PUT `/api/offers/images/:id` - 更新图片记录
**请求体：**
```json
{
  "image_url": "https://example.com/updated-image.jpg", // 可选
  "is_primary": 1, // 可选
  "display_order": 2 // 可选
}
```

**业务逻辑：**
- 如果设置 `is_primary` 为 1，需要将其他图片的 `is_primary` 设置为 0
- 如果更新为主图，同时更新 `offers.image_url` 字段

**响应：** 返回更新后的图片对象

#### DELETE `/api/offers/images/:id` - 删除图片
**业务逻辑：**
- 如果删除的是主图，且还有其他图片，自动将第一张图片设为主图
- 如果删除的是主图，且没有其他图片，将 `offers.image_url` 设置为 NULL
- 删除图片记录

**响应：**
```json
{
  "success": true,
  "message": "Xóa hình ảnh thành công"
}
```

### 2.3 更新图片上传端点

#### POST `/api/offers/admin/:id/upload-image` - 上传图片文件
**功能保持不变，但需要：**
- 上传后自动创建 `offer_images` 记录
- 如果是第一张图片，自动设置为主图
- 更新 `offers.image_url` 字段

**响应格式：**
```json
{
  "success": true,
  "data": {
    "image_url": "https://example.com/uploaded-image.jpg",
    "image_id": 1 // 新增：返回创建的图片记录ID
  }
}
```

---

## 3. 数据迁移建议

### 3.1 迁移现有数据

如果 `offers` 表中已有 `image_url` 数据，需要迁移到 `offer_images` 表：

```sql
-- 迁移现有图片到 offer_images 表
INSERT INTO offer_images (offer_id, image_url, is_primary, display_order)
SELECT 
    id as offer_id,
    image_url,
    1 as is_primary, -- 设置为主图
    0 as display_order
FROM offers
WHERE image_url IS NOT NULL AND image_url != '';
```

### 3.2 向后兼容

为了保持向后兼容：
- `offers.image_url` 字段保留
- 当有主图时，`image_url` 应该与主图的 `image_url` 同步
- API 响应中同时包含 `image_url` 和 `images` 数组

---

## 4. 验证和约束

### 4.1 数据验证

**创建/更新优惠时：**
- `name`: 必填，字符串，最大长度255
- `service_id`: 必填，整数，必须存在于 `services` 表
- `content`: 可选，文本，无长度限制
- `image_url`: 可选，字符串，最大长度500

**创建/更新图片时：**
- `offer_id`: 必填，整数，必须存在于 `offers` 表
- `image_url`: 必填，字符串，最大长度500，必须是有效的URL
- `is_primary`: 可选，0或1，默认0
- `display_order`: 可选，整数，默认0

### 4.2 业务规则

1. **主图规则：**
   - 每个优惠只能有一个主图（is_primary=1）
   - 设置新主图时，自动取消其他图片的主图状态
   - 删除主图时，如果有其他图片，自动设置第一张为主图

2. **图片顺序：**
   - 按 `display_order` 升序排列
   - 如果 `display_order` 相同，按 `created_at` 升序排列

3. **级联删除：**
   - 删除优惠时，自动删除所有关联的图片记录

---

## 5. API 端点总结

### Offers CRUD
- `GET /api/offers` - 获取所有优惠（包含 images）
- `GET /api/offers/:id` - 获取单个优惠（包含 images）
- `POST /api/offers/admin` - 创建优惠（支持 content）
- `PUT /api/offers/admin/:id` - 更新优惠（支持 content）
- `DELETE /api/offers/admin/:id` - 删除优惠（级联删除图片）

### Offer Images
- `GET /api/offers/:offerId/images` - 获取优惠的所有图片
- `POST /api/offers/images` - 创建图片记录
- `PUT /api/offers/images/:id` - 更新图片记录
- `DELETE /api/offers/images/:id` - 删除图片

### Image Upload
- `POST /api/offers/admin/:id/upload-image` - 上传图片文件（multipart/form-data）

---

## 6. 前端集成说明

前端将使用以下API：
1. **获取优惠列表/详情** - 使用现有的 GET 端点，响应中会包含 `images` 数组和 `content` 字段
2. **创建/更新优惠** - 使用现有的 POST/PUT 端点，可以发送 `content` 字段
3. **图片管理** - 使用新的 `/api/offers/images` 端点进行图片的增删改查
4. **图片上传** - 使用现有的 `/api/offers/admin/:id/upload-image` 端点

前端实现将类似于 `ProductDetailModal` 和 `ServiceDetailModal`，支持：
- 查看所有图片
- 添加新图片（上传文件或输入URL）
- 删除图片
- 设置主图
- 编辑优惠内容

---

## 7. 测试建议

### 7.1 单元测试
- 测试创建优惠时 `content` 字段的保存
- 测试图片的创建、更新、删除
- 测试主图的自动设置和更新逻辑
- 测试级联删除

### 7.2 集成测试
- 测试创建优惠后添加图片的完整流程
- 测试设置主图时其他图片状态的更新
- 测试删除主图时的自动处理
- 测试删除优惠时的图片级联删除

### 7.3 API 测试
- 测试所有新增端点的请求和响应格式
- 测试错误处理（无效的 offer_id、image_url 等）
- 测试数据验证和约束

---

## 8. 注意事项

1. **向后兼容性：**
   - 保持 `offers.image_url` 字段与主图同步
   - API 响应中包含 `image_url` 和 `images` 数组

2. **性能考虑：**
   - 获取优惠列表时，如果图片很多，考虑只返回主图
   - 或者提供查询参数控制是否包含图片数据

3. **图片存储：**
   - 确保图片URL的有效性验证
   - 考虑图片大小和格式限制

4. **错误处理：**
   - 提供清晰的错误消息
   - 处理图片URL无效的情况
   - 处理外键约束违反的情况

---

## 9. 完成后的检查清单

- [ ] 数据库迁移脚本已创建和执行
- [ ] `offers` 表已添加 `content` 字段
- [ ] `offer_images` 表已创建
- [ ] 所有API端点已实现
- [ ] 主图逻辑已实现
- [ ] 级联删除已实现
- [ ] 数据验证已添加
- [ ] 向后兼容性已确保
- [ ] API文档已更新
- [ ] 测试用例已编写和执行
- [ ] 现有数据已迁移（如果有）

---

**文档版本：** 1.0  
**创建日期：** 2024  
**最后更新：** 2024

