# Project Memory

## Domain
TN Auto backend phục vụ quản lý garage, khách hàng, xe, lệnh dịch vụ, sản phẩm, bảo hành, thông báo.

## Architecture Summary
- Express API theo module route/controller/service.
- MySQL làm nguồn dữ liệu chính.
- Redis + BullMQ cho queue/worker thông báo.
- Firebase Admin để push notification.
- Cron jobs chạy từ server process theo cờ môi trường.

## Critical Paths
- Auth flow: `src/routes/auth.js` + `src/controllers/authController.js`
- Service order flow: `src/routes/serviceOrder.js` + `src/controllers/serviceOrderController.js`
- Notification flow: route/controller/service + worker + queue utils
- Reminder jobs: `src/jobs/*`

## Guardrails
- Không thay đổi contract API nếu chưa có migration plan.
- Với endpoints nặng đọc, cân nhắc cache middleware.
- Với cron/job, tránh chạy trùng nhiều instance.
- Luôn sanitize input và xử lý lỗi nhất quán.

## Open Improvements (future)
- Bổ sung test tự động cho các luồng trọng yếu (auth/service-order/notification).
- Chuẩn hoá response schema across all controllers.
- Bổ sung observability cho queue latency và job failure rate.
