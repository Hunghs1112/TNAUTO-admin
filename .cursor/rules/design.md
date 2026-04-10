# Design Rule — Quy tắc Theme & UI

## 1) Nguyên tắc theme

- Dùng **semantic token** thay vì màu hard-code trong component.
- Mọi màu phải có cặp light/dark tương ứng.
- Ưu tiên consistency hơn “đẹp cục bộ”.

## 2) Semantic token bắt buộc

- `bg.canvas`, `bg.surface`, `bg.elevated`
- `text.primary`, `text.secondary`, `text.muted`, `text.inverse`
- `border.default`, `border.strong`, `border.focus`
- `action.primary.*`, `action.secondary.*`
- `state.success.*`, `state.warning.*`, `state.error.*`, `state.info.*`

> Mỗi token nên có các biến thể: `default`, `hover`, `active`, `disabled` (khi cần).

## 3) Trạng thái UI bắt buộc

Mọi component tương tác (button, input, tab, item clickable) cần đủ:

- `default`
- `hover`
- `active`
- `focus-visible` (có ring rõ ràng)
- `disabled`
- `loading` (nếu có call API)

## 4) Contrast & accessibility

- Text chính đạt tối thiểu WCAG AA (~4.5:1).
- Không dùng màu làm tín hiệu duy nhất (thêm icon/label).
- Focus ring phải nhìn thấy rõ ở cả light và dark mode.

## 5) Typography & spacing

- Font size dùng scale cố định (12/14/16/18/20/24/30...).
- Line-height tương ứng, ưu tiên dễ đọc.
- Spacing dùng bội số 4px (4/8/12/16/20/24/32...).
- Không đặt spacing tùy hứng, ưu tiên token/class utility đã chuẩn hóa.

## 6) Radius & shadow

- Radius theo cấp: `sm`, `md`, `lg`, `xl`.
- Shadow theo ngữ cảnh: card nhẹ, modal nổi bật hơn.
- Tránh lạm dụng shadow đậm gây “nặng” UI.

## 7) Quy tắc theo thành phần

### Button
- Primary: dùng `action.primary.*`
- Secondary: border rõ, nền trung tính
- Destructive: dùng `state.error.*`, có confirm khi hành động nguy hiểm

### Input/Form
- Border default nhẹ, focus ring rõ.
- Error state dùng token lỗi + helper text rõ nguyên nhân.
- Disabled state giảm tương phản vừa đủ nhưng vẫn đọc được.

### Table
- Header khác nền nhẹ để phân tầng.
- Hàng hover có phản hồi nhẹ.
- Trạng thái empty/loading/error rõ ràng, không để màn hình trống khó hiểu.

### Toast/Alert
- Mỗi loại dùng đúng token trạng thái (success/warning/error/info).
- Nội dung ngắn gọn: vấn đề + hành động đề xuất (nếu có).

## 8) Dark mode

- Không đảo màu “thô”; map bằng semantic token.
- Ưu tiên giảm chói: tránh nền #000 tuyệt đối nếu không cần.
- Kiểm tra các thành phần sau khi chuyển mode: card, modal, dropdown, tooltip, table.

## 9) Checklist review theme trước merge

- [ ] Không còn màu hard-code trong component mới/sửa.
- [ ] Đủ states cho component tương tác.
- [ ] Focus-visible rõ ràng.
- [ ] Text đủ tương phản.
- [ ] Light/dark đều hiển thị đúng.
- [ ] Trạng thái lỗi/rỗng/loading đầy đủ.
