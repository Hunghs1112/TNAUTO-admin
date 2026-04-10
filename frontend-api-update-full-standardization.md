# FE Update - API List Standardization (2026-04-09)

## Mục tiêu
Chuẩn hóa contract list API trên toàn backend để tránh lỗi thiếu dữ liệu do phân trang/filter không đồng nhất.

---

## 1) Thay đổi bắt buộc cho Frontend

### 1.1 Không gửi `limit` nữa
Backend đã chuẩn hóa page size cố định theo endpoint. FE **không cần** và **không nên** gửi `limit`.

### 1.2 Luôn gửi `page`
- Mặc định: `page=1`
- Khi đổi filter/search/date range: reset về `page=1`

### 1.3 Dùng date range chuẩn
Dùng query params:
- `from_date=YYYY-MM-DD`
- `to_date=YYYY-MM-DD`

Backend xử lý theo nguyên tắc:
- `created_at >= from_date 00:00:00`
- `created_at < to_date + 1 day`
=> không mất dữ liệu cuối ngày.

### 1.4 Scope gara
- Không tự append `garage_id/garage_code` ở FE cho các endpoint list theo auth.
- Scope gara lấy từ token đăng nhập.

---

## 2) Contract response list (chuẩn chung)

FE nên đọc theo các field sau:
- `data`
- `count`
- `total`
- `page`
- `limit` (page size do backend quyết định)
- `totalPages`
- `pagination`

Một số endpoint trả thêm `filters` để FE debug nhanh (status/search/date range).

---

## 3) Endpoint groups cần FE cập nhật cách gọi

## Nhóm Service Orders
- `GET /service-orders`

Khuyến nghị gọi:
- `page`
- `status` (nếu cần)
- `customer_phone` (nếu cần)
- `employee_id` (nếu cần)
- `from_date`, `to_date` (nếu màn hình lịch sử)

## Nhóm Employees
- `GET /employees`
- `GET /employees/orders/available` (endpoint danh sách đơn chờ nhận)

Khuyến nghị gọi:
- `page`
- `search` (nếu cần)
- `from_date`, `to_date` (khi xem dữ liệu theo khoảng thời gian)

## Nhóm Dealers
- `GET /dealers`

Khuyến nghị gọi:
- `page`
- `search`
- `from_date`, `to_date`

## Nhóm Customers
- `GET /customers`

Khuyến nghị gọi:
- `page`
- `search`
- `from_date`, `to_date`

## Nhóm Vehicles
- `GET /vehicles`

Khuyến nghị gọi:
- `page`
- `search`
- `customer_id` (nếu lọc theo khách)
- `from_date`, `to_date`

## Nhóm Notifications
- `GET /notifications`
- `GET /admin/notifications`

Khuyến nghị gọi:
- `page` hoặc `offset` theo endpoint hiện tại
- `from_date`, `to_date`
- các filter nghiệp vụ (`status`, `recipient_type`, ...)

## Nhóm Product/Service/Categories/Warranties/Offers
Các list endpoint thuộc nhóm này đã thống nhất theo hướng:
- Không nhận `limit` từ FE
- FE dùng `page` + filter nghiệp vụ
- Date range áp dụng cho màn hình lịch sử/timeline

---

## 4) Ví dụ request FE chuẩn

### Ví dụ 1: Service orders theo khoảng ngày
`GET /service-orders?page=1&from_date=2026-03-28&to_date=2026-04-07`

### Ví dụ 2: Danh sách khách hàng có search
`GET /customers?page=1&search=0986`

### Ví dụ 3: Danh sách nhân viên
`GET /employees?page=2&search=thanh`

---

## 5) Checklist FE cần làm

- [ ] Xóa toàn bộ logic gửi `limit` ở tầng API client
- [ ] Đảm bảo mọi màn list gửi `page`
- [ ] Bổ sung `from_date/to_date` cho màn có lọc thời gian
- [ ] Khi đổi filter/search/date -> reset page về 1
- [ ] Không gửi `garage_id/garage_code` mặc định
- [ ] Đọc metadata phân trang từ response backend

---

## 6) Lý do thay đổi

Sự cố thiếu dữ liệu giai đoạn 28/03 -> 07/04 xuất phát từ cách fetch list không đồng nhất (pagination/filter/scope), không phải mất dữ liệu DB.

Chuẩn hóa contract giúp:
- Tránh bỏ sót record do page đầu không đủ dữ liệu
- Tránh lệch dữ liệu do filter ngày/cuối ngày
- Giảm xung đột scope giữa FE và BE
