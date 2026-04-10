# Cấu hình AI cho dự án (`.claude`)

Thư mục này giúp AI hiểu đúng bối cảnh dự án `tnauto-admin`, tuân thủ chuẩn code và giao diện thống nhất khi hỗ trợ team.

## Các tệp trong thư mục

- `instructions.md`: Quy tắc coding chi tiết và nguyên tắc làm việc.
- `context.md`: Bối cảnh business/domain của dự án.
- `checklist.md`: Checklist trước khi tạo PR hoặc commit.
- `theme.md`: Quy chuẩn theme giao diện (token, states, light/dark, accessibility).

## Cách dùng nhanh

1. Cập nhật `context.md` khi nghiệp vụ thay đổi.
2. Cập nhật `instructions.md` khi team đổi convention kỹ thuật.
3. Cập nhật `theme.md` khi có thay đổi design system/theme.
4. Trước khi merge, đi qua `checklist.md` + mục checklist trong `theme.md`.

## Ưu tiên khi có xung đột quy tắc

1. Codebase hiện tại (thực tế đang chạy ổn định)
2. Quy định team thống nhất gần nhất
3. Tài liệu trong `.claude`

## Gợi ý duy trì

- Viết ngắn gọn, rõ ràng, ưu tiên ví dụ thực tế.
- Chỉ giữ các quy tắc còn hiệu lực.
- Nếu có module mới, bổ sung ngay vào `context.md` và checklist tương ứng.
