# CLAUDE.md — Bộ não dự án

Tài liệu trung tâm để AI hiểu cách làm việc trong dự án này.

## 1) Mục tiêu

- Ưu tiên tính đúng đắn của nghiệp vụ.
- Giao diện quản trị rõ ràng, nhất quán, thao tác nhanh.
- Thay đổi nhỏ, tập trung, dễ review.

## 2) Tech stack

- React + Vite
- React Router
- Axios
- Tailwind CSS

## 3) Luồng làm việc chuẩn

1. Đọc `memory.md` để nắm bối cảnh hiện tại.
2. Đọc `rules/tech-defaults.md` trước khi sửa code.
3. Nếu có thay đổi UI, bắt buộc đọc `rules/design.md`.
4. Với task lớn, lập kế hoạch ngắn rồi mới triển khai.
5. Trước khi bàn giao: tự kiểm tra checklist và lint.

## 4) Quy tắc bắt buộc

- Không hard-code màu/font/spacing trong component nếu đã có token.
- Không commit secrets (`.env`, key, token).
- Không sửa ngoài phạm vi khi chưa có lý do rõ ràng.
- Ưu tiên tái sử dụng component/hook.

## 5) Thứ tự ưu tiên khi mâu thuẫn

1. Codebase đang chạy ổn định
2. Rule trong `.claude/rules/*`
3. Mặc định của framework

## 6) Điều phối sub-agent

- Nghiên cứu/thu thập thông tin: dùng `researcher`.
- Soát chất lượng và rủi ro: dùng `reviewer`.
- Chỉ dùng sub-agent khi task có lợi từ chuyên môn hóa hoặc tách ngữ cảnh.
