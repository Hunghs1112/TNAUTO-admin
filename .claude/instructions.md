# Quy tắc làm việc với mã nguồn (chi tiết)

## 1) Nguyên tắc chung

- Ưu tiên sửa đúng nguyên nhân gốc (root cause), tránh workaround tạm thời.
- Không mở rộng phạm vi thay đổi ngoài yêu cầu nếu chưa thống nhất.
- Mỗi PR/commit nên có mục tiêu rõ ràng, tránh “trộn nhiều việc”.
- Ưu tiên giải pháp đơn giản, dễ bảo trì hơn giải pháp phức tạp.
- Giữ coding style nhất quán với codebase hiện có.

## 2) Chuẩn React + Vite

- Dùng **function component** và hooks.
- Tránh logic quá lớn trong 1 component; tách theo vai trò:
  - `ui component` (render)
  - `container/page` (điều phối dữ liệu)
  - `hooks/services` (logic dùng lại)
- Không tạo side-effect trong quá trình render.
- `useEffect` phải có dependency rõ ràng, tránh thiếu/thừa gây bug.
- Ưu tiên memoization (`useMemo`, `useCallback`) khi có vấn đề hiệu năng thực tế.

## 3) Cấu trúc thư mục và file

- Component dùng chung đặt ở khu vực `components`/`shared`.
- Logic gọi API đặt ở `services` hoặc module tương đương.
- Tiện ích chung đặt ở `utils`.
- Hằng số dùng chung đặt ở `constants`.
- Nếu một component quá dài (> ~200 dòng hoặc quá nhiều trách nhiệm), tách nhỏ.

## 4) Quy tắc đặt tên

- Component: `PascalCase` (ví dụ: `UserTable.jsx`).
- Biến/hàm: `camelCase`.
- Hằng số toàn cục: `UPPER_SNAKE_CASE`.
- Tên boolean nên bắt đầu bằng `is/has/can` (ví dụ: `isLoading`, `hasPermission`).
- Tên hàm theo hành động rõ nghĩa (ví dụ: `fetchUsers`, `handleSubmitForm`).

## 5) UI/UX chung

- Giao diện phải nhất quán spacing, typography, màu sắc và trạng thái component.
- Mọi màn hình có data đều cần đủ trạng thái:
  - loading
  - empty
  - error
  - success
- Hành động nguy hiểm (xóa/reset/hủy) bắt buộc có xác nhận.
- Form phải có validate rõ ràng và hiển thị lỗi tại vị trí người dùng dễ thấy.
- Thông báo lỗi dùng ngôn ngữ thân thiện, tránh kỹ thuật quá mức.

## 6) Quy tắc Theme giao diện (bắt buộc)

> Chi tiết đầy đủ tại `theme.md`. Các nguyên tắc dưới đây luôn phải tuân thủ.

- **Không hard-code màu trực tiếp trong component** (ví dụ `text-[#123456]`) trừ trường hợp đặc biệt đã thống nhất.
- Ưu tiên dùng design token/theme token cho:
  - màu nền
  - màu chữ
  - màu viền
  - màu trạng thái (success/warning/error/info)
- Component phải hỗ trợ tốt cả chế độ sáng/tối nếu dự án có dark mode.
- Đảm bảo tương phản màu đủ đọc (đặc biệt text nhỏ, placeholder, disabled).
- Hover/focus/active/disabled phải nhất quán toàn hệ thống.
- Không tự ý thay đổi “brand color” ở từng màn hình.
- Icon và text trong cùng ngữ cảnh phải cùng cấp độ nhấn mạnh (visual hierarchy).

## 7) Dữ liệu và API

- Tách phần gọi API khỏi phần render khi có thể.
- Bọc request bằng `try/catch`, xử lý lỗi có thông điệp rõ.
- Không hard-code dữ liệu nhạy cảm trong code.
- Validate input trước khi gửi request.
- Chuẩn hóa xử lý lỗi API (HTTP code, message, fallback).

## 8) Error handling và logging

- Không nuốt lỗi (silent fail) nếu lỗi ảnh hưởng luồng nghiệp vụ.
- Log phục vụ debug phải đủ ngữ cảnh, không lộ dữ liệu nhạy cảm.
- Với lỗi có thể phục hồi, hiển thị hướng dẫn thao tác tiếp theo cho user.

## 9) Hiệu năng

- Tránh re-render không cần thiết do truyền props/object/function mới liên tục.
- Danh sách lớn cần cân nhắc phân trang/virtualized list.
- Không fetch trùng lặp dữ liệu nếu đã có cache hợp lý.
- Lazy-load cho route hoặc module nặng khi phù hợp.

## 10) Accessibility (a11y)

- Input phải có label rõ ràng.
- Nút/icon button phải có tên truy cập phù hợp (`aria-label` nếu cần).
- Hỗ trợ điều hướng bằng bàn phím cho thao tác chính.
- Focus state phải nhìn thấy rõ.

## 11) Chất lượng mã

- Chạy lint trước khi bàn giao.
- Không để warning/error có thể tránh trong phần mới sửa.
- Refactor nhỏ, an toàn, dễ review.
- Tránh dead code và import không dùng.

## 12) Quy tắc Git

- Commit message ngắn gọn, mô tả đúng mục tiêu thay đổi.
- Không commit file bí mật (`.env`, key, token...).
- Với thay đổi lớn, chia commit hợp lý theo từng nhóm logic.
- PR nên có mô tả: bối cảnh, thay đổi chính, cách test.
