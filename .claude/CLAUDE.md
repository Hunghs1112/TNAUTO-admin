# TNAUTO Backend Context

## Project Overview
- Backend API for TN Auto ecosystem (garage, customer, vehicle, service order, product, notification).
- Stack: Node.js (CommonJS), Express 5, MySQL (`mysql2`), Firebase Admin (push notification), BullMQ + Redis (queue/worker), Swagger.
- Entry point: `src/index.js`.
- App bootstrap: `src/app.js`.

## Runtime & Key Flows
- API server starts at `PORT` (default `5000`), binds `0.0.0.0`.
- Health endpoint: `GET /health`.
- API docs: `/api-docs`.
- Background jobs started in `src/index.js`:
  - `tokenRefreshJob`
  - `tokenCleanupJob`
  - `warrantyReminderJob`
  - `serviceReminderJob`
  - `documentReminderJob`
- Job execution is gated by `RUN_JOBS` and `NODE_APP_INSTANCE` to avoid duplicate cron workload in cluster mode.

## API Organization
- Routes live in `src/routes/*`.
- Controllers live in `src/controllers/*`.
- Services live in `src/services/*`.
- Utilities live in `src/utils/*`.
- Middleware in `src/middleware/*`.

## Existing Infra/Behavior
- Rate limit for `/api/*` and stricter limit for `/api/auth/*`.
- Cache middleware is used on selected read-heavy endpoints.
- Global error handler: `src/utils/errorHandler.js`.
- Optional auth context middleware attached globally.

## Dev Commands
- `npm run dev` — start API with nodemon.
- `npm start` — start API.
- `npm run worker:dev` — run notification worker with nodemon.
- `npm run worker:start` — run notification worker.

## Coding Conventions for This Repo
- Keep CommonJS (`require/module.exports`) style consistent.
- Add new business logic in service layer; keep controller thin.
- Return consistent JSON shape (`success`, `error`, `data` where appropriate).
- Reuse shared helpers for pagination/search/time/date.
- Put auth/role checks in middleware layer where possible.

## Agent Delegation Guide
Use subagents in `.cursor/agents/` for focused tasks:
1. `api-architect` — endpoint design/refactor
2. `bug-hunter` — debugging and root cause analysis
3. `job-queue-specialist` — BullMQ/cron/worker reliability
4. `sql-performance` — MySQL query/index/performance tuning

## Important Notes
- Do not commit secrets from `.env` or service account credentials.
- Be careful when touching queue/job logic to avoid duplicate notifications.
- Preserve backward compatibility for mobile clients consuming current APIs.
