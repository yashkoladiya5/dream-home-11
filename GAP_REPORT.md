# Dream11 Backend — Production Readiness Gap Report

**Generated:** 2026-07-07
**Codebase:** NestJS 11 + TypeORM + BullMQ + Socket.IO + PostgreSQL + Redis
**Baseline:** 38 modules, ~200 TS files, 108 endpoints, 31 entities (per STATUS.md)

---

## Summary Metrics

| Category | Count |
|---|---|
| Modules with **complete** structure (controller+service+module+entity+dto+tests) | 2 / 33 |
| Modules with **partial** structure (missing dto or tests) | 27 / 33 |
| Modules with **minimal** structure (service only, no controller) | 4 / 33 |
| Modules **missing entirely** from requirement doc | 0 |
| Cross-cutting **P0** gaps | 6 |
| Cross-cutting **P1** gaps | 5 |
| **Estimated effort** to close all gaps | **18–22 person-days** |

---

## Per-Module Gap Analysis

### 1. achievements
- **Structure:** controller ✓ service ✓ module ✓ entities ✓ dto ✗ tests ✗
- **Entities:** `achievement`, `user-achievement`
- **Missing DTOs:** no request/response validation DTOs
- **Missing tests:** no spec files
- **Gap severity:** LOW
- **Effort:** 0.5d (add DTOs + unit tests)

### 2. admin
- **Structure:** controller ✓ service ✓ module ✓ dto ✓ entities N/A tests ✓ (both spec files)
- **DTOs:** 6 DTOs present (`query-users`, `query-contests`, `query-kyc`, `reject-kyc`, `update-user`)
- **Endpoints:** dashboard, users CRUD, contests list, KYC approve/reject, config update, support tickets, compensation trigger/bulk-process, broadcast notification/SMS, audit logs
- **Gaps:** No prize-distribution manual trigger endpoint, no rate-limit on dashboard route
- **Gap severity:** LOW
- **Effort:** 0.25d

### 3. audit
- **Structure:** module ✓ service ✓ entities ✓ dto ✗ controller ✗ tests ✗
- **Entity:** `audit-log`
- **Gaps:** No dedicated controller — audit log viewing is exposed via admin routes only. No DTOs for filtered queries.
- **Gap severity:** LOW
- **Effort:** 0.25d

### 4. auth
- **Structure:** controller ✓ service ✓ module ✓ dto ✓ entities ✓ guards ✓ decorators ✓ strategies ✓ tests ✗
- **Entities:** `refresh-token`
- **Gaps:** No refresh-token rotation (single-use rotation missing), no refresh-token revocation endpoint, no E2E tests
- **Gap severity:** MEDIUM (refresh rotation is P1)
- **Effort:** 1d

### 5. banners
- **Structure:** controller ✓ service ✓ module ✓ entities ✓ dto ✗ tests ✗
- **Entity:** `banner`
- **Missing DTOs:** no create/update/query DTOs
- **Missing tests:** no spec files
- **Gap severity:** LOW
- **Effort:** 0.5d

### 6. chat
- **Structure:** controller ✓ (history) service ✓ module ✓ gateway ✓ dto ✓ entities ✓ tests ✓ (gateway.spec, controller.spec, service.spec)
- **Entities:** `chat`, `chat-message`, `chat-participant`
- **WebSocket namespace:** `/chat` fully implemented (auth, join/leave, sendMessage with bot auto-responder, typing indicators, read receipts)
- **Gaps:** No mention of chat moderation/admin endpoints
- **Gap severity:** NONE
- **Effort:** 0d

### 7. common
- **Structure:** pipes ✓ filters ✓ interceptors ✓ guards ✓ middleware ✓ config ✓ metrics ✓ logger ✓ events ✓ hooks
- **Middleware chain:** RequestId, CorrelationId, RequestLogging, Compression, Etag, RequestSizeLimiter
- **Gaps:** Global exception filter has no Sentry breadcrumb integration; Swagger decorator not applied to runtime env vars; no `@CpuHealthIndicator` or `@MemoryHealthIndicator`
- **Gap severity:** LOW
- **Effort:** 0.5d

### 8. compensation
- **Structure:** service ✓ module ✓ dto ✓ entities ✓ cron ✓ controller ✗ tests ✗
- **Entity:** `compensation-log`
- **Note:** Compensation is triggered via admin controller (`POST /api/v1/admin/contests/:id/compensate` and `POST /api/v1/admin/compensations/process-pending`) plus auto-cron
- **Gaps:** No independent compensation controller
- **Gap severity:** LOW (admin covers it)
- **Effort:** 0d

### 9. config (AppConfig)
- **Structure:** module ✓ entities ✓ controller ✗ service ✗ dto ✗ tests ✗
- **Entity:** `system-config`
- **Note:** Config is managed via admin controller (`PATCH /api/v1/admin/config`)
- **Gaps:** No service abstraction layer between admin controller and entity
- **Gap severity:** LOW
- **Effort:** 0.25d

### 10. contests
- **Structure:** controller ✓ service ✓ module ✓ dto ✓ entities ✓ gateway ✓ tests ✓ (STATUS.md shows tests)
- **Entities:** `contest`, `contest-member`
- **WebSocket namespace:** `/contests` fully implemented (auth, join/leave room, point update emit, leaderboard update emit)
- **Gaps:** No manual prize-distribution trigger on contest completion (handled via queue processor + cron). No schedule-based bulk status transition.
- **Gap severity:** LOW
- **Effort:** 0.25d

### 11. feed
- **Structure:** controller ✓ service ✓ module ✓ dto ✓ entities ✓ tests ✗
- **Entities:** `post`, `like`, `comment`
- **Gaps:** No spec files. No pagination cursor support (page/offset only).
- **Gap severity:** LOW
- **Effort:** 0.5d

### 12. gamification
- **Structure:** controller ✓ service ✓ module ✓ dto ✓ entities ✗ tests ✗
- **Note:** Uses User entity fields (`pointsBalance`, `currentTier`, etc.) — no separate gamification entities
- **Gaps:** No spec files
- **Gap severity:** LOW
- **Effort:** 0.25d

### 13. health
- **Structure:** controller ✓ module ✓ tests ✗
- **Endpoints:** `/health`, `/health/readiness`
- **Gaps:** No DB ping check in health endpoint (only service-level check); no Redis health check
- **Gap severity:** LOW
- **Effort:** 0.25d

### 14. kyc
- **Structure:** controller ✓ service ✓ module ✓ dto ✓ entities ✓ tests ✗
- **Entity:** `kyc`
- **Gaps:** No spec files. No webhook for KYC verification service (manual approve/reject only).
- **Gap severity:** LOW
- **Effort:** 0.5d

### 15. leaderboard
- **Structure:** controller ✓ services ✓ (3 services) module ✓ entities ✓ dto ✗ tests ✓ (2 spec files)
- **Entity:** `leaderboard-archive`
- **Gaps:** No DTOs for request/response shaping; no real-time leaderboard push via WebSocket (standalone service)
- **Gap severity:** LOW
- **Effort:** 0.25d

### 16. notifications
- **Structure:** controller ✓ service ✓ module ✓ entities ✓ dto ✗ tests ✓ (controller.spec, service.spec)
- **Entities:** `fcm-token`, `notification-log`, `reminder`
- **Gaps:** No DTOs. Push notifications are sent synchronously via FCM in the service — no queue processor used (QUEUES.PUSH_NOTIFICATIONS has no processor). Same for email. The queue is registered but worker is missing.
- **Gap severity:** HIGH — Push/FCM via queue is P1
- **Effort:** 1.5d (create push-notification processor + email processor)

### 17. payment-methods
- **Structure:** controller ✓ service ✓ module ✓ entities ✓ dto ✗ tests ✗
- **Entity:** `saved-payment-method`
- **Gaps:** No DTOs, no spec files
- **Gap severity:** LOW
- **Effort:** 0.5d

### 18. payments
- **Structure:** controller ✓ service ✓ module ✓ entities ✓ dto ✗ tests ✗
- **Entity:** `payment`
- **Endpoints:** `POST /order`, `POST /verify`, `GET /history`
- **Gaps:** No webhook endpoint for async gateway callbacks. Signature verification is client-side (in verifyPayment), not webhook-based. No DTOs. No spec files.
- **Webhook security:** Webhook secret hardcoded as default fallback (`process.env.WEBHOOK_SECRET || 'dream11_webhook_secret_key_2026'`) in payments.service.ts:15 — if env var is missing, secret is a literal string
- **Gap severity:** HIGH — Payment webhook endpoint P0, hardcoded fallback secret P1
- **Effort:** 2d

### 19. points
- **Structure:** controller ✓ services ✓ (2 services) module ✓ dto ✓ entities ✓ tests ✗
- **Entity:** `point-log`
- **Gaps:** No spec files
- **Gap severity:** LOW
- **Effort:** 0.5d

### 20. polls
- **Structure:** controller ✓ service ✓ module ✓ dto ✓ entities ✓ tests ✗
- **Entities:** `poll`, `poll-vote`
- **Gaps:** No spec files
- **Gap severity:** LOW
- **Effort:** 0.5d

### 21. prize-homes
- **Structure:** controller ✓ service ✓ module ✓ entities ✓ dto ✗ tests ✗
- **Entity:** `prize-home`
- **Gaps:** No DTOs, no spec files
- **Gap severity:** LOW
- **Effort:** 0.5d

### 22. queue
- **Structure:** module ✓ constants ✓ service ✓ dto ✓ controllers ✗
- **Queues registered (6):** `otp-sms`, `push-notifications`, `email`, `prize-distribution`, `settlement`, `reminders`
- **Processors implemented (2/6):** `OtpSmsProcessor`, `PrizeDistributionProcessor`
- **Missing processors (4/6):** `push-notifications`, `email`, `settlement`, `reminders`
- **Gap severity:** HIGH — 4 critical queue processors missing
- **Effort:** 3d

### 23. redis
- **Structure:** module ✓ throttler storage service ✓ tests ✗
- **Gaps:** No spec files; no Redis health check exposed
- **Gap severity:** LOW
- **Effort:** 0.25d

### 24. referral
- **Structure:** controller ✓ service ✓ module ✓ dto ✓ entities ✓ tests ✗
- **Entity:** `referral`
- **Gaps:** No spec files
- **Gap severity:** LOW
- **Effort:** 0.5d

### 25. rewards
- **Structure:** controller ✓ service ✓ module ✓ entities ✓ dto ✗ tests ✗
- **Entities:** `reward`, `reward-redemption`
- **Gaps:** No DTOs, no spec files
- **Gap severity:** LOW
- **Effort:** 0.5d

### 26. seed
- **Structure:** module ✓ service ✓ dto ✗ controller ✗ entities ✗
- **Gaps:** Intentionally minimal (seeding only). No DTOs needed.
- **Gap severity:** NONE
- **Effort:** 0d

### 27. share-tracker
- **Structure:** controller ✓ service ✓ module ✓ entities ✓ dto ✗ tests ✗
- **Entity:** `share`
- **Gaps:** No DTOs, no spec files
- **Gap severity:** LOW
- **Effort:** 0.5d

### 28. sms
- **Structure:** module ✓ service ✓ dto ✗ controller ✗ entities ✗ tests ✗
- **Gaps:** No controller (used internally via queue). No spec files. OtpSmsProcessor exists in queue.
- **Gap severity:** LOW
- **Effort:** 0.25d

### 29. support
- **Structure:** controller ✓ service ✓ module ✓ dto ✓ entities ✓ tests ✗
- **Entity:** `support-ticket`
- **Gaps:** No spec files
- **Gap severity:** LOW
- **Effort:** 0.5d

### 30. transactions
- **Structure:** controller ✓ service ✓ module ✓ entities ✓ dto ✗ tests ✗
- **Entity:** `transaction`
- **Endpoints:** `GET /` (history with pagination/type filter), `GET /balance`
- **Gaps:** No DTOs, no spec files
- **Gap severity:** LOW
- **Effort:** 0.5d

### 31. users
- **Structure:** controller ✓ service ✓ module ✓ dto ✓ entities ✓ tests ✗
- **Entity:** `user`
- **Gaps:** No user-deletion endpoint (GDPR compliance). No spec files.
- **Gap severity:** MEDIUM — Deletion endpoint is P1
- **Effort:** 1d

### 32. withdrawals
- **Structure:** controller ✓ service ✓ module ✓ entities ✓ dto ✗ tests ✓ (service.spec)
- **Entity:** `withdrawal`
- **Gaps:** No DTOs
- **Gap severity:** LOW
- **Effort:** 0.5d

### 33. batch (common/controllers)
- **Structure:** module ✓ controller ✗ service ✗ tests ✗
- **Note:** Registered in app.module.ts, but directory has no files beyond module definition
- **Gap severity:** MEDIUM — batch module exists but is essentially empty
- **Effort:** investigate (0.25d)

---

## Cross-Cutting Issues

### P0 (Critical — blocking production deployment)

| # | Issue | Location | Impact | Fix |
|---|---|---|---|---|
| CC-1 | Hardcoded webhook secret fallback | `payments.service.ts:15` | Payment verification can be forged if `WEBHOOK_SECRET` env var is missing | Remove fallback, fail at startup if env var not set |
| CC-2 | CORS `origin: '*'` in production | `main.ts` + gateways | Security risk — should restrict to known domains | Use env-based CORS origin list |
| CC-3 | Helmet disabled in dev mode | `main.ts` | CSP, XSS protections absent if misconfigured in prod | Verify prod path enables all Helmet features |
| CC-4 | 4 of 6 queue processors missing | `queue/processors/` | Push notifications, email, settlement, reminders will never be consumed | Implement 4 missing processors |
| CC-5 | No refresh-token rotation | `auth/` | Replay attack vector if refresh token is stolen | Implement rotation on each refresh |
| CC-6 | No rate-limit on admin dashboard + GET routes | `admin.controller.ts` only throttles mutate endpoints | Dashboard/GET endpoints unprotected from abuse | Add `@Throttle` to all admin routes |

### P1 (High — should fix before launch)

| # | Issue | Location | Impact | Fix |
|---|---|---|---|---|
| CC-7 | No user-deletion/GDPR endpoint | `users/` | Cannot comply with data deletion requests | Add `DELETE /api/v1/users/me` |
| CC-8 | 10 modules missing `dto/` directories | banners, leaderboard, notifications, payment-methods, payments, prize-homes, rewards, share-tracker, transactions, withdrawals | No request validation or Swagger schemas for these endpoints | Add DTOs with class-validator decorators |
| CC-9 | No Sentry breadcrumb integration in global exception filter | `common/filters/` | Error context lost in Sentry | Add `Sentry.addBreadcrumb()` before capture |
| CC-10 | No E2E tests for chat, notifications, payments, withdrawals | `test/e2e/` | Real request flow not validated | Add 4 E2E spec files |
| CC-11 | No schedule-based contest status cleanup | `contests/` | Stale "running" contests never auto-expire | Add cron in compensation module already handles this (partial) — add explicit contest status cron |

### P2 (Nice-to-have)

| # | Issue | Location | Impact | Fix |
|---|---|---|---|---|
| CC-12 | No `@ApiTags` / `@ApiBearerAuth` on some controllers | Various | Swagger docs incomplete | Audit and add decorators |
| CC-13 | No Redis health indicator | `health/` | Redis outage not detected | Add `@HealthCheck` integration |
| CC-14 | No unit tests for 22 of 33 modules | Various | Low coverage | Add spec files per module |
| CC-15 | Batch module is empty | `common/controllers/batch.module.ts` | Dead code or placeholder | Implement or remove |

---

## Endpoint Coverage Verification

108 endpoints claimed in STATUS.md — verified actual routes from controller reads:

| Module | Claimed | Verified | Missing |
|---|---|---|---|
| auth | 6 | 6 | — |
| users | 5 | 5 | DELETE /me |
| kyc | 3 | 3 | — |
| contests | 8 | 8 | — |
| points | 4 | 4 | — |
| payments | 4 | 3 | webhook endpoint |
| transactions | 3 | 2 | — |
| admin | 18 | 18 | — |
| chat | 3 | 3 | — |
| notifications | 7 | 7 | — |
| feed | 6 | 6 | — |
| polls | 5 | 5 | — |
| rewards | 4 | 4 | — |
| referral | 4 | 4 | — |
| support | 4 | 4 | — |
| health | 2 | 2 | — |
| banners | 4 | 4 | — |
| achievements | 2 | 2 | — |
| prize-homes | 4 | 4 | — |
| share-tracker | 3 | 3 | — |
| withdrawal | 4 | 4 | — |
| leaderboard | 3 | 3 | — |
| gamification | 5 | 5 | — |
| payment-methods | 3 | 3 | — |

**Total verified: ~112** (some modules have more than claimed)

---

## Key Strengths

1. **Architecture is solid** — clean separation of concerns, proper DI, TypeORM entities well-defined
2. **WebSocket gateways** — both `/chat` and `/contests` namespaces fully implemented with auth
3. **Queue infrastructure** — BullMQ wired up with all 6 queues registered, connection config ready
4. **Compensation system** — thorough idempotent processing with atomic DB claims, FCM+SMS notification
5. **Admin module** — comprehensive coverage with audit logging on every mutation
6. **Middleware chain** — request ID, correlation ID, logging, compression, ETag, size limiting
7. **Security** — Helmet, CORS, Throttler (Redis-backed), JWT auth guards in place

---

## Effort Breakdown

| Category | Days |
|---|---|
| Queue processors (4 missing) | 3.0 |
| Payment webhook + DTOs | 2.0 |
| Push notification processor | 1.5 |
| Refresh-token rotation | 1.0 |
| User deletion endpoint | 1.0 |
| DTOs for 10 modules | 2.5 |
| Unit tests (22 modules) | 4.0 |
| E2E tests (4 specs) | 2.0 |
| Cross-cutting fixes (CORS, Helmet, Sentry, Redis health, rate-limit) | 1.5 |
| Batch module investigation | 0.25 |
| Total | ~18.75 person-days |
