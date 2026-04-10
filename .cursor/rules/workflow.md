# Workflow Rule

## Luồng thực hiện task

1. Đọc yêu cầu và xác định phạm vi.
2. Đọc bối cảnh (`memory.md`, `CLAUDE.md`).
3. Nếu task UI: đọc thêm `rules/design.md`.
4. Đề xuất kế hoạch ngắn (nếu task > 1 bước).
5. Triển khai thay đổi tối thiểu để đạt mục tiêu.
6. Tự kiểm tra lỗi lint/build phần liên quan.
7. Báo cáo rõ: đã làm gì, file nào đổi, còn gì cần follow-up.

## Tiêu chí hoàn thành

- Đúng yêu cầu.
- Không phá vỡ hành vi cũ.
- Không sinh lỗi lint mới ở phần vừa sửa.
