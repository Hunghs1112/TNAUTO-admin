# Backend Spec: Multi-Garage RBAC Trên Cùng Web Admin

## 1) Mục tiêu
- Dùng **1 web admin hiện tại** cho 2 cấp quản trị:
  - `garage_admin`: quản trị dữ liệu gara của chính họ.
  - `super_admin`: quản trị nhiều gara, có thể chọn gara đang thao tác.
- Không tách web mới.
- Đảm bảo backend là lớp kiểm soát quyền chính (frontend chỉ hỗ trợ UX).

## 2) Thuật ngữ
- `tenant_garage_id`: gara gốc gắn với tài khoản trong hệ thống.
- `acting_garage_id`: gara mà user đang thao tác trong phiên hiện tại.
- `role`:
  - `garage_admin`
  - `super_admin`

## 3) Yêu cầu Auth/Login
## 3.1 Response login bắt buộc
```json
{
  "success": true,
  "token": "jwt",
  "expires_at": "2026-05-27T10:00:00.000Z",
  "data": {
    "id": 12,
    "name": "Garage A",
    "code": "GARAGE_A",
    "user_type": "garage_admin"
  }
}
```

## 3.2 Claims trong JWT (khuyến nghị)
```json
{
  "sub": "user_id",
  "role": "garage_admin|super_admin",
  "tenant_garage_id": 12,
  "permissions": ["customers.read", "customers.write"],
  "exp": 9999999999
}
```

## 4) Cơ chế chọn gara thao tác (cho super_admin)
## 4.1 Quy tắc
- `garage_admin`: `acting_garage_id` luôn = `tenant_garage_id`.
- `super_admin`: được phép chọn `acting_garage_id` trong danh sách gara được cấp quyền.

## 4.2 Cách truyền scope
- Chuẩn hóa 1 cách duy nhất (đề xuất): Header `X-Acting-Garage-Id`.
- Nếu thiếu header:
  - `garage_admin`: backend tự suy ra từ token.
  - `super_admin`: trả `400` (hoặc fallback theo policy đã thống nhất).

## 4.3 Validation bắt buộc
- Parse integer > 0.
- `super_admin` chỉ được dùng gara trong tập gara được phép.
- Không bao giờ tin `garage_id` trong body cho các API tenant-scope.

## 5) Ma trận phân quyền
| Nhóm API | garage_admin | super_admin |
|---|---|---|
| CRUD dữ liệu vận hành (customers, vehicles, orders, services, products...) | Chỉ gara của họ | Theo `acting_garage_id` |
| Quản lý danh sách gara | Không | Có |
| Gán quyền super_admin -> gara | Không | Có (hoặc role cao hơn) |
| Cấu hình hệ thống toàn cục | Không | Có (nếu được cấp) |

> Lưu ý: mọi query DB phải có điều kiện tenant theo scope đã resolve ở middleware.

## 6) Contract API đề xuất
## 6.1 Resolve scope endpoint (optional nhưng nên có)
`GET /web/auth/me`

Response:
```json
{
  "success": true,
  "data": {
    "user_id": 99,
    "role": "super_admin",
    "tenant_garage_id": 1,
    "allowed_garages": [
      { "id": 1, "name": "HQ" },
      { "id": 2, "name": "Garage B" }
    ]
  }
}
```

## 6.2 Danh sách gara cho dropdown
`GET /web/garages?manageable=true`
- `garage_admin`: trả về gara của chính họ (1 item).
- `super_admin`: trả danh sách gara được quản trị.

## 6.3 Ví dụ API tenant-scope
`GET /web/customers?page=1&limit=20`
- Middleware resolve `acting_garage_id`.
- Service layer luôn filter `garage_id = acting_garage_id`.

## 7) Middleware/Guard bắt buộc ở backend
## 7.1 `authGuard`
- Verify JWT.
- Gắn `req.user` gồm `role`, `tenant_garage_id`, `permissions`.

## 7.2 `scopeGuard`
- Resolve `acting_garage_id` từ header + role.
- Gắn `req.scope.acting_garage_id`.

## 7.3 `permissionGuard(permission)`
- Check permission theo endpoint/action.
- Trả `403` nếu thiếu quyền.

## 8) Quy tắc dữ liệu ghi (create/update/delete)
- Bỏ qua `garage_id` client gửi lên với API tenant-scope.
- Luôn ép `garage_id = req.scope.acting_garage_id` ở service/repository.
- Với record đã tồn tại: verify record thuộc đúng scope trước khi update/delete.

## 9) Audit log (rất nên làm ngay)
Mỗi thao tác CUD cần log:
- `actor_user_id`
- `actor_role`
- `acting_garage_id`
- `action` (create/update/delete/...)
- `entity_type`, `entity_id`
- `old_value` / `new_value` (nếu cần)
- `ip`, `user_agent`, `created_at`

## 10) Error format thống nhất
```json
{
  "success": false,
  "error": "Forbidden",
  "code": "RBAC_FORBIDDEN",
  "message": "Bạn không có quyền thao tác gara này"
}
```

Mã lỗi đề xuất:
- `AUTH_UNAUTHORIZED` (401)
- `RBAC_FORBIDDEN` (403)
- `SCOPE_INVALID_GARAGE` (400)
- `SCOPE_REQUIRED` (400)

## 11) Test cases tối thiểu
- `garage_admin` đọc dữ liệu gara khác => `403`.
- `garage_admin` gửi body có `garage_id` khác => backend vẫn ghi vào gara của họ.
- `super_admin` thiếu `X-Acting-Garage-Id` => lỗi đúng theo policy.
- `super_admin` dùng gara không thuộc `allowed_garages` => `403`.
- Update/Delete record không thuộc scope => `404` hoặc `403` (thống nhất một chuẩn).

## 12) Kế hoạch rollout an toàn
1. Thêm claim role vào login/JWT.
2. Thêm middleware resolve scope nhưng chưa bật cứng cho toàn bộ API (shadow mode + log).
3. Bật cứng dần theo nhóm API: read -> write -> delete.
4. Bật audit log cho CUD.
5. Cập nhật frontend gửi `X-Acting-Garage-Id` cho `super_admin`.

## 13) Quyết định cần chốt với backend trước khi code
- Header scope chuẩn là `X-Acting-Garage-Id` hay query param?
- Khi `super_admin` thiếu scope: reject hay default HQ?
- Endpoint nào là global, endpoint nào tenant-scope?
- Chuẩn phản hồi khi record ngoài scope: `403` hay `404`?

---
Tài liệu này là bản thống nhất để backend triển khai RBAC + multi-tenant ngay trên hệ thống hiện có, không cần dựng thêm web quản trị mới.
