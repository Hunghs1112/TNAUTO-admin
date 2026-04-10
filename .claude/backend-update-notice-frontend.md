# Backend Update Notice cho Frontend

## Mục tiêu
Đồng bộ contract FE-BE để tránh thiếu dữ liệu do tham số phân trang/giới hạn gửi từ frontend.

---

## Thay đổi quan trọng (breaking behavior)
Từ backend version hiện tại:

- Backend **không còn nhận `limit` từ query/client** ở các list endpoint đã chuẩn hoá.
- Backend vẫn phân trang, nhưng dùng **page size cố định theo từng endpoint**.
- Frontend chỉ nên điều khiển:
  - `page` (nếu endpoint dùng page-based pagination)
  - `offset` (nếu endpoint dùng offset-based pagination)

> Nếu frontend vẫn gửi `limit`, backend sẽ **bỏ qua**.

---

## Endpoint groups đã áp dụng

### 1) Page-based (dùng `page`, bỏ `limit`)
- Service Orders: page size cố định `50`
- Customers: page size cố định `50`
- Dealers: page size cố định `50`
- Employees: page size cố định `50`
- Available orders for employee claim: page size cố định `50`
- Vehicles: page size cố định `50`
- Product reviews: page size cố định `20`

### 2) Offset-based (dùng `offset`, bỏ `limit`)
- Notifications (user): page size cố định `20`
- Notifications (admin): page size cố định `50`
- Admin notification log: page size cố định `50`

---

## Việc frontend cần cập nhật

1. **Ngừng gửi `limit`** trong tất cả request list đã nêu ở trên.
2. Với endpoint page-based:
   - chỉ gửi `page` + các filter nghiệp vụ (status, search, date...).
3. Với endpoint offset-based:
   - chỉ gửi `offset` + các filter nghiệp vụ.
4. UI pagination:
   - lấy `total`, `totalPages`, `pagination` từ response backend để render.

---

## Ví dụ request mới

### Service Orders (page-based)
`GET /api/service-orders?page=1&status=completed`

### Customers (page-based)
`GET /api/customers?page=2&search=0909`

### Notifications user (offset-based)
`GET /api/notifications?offset=20&is_read=false`

### Admin notification log (offset-based)
`GET /api/admin/notifications?offset=100&date_from=2026-04-01&date_to=2026-04-30`

---

## Ghi chú thêm về scope gara
- Backend hiện ưu tiên scope gara từ token đăng nhập.
- Frontend không nên tự động append `garage_id/garage_code` cho các endpoint list chuẩn, trừ khi endpoint đặc biệt yêu cầu rõ.

---

## Kỳ vọng sau khi FE cập nhật
- Không còn hiện tượng hiểu nhầm “mất dữ liệu” do tham số phân trang không đồng bộ.
- Dữ liệu hiển thị ổn định theo contract mới FE-BE.
- Giảm rủi ro request lỗi khi gửi query param không còn hiệu lực.
