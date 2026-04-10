# Incident Report: Thiếu dữ liệu khi fetch (28/03 → 07/04)

## 1) Tóm tắt sự cố

Trong giao diện admin, dữ liệu hiển thị bị thiếu trong khoảng thời gian từ **2026-03-28 đến 2026-04-07**, mặc dù kiểm tra trực tiếp trong DB xác nhận dữ liệu vẫn tồn tại.

Sự cố xuất hiện ở tầng API integration giữa frontend và backend, không phải do DB bị mất record.

---

## 2) Triệu chứng quan sát được

- UI hiển thị danh sách không đầy đủ (thiếu bản ghi trong một dải thời gian).
- Người dùng có thể thấy DB có dữ liệu nhưng frontend không render tương ứng.
- Một số API trả lỗi `400` khi frontend gọi list endpoint.

---

## 3) Phạm vi ảnh hưởng

- Ảnh hưởng chủ yếu đến các màn hình list có cơ chế scope theo gara.
- Dữ liệu bị hiểu sai là “mất” trong giai đoạn 28/03–07/04, trong khi thực tế là lỗi truy vấn/điều kiện request.
- Không có bằng chứng mất dữ liệu vật lý trong DB.

---

## 4) Nguyên nhân gốc (Root cause)

Frontend trước đó có cơ chế **tự động đính kèm `garage_id` / `garage_code`** vào nhiều request.

Trong khi đó, backend theo luồng mới đã ưu tiên **suy scope gara từ token**. Việc tự đính thêm query param có thể làm request:

- bị validate fail (`400`), hoặc
- lọc sai phạm vi dữ liệu,

khiến dữ liệu trả về không đầy đủ so với DB.

Nói ngắn gọn: **scope bị “đúp” hoặc sai nguồn (token + query param)** dẫn đến kết quả fetch lệch.

---

## 5) Bằng chứng kỹ thuật

- Health backend hoạt động: `GET /health` trả `200`.
- Một số list endpoint kiểm tra nhanh trả `400` khi gọi theo cấu hình cũ.
- DB kiểm tra thủ công vẫn có record trong giai đoạn 28/03–07/04.

---

## 6) Biện pháp khắc phục đã áp dụng

Đã cập nhật frontend tại `src/services/api.js`:

- Thay đổi logic `appendGarageScope` để **không tự đính scope gara mặc định**.
- Chỉ đính scope khi request có chủ đích (`includeGarageScope = true`).
- Giữ luồng chuẩn: backend suy gara từ token đăng nhập.

Kết quả kỳ vọng sau fix:

- Fetch trả dữ liệu đúng theo gara đăng nhập.
- Không còn lỗi thiếu data do query scope tự động gây ra.

---

## 7) Hành động phòng ngừa tái diễn

1. Thống nhất contract FE-BE:
   - Nếu backend suy scope từ token, FE không tự gửi `garage_id` trừ endpoint đặc biệt.
2. Ghi rõ endpoint nào cần `garage_id/garage_code` bắt buộc.
3. Bổ sung test integration cho các mốc thời gian có dữ liệu lịch sử.
4. Log request params ở môi trường staging để phát hiện scope sai sớm.

---

## 8) Trạng thái hiện tại

- **Status**: Đã khắc phục phía frontend.
- **Theo dõi**: Tiếp tục monitor các màn hình list để xác nhận không còn lệch dữ liệu theo thời gian.

---

## 9) Metadata

- Ngày ghi nhận: 2026-04-09
- Khoảng dữ liệu bị ảnh hưởng: 2026-03-28 → 2026-04-07
- Thành phần liên quan: `src/services/api.js`, cơ chế auth/scope gara, list endpoints.
