# Tech Defaults Rule

## 1) React component

- Ưu tiên function component + hooks.
- Component lớn tách thành phần nhỏ theo trách nhiệm.
- Logic dùng lại đưa vào custom hook.

## 2) State management

- State cục bộ đặt gần nơi sử dụng.
- Tránh prop drilling sâu; cân nhắc context/store khi cần.
- Dữ liệu dẫn xuất nên dùng selector/memoization.

## 3) API & async

- Tách layer gọi API khỏi UI khi có thể.
- Chuẩn hóa xử lý loading/error/success.
- Không swallow lỗi; luôn có log hoặc message phù hợp.

## 4) Routing

- Route có guard phải thể hiện rõ ràng.
- Không để điều hướng vòng lặp khó truy vết.

## 5) Chất lượng mã

- Ưu tiên readability trước micro-optimization.
- Giữ hàm ngắn, tên rõ nghĩa.
- Tránh duplicate logic; refactor khi lặp từ lần thứ 2.

## 6) Hiệu năng

- Chỉ memo khi có lý do cụ thể.
- Tránh re-render không cần thiết ở list lớn.
- Cân nhắc lazy-load route/component nặng.
