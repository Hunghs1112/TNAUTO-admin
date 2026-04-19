# Miêu tả vấn đề lọc xe trong chi tiết khách hàng

## Bối cảnh
Khi mở chi tiết khách hàng ở trang Khách hàng, frontend đang gọi API lấy danh sách xe theo số điện thoại khách hàng, sau đó tự lọc tiếp theo `customer_id` hoặc `phone` để chỉ giữ lại xe thuộc về khách đó.

## Vấn đề hiện tại
Với một số khách cũ, đặc biệt dữ liệu trước khi chuẩn hóa, xe vẫn có trong CSDL nhưng không hiển thị ở màn hình chi tiết khách hàng.

## Nguyên nhân khả năng cao
Dữ liệu xe cũ có thể chưa đồng nhất theo các trường đang dùng để filter trên frontend:
- `customer_id`
- `phone` / `customer_phone`
- `customer.id` / `owner_id`

Ngoài ra, API `/web/vehicles` khi truyền `phone` có thể chỉ trả về một phần dữ liệu, hoặc dữ liệu cũ không còn khớp đúng theo số điện thoại hiện tại của khách.

## Yêu cầu backend cần kiểm tra và xác nhận
1. API lấy danh sách xe theo khách cần trả đúng toàn bộ xe thuộc khách đó, kể cả dữ liệu cũ.
2. Cần xác nhận cơ chế liên kết giữa khách và xe đang dựa trên trường nào là chuẩn:
   - `customer_id`
   - `phone`
   - hay một mapping khác
3. Nếu dữ liệu cũ chưa có `customer_id`, backend cần có cách truy xuất tương thích ngược để vẫn trả ra đúng xe.
4. Nếu API `/web/vehicles` không nên filter theo `phone`, cần cung cấp endpoint hoặc contract rõ ràng hơn để frontend lấy đúng xe của khách đang mở.

## Ghi chú cho frontend
Frontend sẽ giữ logic hiển thị theo contract backend sau khi backend xác nhận lại cách lấy xe đúng cho từng khách hàng.
