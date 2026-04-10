# Backend Overview — TNAUTO Admin

Tài liệu mô tả nhanh kiến trúc backend mà frontend `tnauto-admin` đang tích hợp.

## 1) Tổng quan

Backend cung cấp API phục vụ trang quản trị gara theo mô hình **multi-garage**.

- Base API (mặc định FE): `http://103.200.20.253:5000/api`
- Root API: `http://103.200.20.253:5000`
- Health endpoint đang hoạt động ở: `GET /health` (root)

> Lưu ý: `GET /api/health` hiện trả `404`.

## 2) Cơ chế xác thực & phạm vi dữ liệu

### Đăng nhập gara

- Endpoint: `POST /api/auth/garage/login`
- FE gửi: `garage_code`, `password`
- Backend trả về token + thông tin gara + thời hạn phiên.

### Scope dữ liệu theo gara

Luồng hiện tại ưu tiên backend suy ra gara từ token.

- Frontend **không nên** gửi `garage_id`/`garage_code` tự động cho mọi request admin.
- Chỉ gửi query scope khi endpoint yêu cầu rõ ràng.
- Khi token hết hạn hoặc sai: backend trả `401`.

## 3) Chuẩn phản hồi API

Backend có thể trả một trong hai dạng dữ liệu:

### Dạng chuẩn có `success`

```json
{
  "success": true,
  "data": [],
  "total": 100,
  "page": 1,
  "limit": 10,
  "totalPages": 10,
  "pagination": {
    "currentPage": 1,
    "pageSize": 10,
    "totalItems": 100,
    "totalPages": 10
  }
}
```

### Dạng trực tiếp (raw payload)

```json
{
  "data": []
}
```

Frontend đã normalize để đọc được cả 2 dạng.

## 4) Danh sách module API chính

Các nhóm endpoint FE đang gọi (từ `src/services/api.js`):

- Auth gara
- Dealers
- Customers
- Employees
- Services
- Products
- Categories / Service Categories / Dealer Categories
- Vehicles
- Service Orders
- Offers
- Warranties
- Upload ảnh
- Notifications / Push Notifications / FCM tokens
- Service Reminder Configs
- System (`/health`, `/api-docs`)

## 5) Quy ước lỗi

Frontend ưu tiên đọc thông điệp theo thứ tự:

1. `response.data.error`
2. `response.data.message`
3. `error.message`
4. fallback: `Có lỗi xảy ra`

Trường hợp hay gặp:

- `401`: token không hợp lệ/hết hạn
- `400`: thiếu params hoặc validate fail
- `404`: endpoint không tồn tại hoặc không có dữ liệu
- `500`: lỗi nội bộ server

## 6) Khuyến nghị cho backend để tích hợp ổn định

1. Giữ nhất quán response schema cho list endpoint (`data`, `total`, `page`, `limit`, `totalPages`).
2. Luôn trả message lỗi rõ ràng cho các lỗi 4xx.
3. Không yêu cầu FE gửi `garage_id` nếu backend đã suy từ token.
4. Duy trì `GET /health` ổn định để FE/devops check nhanh.
5. Có tài liệu endpoint chính thức (OpenAPI/Swagger) cho admin API.

## 7) Checklist khi backend thay đổi

- [ ] Endpoint có đổi path không?
- [ ] Có đổi field response hoặc paging meta không?
- [ ] Có đổi cơ chế auth/scope theo gara không?
- [ ] Có thêm validation mới ở request body/query không?
- [ ] Đã thông báo FE cập nhật mapping chưa?

---

## Ghi chú cập nhật

- Ngày cập nhật: 2026-04-09
- Nguồn tham chiếu: `src/services/api.js`, kết quả check endpoint thực tế từ local.
