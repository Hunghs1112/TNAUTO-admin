# Quy chuẩn Theme giao diện cho `tnauto-admin`

Tài liệu này định nghĩa các quy tắc theme để đảm bảo UI nhất quán, dễ mở rộng và dễ bảo trì.

---

## 1) Nguyên tắc cốt lõi

- Dùng **design token** thay vì hard-code màu trực tiếp trong component.
- Tách rõ:
  - token nền tảng (màu, spacing, radius, shadow)
  - token semantic (primary, danger, success, surface, text-muted...)
- Một mục đích hiển thị chỉ dùng **một semantic token** thống nhất toàn hệ thống.
- Không “tự chế” màu theo từng màn hình nếu chưa có trong token.

---

## 2) Hệ token đề xuất

## 2.1. Core tokens

- `color.white`, `color.black`
- `color.gray.50 ... color.gray.900`
- `color.brand.50 ... color.brand.900`
- `color.green.*`, `color.yellow.*`, `color.red.*`, `color.blue.*`

## 2.2. Semantic tokens

- Nền:
  - `bg.page`
  - `bg.surface`
  - `bg.elevated`
- Chữ:
  - `text.primary`
  - `text.secondary`
  - `text.muted`
  - `text.inverse`
- Viền:
  - `border.default`
  - `border.strong`
  - `border.focus`
- Trạng thái:
  - `state.success`
  - `state.warning`
  - `state.error`
  - `state.info`
- Thao tác:
  - `action.primary`
  - `action.primaryHover`
  - `action.primaryActive`
  - `action.danger`

> Nếu chưa có hệ token trong codebase, cần tạo dần theo semantic trước, sau đó map vào màu thực tế.

---

## 3) Quy tắc Light/Dark mode

- Mọi semantic token phải có giá trị cho cả light và dark.
- Không đảo màu thủ công từng component; map qua token/theme provider.
- Dark mode ưu tiên:
  - giảm chói (không dùng nền đen tuyệt đối cho toàn trang trừ trường hợp đặc biệt)
  - tăng độ tương phản text/chỉ báo tương tác
- Modal, dropdown, tooltip phải kiểm tra lại độ nổi bật trong dark mode.

---

## 4) Typography

- Dùng thang typography thống nhất (ví dụ: `text-xs/sm/base/lg/xl...`).
- Không dùng quá nhiều cỡ chữ trong cùng một màn hình.
- Heading, subtitle, body, caption có vai trò rõ ràng.
- `font-weight` dùng tiết kiệm để tạo hierarchy:
  - tiêu đề: semibold/bold
  - nội dung: normal/medium

---

## 5) Spacing, radius, shadow

- Dùng spacing scale cố định (ví dụ bội số 4 hoặc 8).
- Không dùng giá trị spacing lẻ tùy ý trừ khi bắt buộc.
- Border radius nhất quán theo cấp component:
  - input/button/card/modal
- Shadow dùng theo cấp độ elevation, tránh lạm dụng.

---

## 6) Trạng thái component (states)

Mỗi component tương tác cần đủ states:

- `default`
- `hover`
- `active`
- `focus-visible`
- `disabled`
- `loading` (nếu có async action)

Quy tắc:

- `focus-visible` luôn rõ ràng (ring/outline đủ nổi bật).
- `disabled` phải nhìn ra là vô hiệu nhưng vẫn đọc được nội dung.
- `loading` không làm layout giật mạnh.

---

## 7) Quy tắc cho Button

- Phân loại rõ: `primary`, `secondary`, `ghost`, `danger`.
- Cùng một ngữ cảnh chỉ có **1 CTA chính** (primary).
- Không đặt nhiều nút cùng cấp độ nhấn mạnh gây nhiễu thị giác.
- Padding, chiều cao, radius của button phải thống nhất theo size (`sm`, `md`, `lg`).

---

## 8) Quy tắc cho Input/Form

- Input/select/textarea cùng style viền, nền, focus.
- Label và helper text theo một chuẩn typography.
- Error text dùng semantic color `state.error`.
- Khoảng cách giữa label-input-helper đồng nhất.

---

## 9) Quy tắc cho Bảng dữ liệu (table/list)

- Header, row, divider dùng token nhất quán.
- Zebra row (nếu có) phải tinh tế, không lấn át nội dung.
- Trạng thái selected/hover cần phân biệt rõ.
- Cột hành động nên có icon + tooltip khi cần.

---

## 10) Quy tắc cho Feedback UI

- Toast/alert/banner phân loại rõ theo mức độ:
  - info
  - success
  - warning
  - error
- Nội dung thông báo ngắn gọn, có hành động tiếp theo nếu cần.
- Không hiển thị lỗi kỹ thuật thô cho người dùng cuối.

---

## 11) Iconography

- Icon size thống nhất theo context (`16/20/24`).
- Icon trang trí có thể muted; icon hành động phải đủ tương phản.
- Không trộn nhiều style icon khác nhau trong cùng một màn hình.

---

## 12) Checklist review theme trước khi merge

- Có hard-code màu trực tiếp trong component không?
- Có đủ trạng thái hover/focus/disabled/loading chưa?
- Light mode và dark mode đã kiểm tra chưa?
- Contrast text trên nền đã ổn chưa?
- Nút primary có bị lạm dụng trên cùng màn hình không?
- Spacing/radius/shadow có lệch chuẩn hệ thống không?
- Trạng thái error/success đã dùng đúng semantic token chưa?
