# Checklist trước khi commit/PR

## 1) Chức năng

- [ ] Đúng yêu cầu bài toán.
- [ ] Không làm hỏng luồng cũ.
- [ ] Đã kiểm tra các trạng thái loading/empty/error.

## 2) Mã nguồn

- [ ] Không còn code thừa/debug log không cần thiết.
- [ ] Tên biến/hàm/component rõ ràng, nhất quán.
- [ ] Không hard-code dữ liệu nhạy cảm.

## 3) Chất lượng

- [ ] `npm run lint` chạy sạch hoặc không có lỗi mới.
- [ ] Đã tự test các luồng chính liên quan.
- [ ] Không có lỗi hiển thị rõ ràng trên UI.

## 4) Git

- [ ] Commit message mô tả đúng mục tiêu thay đổi.
- [ ] Không commit file bí mật (`.env`, token, key...).
- [ ] Scope thay đổi gọn, review được.
