# Dream Home 11 — Backend Architecture Specification

> **Audit Date:** July 2026  
> **Scope:** NestJS v11 backend at `backend/src/` — 38 modules, ~199 TypeScript files  
> **Status:** Production-ready with 14 identified production gaps

---

## 1. Architecture Overview

### 1.1 Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Runtime** | Node.js (NestJS) | 11.0.1 | Application framework |
| **Database** | PostgreSQL (TypeORM) | pg 8.x | Primary data store |
| **Cache** | Redis (ioredis) | 5.x | Cache, rate limits, leaderboard |
| **Real-time** | Socket.IO | 4.x | Contest updates, chat |
| **Auth** | Firebase Admin SDK + JWT | custom | Phone OTP + 7-day tokens |
| **Logging** | pino | 9.x | Structured JSON logging |
| **Errors** | Sentry | 8.x | Error tracking |
| **Metrics** | prom-client | 15.x | Prometheus metrics |
| **API Docs** | Swagger | 11.0.3 | Dev-only OpenAPI |
| **Payments** | Razorpay | (manual) | Deposit/withdrawal |

### 1.2 Module Inventory (38 Modules)

| # | Module | Controller | Service(s) | Gateway | Cron | Entity(ies) |
|---|--------|-----------|-----------|---------|------|------------|
| 1 | **Auth** | `POST request-otp`, `POST verify-otp`, `POST mock-login` | AuthService, FirebaseService | — | — | — |
| 2 | **Users** | `GET me`, `GET me/*`, `PATCH me/profile`, `PATCH me/referral-code`, `GET :id/preview` | UsersService | — | — | User |
| 3 | **Contests** | `GET /`, `GET winners`, `GET code/:code`, `GET :id`, `POST /`, `POST :id/join`, `POST :id/leave` | ContestsService | ContestsGateway `/contests` | — | Contest, ContestMember |
| 4 | **Payments** | `POST order`, `POST verify` | PaymentsService | — | — | Payment |
| 5 | **Transactions** | `GET /`, `GET balance` | TransactionsService | — | — | Transaction |
| 6 | **Withdrawals** | `POST withdraw`, `GET withdraw/history` | WithdrawalsService | — | — | Withdrawal |
| 7 | **KYC** | `POST submit`, `POST upload-document`, `GET status`, `GET me` | KycService | — | — | Kyc |
| 8 | **Rewards** | `GET /`, `GET redemptions`, `GET :id`, `POST :id/redeem` | RewardsService | — | — | Reward, RewardRedemption |
| 9 | **Points** | `GET actions/today`, `GET streak`, `POST action` | PointsEngineService, StreakService | — | StreakCronService (midnight) | PointLog |
| 10 | **Leaderboard** | `GET /`, `GET weekly/monthly/lifetime`, `GET contest/:id`, `GET search`, `POST sync`, `POST reset-weekly/monthly` | LeaderboardRedisService, LeaderboardSyncService, LeaderboardResetService | — | LeaderboardSyncCron (5min), Weekly (Sun), Monthly (1st) | LeaderboardArchive |
| 11 | **Chat** | `GET /`, `GET :id`, `GET :id/messages` | ChatHistoryService | ChatGateway `/chat` | — | Chat, ChatParticipant, ChatMessage |
| 12 | **Feed** | `GET /`, `POST /`, `POST :id/like`, `POST :id/comment`, `GET :id/comments` | FeedService | — | — | Post, Like, Comment |
| 13 | **Notifications** | `POST fcm-token`, `GET reminders`, `POST reminders`, `DELETE reminders/:id`, `GET /`, `PATCH read-all`, `PATCH :id/read` | NotificationsService | — | processDueReminders (1min) | NotificationLog, FcmToken, Reminder |
| 14 | **Banners** | `GET /` | BannersService | — | — | Banner |
| 15 | **PrizeHomes** | `GET /`, `GET cities`, `GET featured`, `GET :id` | PrizeHomesService | — | — | PrizeHome |
| 16 | **Achievements** | `GET /`, `POST check` | AchievementsService | — | — | Achievement, UserAchievement |
| 17 | **Polls** | `GET active`, `GET :id/results`, `POST vote` | PollsService | — | — | Poll, PollVote |
| 18 | **Gamification** | `POST spin`, `GET spin/status` | GamificationService | — | — | — |
| 19 | **ShareTracker** | `POST /`, `GET history`, `GET stats` | ShareTrackerService | — | — | Share |
| 20 | **Referral** | `POST apply`, `GET stats`, `GET history` | ReferralService | — | — | Referral |
| 21 | **Compensation** | (admin routes in AdminController) | CompensationService | — | CompensationCronService (5min) | CompensationLog |
| 22 | **Support** | `POST tickets`, `GET tickets`, `GET tickets/:id` | SupportService | — | — | SupportTicket |
| 23 | **PaymentMethods** | `GET categories`, `GET /`, `POST /`, `DELETE :id` | PaymentMethodsService | — | — | SavedPaymentMethod |
| 24 | **Config** | (SystemConfig via AdminController) | ConfigService | — | — | SystemConfig |
| 25 | **SMS** | — | SmsService (mock) | — | — | — |
| 26 | **Audit** | (admin routes) | AuditLogService | — | — | AuditLog |
| 27 | **Admin** | `GET dashboard`, `GET users`, `PATCH users/:id`, `GET contests`, `GET kyc`, `PATCH kyc/:id/approve/reject`, `PATCH config`, `GET support-tickets`, `PATCH tickets/:id/status`, `POST contests/:id/compensate`, `POST compensations/process-pending`, `GET compensations`, `POST notifications/broadcast`, `GET audit-logs` | AdminService | — | — | — |
| 28 | **Health** | `GET /health`, `GET /health/ready`, `GET /health/live`, `GET /health/detailed` | HealthService | — | — | — |
| 29 | **Common** | (shared infra) | PoolConfigService, QueryOptimizerService, ErrorTrackingService, HealthMetricsService | — | — | — |
| 30 | **Redis** | — | RedisCacheService, RedisThrottlerStorageService | — | — | — |
| 31 | **Metrics** | `GET /metrics` | PrometheusService | — | HealthMetricsService (30s) | — |
| 32 | **Seed** | — | SeedService | — | — | (OnApplicationBootstrap) |
| 33 | **Batch** | `POST /batch` | — | — | — | — |
| 34 | **Database** | — | — | — | — | (TypeORM config) |
| 35 | **Migrations** | — | — | — | — | InitialSchema, AddPerformanceIndexes |
| 36 | **AuditModule** | — | AuditLogService | — | — | AuditLog |
| 37 | **AppConfig** | — | (config module) | — | — | SystemConfig |
| 38 | **Shutdown** | — | ShutdownHook | — | — | — |

### 1.3 Request Pipeline

```
Client → Helmet → CORS → Compression → RequestId → CorrelationId → 
RequestLogging → Etag → RequestSizeLimiter → 
  [Global Guards]
    ThrottlerBehindProxyGuard (30 req/min)
  → Route → [Route Guards]
    JwtAuthGuard (Bearer token → findById → req.user)
    RolesGuard (ADMIN/MODERATOR)
    UserRateLimitGuard (per-group: auth/wallet/kyc/api)
    ApiKeyGuard (SHA-256 hashed key)
  → [Global Interceptors]
    SentryInterceptor (breadcrumbs)
    CacheInterceptor (Redis, GET only, skips auth routes)
  → [Pipes]
    ValidationPipe (whitelist + forbidNonWhitelisted + transform)
    SanitizePipe (XSS, NoSQL injection, control chars)
  → [Controller] → [Service] → [Database/Redis/External]
  → [Exception Filters]
    SentryExceptionFilter (>=500 to Sentry, masks in prod)
  → [Middleware]
    Etag (MD5, 304 on match)
    RequestLogging (finish event)
```

---

## 2. Current State Assessment

### 2.1 Strengths (Production-Ready)

| # | Area | Details |
|---|------|---------|
| 1 | **Middleware Pipeline** | 7 middleware: requestId + correlationId (AsyncLocalStorage), request logging (pino, sampled), compression (1KB+), ETag (MD5), request size limiter (per-endpoint) |
| 2 | **Input Validation** | Global ValidationPipe (whitelist + forbidNonWhitelisted + transform). SanitizePipe strips null bytes, control chars, XSS tags, JS URIs, MongoDB `$` ops. Disable error messages in prod. |
| 3 | **Security Headers** | Helmet with strict CSP (prod-only), HSTS 2yr preload, COEP/COOP/CRP |
| 4 | **Rate Limiting** | 4 layers: global throttler (30/min), endpoint `@Throttle()`, per-user Redis groups (auth/wallet/kyc/api), API key throttling |
| 5 | **Audit Trail** | All admin actions (KYC approve/reject, config update, broadcast, compensation, user update) logged with adminId, action, target, metadata, IP |
| 6 | **Monitoring** | Prometheus metrics (12 custom metrics: HTTP count/duration, DB queries, registrations, connections, points), Sentry error tracking, 4 health endpoints |
| 7 | **Health Checks** | `GET /health` (liveness), `/health/ready` (DB+Redis ping), `/health/live` (uptime), `/health/detailed` (CPU/memory/disk) |
| 8 | **Transactions** | TypeORM pessimistic locking on contest join, withdrawal, referral, compensation. All critical financial paths atomic. |
| 9 | **Caching** | Custom Redis cache interceptor (GET only, auth-skipped), Redis sorted sets for leaderboard, Redis throttler storage, configurable TTLs per route |
| 10 | **Graceful Shutdown** | ShutdownHook: Redis quit, TypeORM destroy, HTTP close, 10s timeout |
| 11 | **Database Indexing** | 9 composite/partial indexes on contest_members, transactions, point_logs, notifications, kyc, posts, compensation_logs, audit_logs |
| 12 | **Cron Jobs** | 6 scheduled tasks: streak penalty (midnight), leaderboard sync (5min), leaderboard weekly reset, monthly reset, compensation check (5min), reminder processing (1min) |
| 13 | **WebSocket Auth** | JWT token verification on both gateways (`/contests`, `/chat`), room-based subscriptions |
| 14 | **CORS** | Production: specific origins only (dreamhome11.com, admin.dreamhome11.com, api.dreamhome11.com) |
| 15 | **Swagger** | Bearer + API key auth documented, dev-only |

### 2.2 Partial Gaps (Partially Implemented)

| # | Area | Current State | Required |
|---|------|---------------|----------|
| 1 | **OTP Storage** | In-memory Map in AuthService | Redis-backed OTP with per-IP rate limiting, TTL, and persistence across restarts |
| 2 | **SMS Service** | Mock implementation (console.log) | Twilio/MSG91 integration with retry, queue, fallback provider |
| 3 | **JWT Management** | Single 7-day token, no refresh/rotation | Add refresh tokens (24h expiry), token rotation, blacklist on logout |
| 4 | **Cache Decorators** | `@CacheControl`, `@NoCache`, `@InvalidateCache` defined but never applied | Apply decorators to controller routes; wire `CACHE_TTL.WALLET_BALANCE` (5s) for wallet endpoints |
| 5 | **Firebase Auth** | Optional (mock auth fallback in dev) | Make Firebase mandatory in all non-dev environments; remove `ENABLE_MOCK_AUTH` |
| 6 | **Validator Edge Cases** | KYC uses `@Body('fieldName')` without DTO; bank-details update has no DTO | Add proper DTOs for KYC submission and bank-detail updates |
| 7 | **MODERATOR Role** | Defined in enum but never enforced in any guard | Assign read-only permissions: view dashboard, users, contests, KYC, support tickets — no writes |
| 8 | **Sentry Filtering** | 4xx errors suppressed from Sentry | Track 401/403/429 at `warning` level for security visibility |

### 2.3 Critical Production Gaps

| # | Gap | P-Level | Impact | Required Action |
|---|-----|---------|--------|-----------------|
| 1 | **No Job Queue** | **P0** | FCM push notifications, SMS delivery, and compensation processing run synchronously in request cycle. No retry on failure. No backpressure handling. No visibility into job status. | Add Bull/BullMQ with Redis backend. Create queues: `fcm-notifications`, `sms-delivery`, `compensation-processing`, `leaderboard-sync`, `reminder-execution`. Implement retry strategies (3 attempts, exponential backoff). Add queue monitoring dashboard. |
| 2 | **No Event Bus** | **P0** | All inter-module communication is via direct service injection (CompensationService calls NotificationsService + SmsService directly; ContestsService calls PointsEngineService directly). Tight coupling prevents independent scaling and makes the system brittle. | Add `@nestjs/event-emitter`. Define domain events: `UserRegisteredEvent`, `ContestJoinedEvent`, `ContestCompletedEvent`, `ContestCancelledEvent`, `KycApprovedEvent`, `PaymentCompletedEvent`, `PointsAwardedEvent`, `ReferralSettledEvent`. Decouple all inter-service calls. |
| 3 | **No Standard Response Envelope** | **P0** | Controllers return raw data. No `{ success, data, message, timestamp }` wrapper. No standardized pagination response (`{ items, total, page, limit, totalPages }`). Each service formats pagination differently. | Add `ResponseInterceptor` (global) wrapping all responses with `{ success: true, data, message, timestamp, requestId }`. Add `PaginatedResponse<T>` generic interface. Standardize error format: `{ success: false, statusCode, message, fields?, requestId, correlationId, timestamp }`. |
| 4 | **No Refresh Tokens** | **P0** | 7-day JWT with no rotation. Token leak = permanent access. No logout-invalidate-other-sessions capability. | Implement refresh token flow: short-lived access token (15min) + 24h refresh token stored in Redis with device ID. Rotation on each refresh. Blacklist on logout. |
| 5 | **verify-otp Has No Rate Limit** | **P1** | `POST /auth/verify-otp` has no `@Throttle()` decorator. Global 30 req/min is the only protection. Brute-force across different phone numbers is possible. | Add `@Throttle({ default: { limit: 5, ttl: 60000 } })` on verify-otp. Add per-IP rate limiting for auth endpoints. |
| 6 | **WebSocket Wildcard CORS** | **P1** | `ContestsGateway` uses `cors: { origin: '*', credentials: true }` — allows any website to open WebSocket connections. | Restrict to known origins. Apply same CORS policy as HTTP. |
| 7 | **Duplicate Exception Filters** | **P1** | `SentryExceptionFilter` (global, `@Catch()`) catches ALL exceptions and writes its own response. `AllExceptionsFilter` (also global, `@Catch()`) never fires — PinoLogger-based error logging is dead code. `HttpExceptionFilter` is stale with conflicting class name. | Consolidate into single `AllExceptionsFilter` that: logs via Pino, sends >=500 to Sentry, returns standard error envelope. Remove duplicate/stale files. |
| 8 | **No Tracing** | **P1** | No distributed tracing. Cannot trace request across service boundaries (e.g., which DB queries and Redis calls a single HTTP request made, with durations). | Add OpenTelemetry with `@opentelemetry/instrumentation-http`, `@opentelemetry/instrumentation-express`, `@opentelemetry/instrumentation-pg`. Export to Jaeger or similar. |
| 9 | **Reminders Lost on Restart** | **P1** | Reminders use in-memory `setTimeout` in `NotificationsService`. Server restart destroys all pending reminders. | Move reminder scheduling to Bull queue with delayed jobs or use `pg-boss`/Redis delayed scheduling. |
| 10 | **QueryTimingMiddleware Not Registered** | **P1** | Slow query detection middleware exists but is never applied. Performance degradation goes unnoticed. | Register `QueryTimingMiddleware` in AppModule. Set warning threshold at 500ms, critical at 2000ms. |
| 11 | **WsExceptionFilter Not Wired** | **P1** | WebSocket error handling filter is defined but never registered on any gateway. WS errors cause disconnection with no client notification. | Register `WsExceptionFilter` on both gateways (`ContestsGateway`, `ChatGateway`). |
| 12 | **In-Memory OTP** | **P1** | OTP store is a `Map` in AuthService. Lost on restart. Not shared across instances. No per-IP tracking. | Move OTP to Redis with TTL (5min), per-IP rate limiting, max attempts (3) per phone+IP combination. |
| 13 | **No Graceful Cache Degradation** | **P2** | `CacheInterceptor` does not handle Redis failures gracefully — cached reads will fail if Redis is down. | Add try/catch around Redis operations in cache interceptor; fall through to uncached execution on failure. Log Redis errors. |
| 14 | **Chat Auto-Bot Responder** | **P2** | Debug auto-responder in ChatGateway sends random bot replies. Active in production — users see system-generated messages. | Gate behind `NODE_ENV !== 'production'` or remove entirely. |

---

## 3. API Design & Response Structure

### 3.1 Standard Error Envelope (Required)

```typescript
// Non-validation error
{
  success: false,
  statusCode: 400,
  message: "Bad Request",
  requestId: "req_abc123",
  correlationId: "corr_def456",
  timestamp: "2026-07-06T10:30:00.000Z"
}

// Validation error
{
  success: false,
  statusCode: 400,
  message: "Validation failed",
  fields: {
    email: ["email must be an email address"],
    password: ["password must be longer than or equal to 8 characters"]
  },
  requestId: "req_abc123",
  timestamp: "2026-07-06T10:30:00.000Z"
}
```

### 3.2 Standard Success Envelope (Required)

```typescript
// Single item
{
  success: true,
  data: { ... },
  message: "User profile retrieved",
  timestamp: "2026-07-06T10:30:00.000Z",
  requestId: "req_abc123"
}

// Paginated list
{
  success: true,
  data: [ ... ],
  pagination: {
    page: 1,
    limit: 20,
    total: 156,
    totalPages: 8,
    hasNextPage: true,
    hasPreviousPage: false
  },
  timestamp: "2026-07-06T10:30:00.000Z",
  requestId: "req_abc123"
}
```

### 3.3 Pagination Standard

All list endpoints must return pagination metadata. Query parameter conventions:

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `page` | int | 1 | — | Page number (1-indexed) |
| `limit` | int | 20 | 100 | Items per page |
| `sort` | string | — | — | Field to sort by (e.g., `createdAt`) |
| `order` | `asc`/`desc` | `desc` | — | Sort direction |

All paginated responses must include the `pagination` block shown above.

### 3.4 API Versioning

Current: `/api/v1/` prefix on all endpoints.

**Required change:** Add `Accept-Version` header support alongside URL prefix. Prepare `/api/v2/` routing for breaking changes.

### 3.5 Idempotency Keys

**Required for:** `POST /payments/order`, `POST /contests/:id/join`, `POST /referral/apply`

Clients send `Idempotency-Key` header (UUID). Server stores processed keys in Redis with TTL (24h). Duplicate requests return cached response.

---

## 4. Authorization & Security

### 4.1 Role Model (Required)

| Role | Permissions | Implemented? |
|------|------------|--------------|
| `user` | Own profile, join contests, manage own wallet, social features | ✅ Full |
| `moderator` | View dashboard, users, contests, KYC, support tickets (read-only). No financial writes. | ❌ Not implemented |
| `admin` | Full CRUD on all resources, config management, broadcast, compensation | ✅ Full |

### 4.2 JWT Token Strategy (Required Changes)

| Current | Required |
|---------|----------|
| Single 7-day token | Access token (15min) + Refresh token (24h) |
| No blacklist | Redis token blacklist with TTL |
| No rotation | Rotation on each refresh (old token blacklisted, new issued) |
| Hardcoded fallback secret | Validate `JWT_SECRET` at bootstrap; remove fallback |

### 4.3 API Key Strategy (Current — Adequate)

- SHA-256 hashed keys stored in env
- Timing-safe comparison
- Rate limited: 100 req/min per key
- Used for: health checks, batch endpoint

### 4.4 Rate Limiting Zones (Current — Adequate)

| Group | Endpoints | Limit | Window |
|-------|-----------|-------|--------|
| auth | `request-otp`, `verify-otp` | 5 | 1 min |
| contest-join | `POST .../join` | 20 | 1 min |
| wallet | `POST .../withdraw`, `POST .../order` | 10 | 1 min |
| kyc | `POST submit`, `POST upload-document` | 5 | 1 min |
| api | Default authenticated | 60 | 1 min |
| admin | KYC approve/reject, config, broadcast | 10 | 1 min |
| global | All routes | 30 | 1 min |

**Missing:** `verify-otp` needs explicit throttle decorator.

---

## 5. Validation & Error Handling

### 5.1 Validation Architecture (Required)

| Layer | Purpose | Status |
|-------|---------|--------|
| **SanitizePipe** (global) | Strip XSS, null bytes, control chars, NoSQL `$` ops | ✅ Implemented |
| **ValidationPipe** (global) | `whitelist`, `forbidNonWhitelisted`, `transform`, prod error suppression | ✅ Implemented |
| **DTO decorators** | `class-validator` on all DTO fields | ⚠️ Missing on KYC submit, bank-details update |
| **Custom validators** | Phone (E.164), PAN regex, Aadhaar checksum | ❌ Not implemented |

### 5.2 Exception Filter Architecture (Required)

```
Single AllExceptionsFilter (@Catch())
  ├── HttpException → extract status + message → format → send
  ├── WsException (via gateway) → emit 'exception' event → format → send
  └── Unknown (500) → log → Pino → Sentry (>=500) → mask in prod → send
```

**Current problem:** 3 exception filters with overlapping `@Catch()` — consolidate to one.

### 5.3 Custom Domain Exceptions (Recommended)

| Exception | Status | When to Throw |
|-----------|--------|---------------|
| `InsufficientBalanceException` | 402 | Entry fee > wallet balance |
| `ContestFullException` | 409 | All slots filled |
| `AlreadyJoinedException` | 409 | User already in contest |
| `KycRequiredException` | 403 | Withdrawal without approved KYC |
| `InvalidReferralException` | 400 | Self-referral or invalid code |
| `StateRestrictedException` | 403 | Withdrawal from restricted state |

---

## 6. Events & Queues (To Be Built)

### 6.1 Event Catalog (Required)

```typescript
// Domain Events — decouple all inter-service communication
'user.registered'        → Trigger: referral bonus check, welcome notification, first-contest prompt
'contest.joined'         → Trigger: leaderboard update, check contest full, notification to creator
'contest.completed'      → Trigger: award points, notify winners, archive contest
'contest.cancelled'      → Trigger: auto-compensate members, notify all members
'kyc.submitted'          → Trigger: admin notification
'kyc.approved'           → Trigger: referral KYC bonus (50 pts), notification to user
'payment.completed'      → Trigger: award bonus points, notify user, update dashboard
'points.awarded'         → Trigger: check achievements, update tier if threshold crossed
'referral.settled'       → Trigger: notification to referrer
'reminder.due'           → Trigger: FCM push notification (replaces setTimeout)
```

### 6.2 Job Queue Catalog (Required)

| Queue | Job Data | Concurrency | Retries | Description |
|-------|----------|-------------|---------|-------------|
| `fcm-notifications` | `{ userId, title, body, data? }` | 10 | 3 (5s, 30s, 120s) | Batch push notification delivery. Falls back to SMS if FCM fails. |
| `sms-delivery` | `{ phoneNumber, message }` | 5 | 3 (10s, 60s, 300s) | SMS delivery via Twilio/MSG91. Provider fallback on failure. |
| `compensation-processing` | `{ contestId }` | 1 | 3 (30s, 120s, 600s) | Process contest compensation for all members. Single job per contest. |
| `leaderboard-sync` | `{ type: 'global'|'weekly'|'monthly'|'contest', contestId? }` | 1 | 2 (60s, 300s) | Sync PostgreSQL → Redis leaderboards. |
| `reminder-execution` | `{ reminderId, userId, contestId? }` | 20 | 3 | Replaces in-memory setTimeout. Scheduled via Bull delayed jobs. |
| `email-delivery` | `{ email, subject, template, data }` | 5 | 3 | Future: email notifications |

### 6.3 Current Direct Dependencies to Decouple

```
CompensationService → NotificationsService (direct)      => emit 'compensation.processed'
CompensationService → SmsService (direct)                 => emit 'compensation.processed'
ContestsService → PointsEngineService (direct)            => emit 'contest.joined'
NotificationsService → PointsEngineService (direct)       => emit 'points.awarded'
NotificationsService → UsersService (direct)              => emit 'notification.sent'
CompensationService → ReferralService (direct)            => emit 'kyc.approved'
```

---

## 7. Queue, Cron, and Event Architecture

### 7.1 Current Cron Jobs (Working — No Changes Required)

| Schedule | Service | Action | Guard |
|----------|---------|--------|-------|
| `EVERY_DAY_AT_MIDNIGHT` | StreakCronService | Apply -200 pts penalty + reset streak for missed login days | None |
| `0 0 * * 0` (Sunday) | LeaderboardResetService | Freeze + archive + reset weekly leaderboard | None |
| `0 0 1 * *` (1st) | LeaderboardResetService | Freeze + archive + reset monthly leaderboard | None |
| `EVERY_5_MINUTES` | LeaderboardSyncService | Sync PostgreSQL → Redis leaderboards | `isSyncing` flag |
| `EVERY_5_MINUTES` | CompensationCronService | Auto-close expired contests, process pending compensations | None |
| `EVERY_MINUTE` | NotificationsService | Process due reminders | `isProcessing` flag |

### 7.2 WebSocket Architecture (Working — 1 Change Required)

| Gateway | Namespace | Auth | Client Events | Server Events | Change Required |
|---------|-----------|------|---------------|---------------|-----------------|
| **ContestsGateway** | `/contests` | JWT (handshake) | `joinContestRoom`, `leaveContestRoom` | `contest.pointUpdate`, `contest.leaderboardUpdate` | Fix CORS: restrict `origin` to dashboard domains |
| **ChatGateway** | `/chat` | JWT (handshake) | `joinChat`, `leaveChat`, `sendMessage`, `typing`, `markRead` | `newMessage`, `userTyping`, `messageRead` | Remove auto-bot responder in production |

### 7.3 WebSocket Scaling (Required)

Current: Single-process Socket.IO. For multi-instance deployment:
- Add `@socket.io/redis-adapter` with Redis pub/sub for cross-instance event broadcasting
- Use Redis for socket state (handled by adapter)

---

## 8. Caching Architecture

### 8.1 Current Cache Configuration (Working)

| Cache Key Pattern | TTL | Description |
|-------------------|-----|-------------|
| `cache:response:{path}:{queryHash}` | 60s (default) | HTTP response cache (GET only, non-auth routes) |
| `cache:response:{banners}*` | 300s | Reference data |
| `cache:response:{prize-homes}*` | 300s | Reference data |
| `cache:response:{config}*` | 300s | Reference data |
| `leaderboard:global` | 7d | Redis sorted set |
| `leaderboard:weekly` | 7d | Redis sorted set |
| `leaderboard:monthly` | 30d | Redis sorted set |
| `leaderboard:contest:{id}` | Per-contest | Redis sorted set |
| `user:rate_limit:{groupId}:{userId}` | 1min | Rate limit counter |
| `otp:{phoneNumber}` | 5min | OTP code (in-memory — move to Redis) |
| `gamification:spin:{userId}` | 24h | Daily spin lock (Redis SET NX) |

### 8.2 Cache Decorators (Defined — Not Applied)

```typescript
@CacheControl(ttl: CACHE_TTL)  // Override TTL on a route
@NoCache()                     // Skip caching entirely
@InvalidateCache(pattern: string) // Custom invalidation on mutation

// Required: Apply to controller routes
@CacheControl(CACHE_TTL.WALLET_BALANCE)  // GET /transactions/balance → 5s
@CacheControl(CACHE_TTL.LEADERBOARD)     // GET /leaderboard → 10s
@CacheControl(CACHE_TTL.CONTEST_LIST)    // GET /contests → 30s
@NoCache()                               // GET /users/me (redundant — already skipped via auth header check)
```

### 8.3 Missing: Cache Degradation

Wrap all `cache.interceptor.ts` Redis operations in try/catch. On Redis failure:
- Log error via Pino
- Execute original handler (uncached)
- Return response without `X-Cache` header

---

## 9. Monitoring & Observability

### 9.1 Current Metrics (Working)

| Metric | Type | Labels | Source |
|--------|------|--------|--------|
| `http_requests_total` | Counter | method, path, status | PrometheusService |
| `http_request_duration_seconds` | Histogram | method, path | PrometheusService |
| `db_query_duration_seconds` | Histogram | query_type | PrometheusService |
| `users_registered_total` | Counter | — | PrometheusService |
| `contests_joined_total` | Counter | — | PrometheusService |
| `active_connections` | Gauge | — | PrometheusService |
| `points_awarded_total` | Counter | — | PrometheusService |
| `app_errors_total` | Counter | — | ErrorTrackingService |
| `health_cpu_usage_percent` | Gauge | — | HealthMetricsService |
| `health_memory_usage_percent` | Gauge | — | HealthMetricsService |
| `health_redis_memory_usage_percent` | Gauge | — | HealthMetricsService |
| `health_db_pool_usage_percent` | Gauge | — | HealthMetricsService |

### 9.2 Missing Metrics (Required)

| Metric | Type | Labels | Why |
|--------|------|--------|-----|
| `queue_job_count` | Gauge | queue, status (waiting/active/completed/failed) | Bull queue depth monitoring |
| `queue_job_duration_seconds` | Histogram | queue, job | Job processing latency |
| `ws_connections_total` | Counter | namespace | WebSocket connection rate |
| `ws_messages_total` | Counter | namespace, event | WebSocket message throughput |
| `cache_hit_ratio` | Gauge | route | Cache effectiveness |
| `db_pool_size` | Gauge | — | Connection pool utilization |
| `otp_requests_total` | Counter | status (sent/verified/failed) | Auth flow monitoring |
| `external_api_duration_seconds` | Histogram | service (razorpay/firebase/fcm) | External dependency latency |

### 9.3 Health Check Enhancement (Required)

| Current | Required |
|---------|----------|
| Custom implementation | Add `@nestjs/terminus` for standard health checks with automatic DB/Redis/disk indicators |
| Manual endpoint registration | Use Terminus `HealthCheckService` + `TypeOrmHealthIndicator` + `RedisHealthIndicator` |
| No health check on queue | Add Bull queue health check |

---

## 10. Database & Transactions

### 10.1 Current Transaction Coverage (Working)

| Operation | Pattern | Locks |
|-----------|---------|-------|
| `joinContest()` | `dataSource.transaction()` | `pessimistic_write` on Contest, User |
| `requestWithdrawal()` | `dataSource.transaction()` | `pessimistic_write` on User |
| `applyReferral()` | QueryRunner (manual) | `pessimistic_write` on User |
| `processKycReferral()` | QueryRunner (manual) | `pessimistic_write` on User |
| `processCompensation()` | `manager.transaction()` | Idempotency guard (UPDATE WHERE) |

### 10.2 Transaction Standardization (Recommended)

- Migrate `applyReferral()` and `processKycReferral()` from QueryRunner to `dataSource.transaction()` pattern for consistency
- Add a `@Transactional()` custom decorator if multiple services need to participate in the same transaction
- Consider adding `typeorm-transactional` for declarative transaction management

### 10.3 Entity Relationship Coverage

All 31 entities verified:
- `User` has 1:many with: Kyc, ContestMember, Transaction, Payment, Withdrawal, RewardRedemption, Post, Like, Comment, PollVote, Share, NotificationLog, FcmToken, Reminder, ChatParticipant, Referral (referrer + referee), SupportTicket, CompensationLog, UserAchievement, AuditLog, SavedPaymentMethod
- `Contest` has 1:many with: ContestMember, CompensationLog
- All FK relationships use cascade where appropriate
- Unique constraints on: user KYC (1-to-1), PollVote (pollId+userId), ContestMember (contestId+userId), Referral (refereeId), compensation_logs (contestId+userId)

---

## 11. Logging & Middleware

### 11.1 Current Middleware Pipeline (Working — 1 Missing)

| Order | Middleware | Status | Purpose |
|-------|-----------|--------|---------|
| 1 | Helmet | ✅ app.use(helmet()) | Security headers |
| 2 | CORS | ✅ app.enableCors() | Cross-origin |
| 3 | Compression | ✅ Registered | Response compression >1KB |
| 4 | RequestId | ✅ Registered | AsyncLocalStorage request context |
| 5 | CorrelationId | ✅ Registered | Distributed tracing ID |
| 6 | RequestLogging | ✅ Registered | Pino HTTP logging (sampled) |
| 7 | Etag | ✅ Registered | Conditional GET (MD5) |
| 8 | RequestSizeLimiter | ✅ Registered | Route-specific payload limits |
| 9 | **QueryTiming** | ❌ **Not registered** | Slow query detection (>500ms) |
| 10 | trust proxy | ✅ `app.set('trust proxy', 1)` | Proxy headers |

### 11.2 Logger Architecture (Working — Adequate)

- `PinoLoggerService` replaces NestJS default Logger
- Request ID enrichment via AsyncLocalStorage
- Sensitive field redaction (authorization, cookie, password, token, secret)
- Structured JSON in production; pino-pretty in development
- Log levels: `LOG_LEVEL` env (default: `info` in prod, `debug` in dev)
- Request sampling: 100% of 4xx/5xx, 20% of 2xx, warn on slow (>1s)

---

## 12. Startup & Deployment

### 12.1 Bootstrap Sequence

```
1. Env validation (JWT_SECRET, DB_HOST, REDIS_HOST — critical; SENTRY_DSN — non-critical)
2. Create NestExpressApplication (bufferLogs: true)
3. Replace logger with PinoLoggerService
4. Init Sentry (if DSN present)
5. Register SentryExceptionFilter (global)
6. Register SentryInterceptor (global)
7. trust proxy = 1
8. Helmet (strict CSP in prod)
9. CORS (specific origins in prod)
10. Register ValidationPipe + SanitizePipe (global)
11. Enable shutdown hooks
12. Static assets for /uploads/
13. Swagger (non-prod only)
14. SeedService (OnApplicationBootstrap — seeds only if contests table empty)
15. LeaderboardSyncService (OnApplicationBootstrap — sync all from PG → Redis)
```

### 12.2 TypeORM Configuration

| Parameter | Value | Source |
|-----------|-------|--------|
| Pool size | 50 | `PoolConfigService` |
| Retry attempts | 10 | `AppModule` |
| Synchronize | `true` (non-prod) | `typeorm.config.ts` |
| Migrations run | CLI: `migration:run` | `package.json` |
| SSL | Configurable via env | `typeorm.config.ts` |

**Note:** `synchronize: true` must be `false` in production. Use proper migration pipeline.

---

## 13. Missing Backend Components — Complete List

### 13.1 Critical (P0 — Blocking Production Launch)

| # | Component | Current State | Specification |
|---|-----------|---------------|---------------|
| 1 | **Job Queue** | Not present | Bull/BullMQ with 6 queues (fcm-notifications, sms-delivery, compensation-processing, leaderboard-sync, reminder-execution, email-delivery). Redis backend. 3 retry attempts per job. Exponential backoff. Queue monitoring dashboard. |
| 2 | **Event Bus** | Not present | `@nestjs/event-emitter` with 10 domain events. Decouple all inter-service communication. |
| 3 | **Response Envelope** | Not present | Global interceptor wrapping all responses: `{ success, data, message, timestamp, requestId }`. Standard pagination format. |
| 4 | **Refresh Tokens** | Not present | Access token (15min) + Refresh token (24h). Redis blacklist. Token rotation. |
| 5 | **SMS Provider** | Mock implementation | Twilio or MSG91 integration. Queue-backed delivery. Provider failover. |
| 6 | **Redis OTP** | In-memory Map | Move OTP to Redis with 5min TTL. Per-IP rate limiting. Max 3 attempts. |

### 13.2 High (P1 — Should Fix Before Launch)

| # | Component | Current State | Specification |
|---|-----------|---------------|---------------|
| 7 | **Rate Limit on verify-otp** | Missing `@Throttle()` | Add 5 req/min threshold. Per-IP tracking. |
| 8 | **WebSocket CORS** | `origin: '*'` | Restrict to known dashboard domains. |
| 9 | **Exception Filter Consolidation** | 3 conflicting filters | Single `AllExceptionsFilter` with Pino + Sentry integration. Remove stale files. |
| 10 | **OpenTelemetry Tracing** | Not present | Instrument HTTP, Express, PostgreSQL. Export to Jaeger. |
| 11 | **Reminder Persistence** | In-memory setTimeout | Bull delayed jobs for reminders. |
| 12 | **QueryTimingMiddleware** | Defined but not registered | Register and configure thresholds (500ms warn, 2000ms critical). |
| 13 | **WsExceptionFilter** | Defined but not wired | Register on both WebSocket gateways. |
| 14 | **Cache Degradation** | Redis failure = cache failure | try/catch Redis ops, fall through uncached. |
| 15 | **Missing DTOs** | KYC + bank-details lack DTO validation | Add proper `class-validator` DTOs. |
| 16 | **Chat Bot Removal** | Active auto-responder | Gate behind `NODE_ENV !== 'production'`. |

### 13.3 Medium (P2 — Post-Launch)

| # | Component | Current State | Specification |
|---|-----------|---------------|---------------|
| 17 | **MODERATOR Role** | Defined but unusable | Assign read-only permissions. Wire into RolesGuard. |
| 18 | **Cache Decorators** | Defined but never applied | Apply `@CacheControl`, `@NoCache`, `@InvalidateCache` to controller routes. |
| 19 | **4xx Sentry Tracking** | Suppressed | Track 401/403/429 at warning level. |
| 20 | **@nestjs/terminus** | Custom health checks | Replace with standard Terminus health checks. |
| 21 | **Synchronize Flag** | `true` in non-prod | Ensure `false` in production with migration pipeline. |
| 22 | **Transactional Consistency** | Mixed patterns | Standardize on `dataSource.transaction()` across all services. |
| 23 | **Domain Exceptions** | None | Add 7 custom exception classes for business logic errors. |
| 24 | **JWT Fallback Secret** | Hardcoded | Remove fallback. Validate `JWT_SECRET` at startup. |

---

## 14. Technology Stack Details

### Dependencies (package.json)

```json
// Core
@nestjs/common ^11.0.1
@nestjs/core ^11.0.1
@nestjs/platform-express ^11.0.1
@nestjs/config ^4.0.4
@nestjs/swagger ^11.0.3

// Database
@nestjs/typeorm ^11.0.2
typeorm ^0.3.x
pg ^8.x

// Auth
@nestjs/jwt ^11.0.2
@nestjs/passport ^11.0.x (not used — custom JWT)
firebase-admin ^12.x

// Cache & Real-time
ioredis ^5.x
@nestjs/throttler ^6.5.0
socket.io ^4.x
@nestjs/platform-socket.io ^11.1.27

// Scheduling
@nestjs/schedule ^6.1.3

// Security
helmet ^8.x
compression ^1.x
class-validator ^0.14.x
class-transformer ^0.5.x

// Logging
pino ^9.x
pino-pretty ^11.x

// Monitoring
@sentry/node ^8.x
prom-client ^15.x

// Testing
jest ^29.x
supertest ^7.x

// Dev
typescript ^5.x
ts-node ^10.x
@types/node ^22.x
```

### Required Additions

```json
@nestjs/event-emitter ^2.x     // Event bus
@opentelemetry/api ^1.x        // Tracing
@opentelemetry/instrumentation-http ^0.x
@opentelemetry/instrumentation-express ^0.x
@opentelemetry/instrumentation-pg ^0.x
@opentelemetry/exporter-jaeger ^1.x
bull ^4.x                      // Job queue
@nestjs/bull ^10.x             // Bull module for NestJS
@nestjs/terminus ^10.x         // Standard health checks
twilio ^5.x                    // SMS provider
```

---

## 15. Production Deployment Checklist

### Pre-Launch Required

- [ ] **Critical:** Add job queue (Bull/BullMQ) and migrate FCM/SMS/compensation to queue workers
- [ ] **Critical:** Add event bus and decouple all inter-service dependencies
- [ ] **Critical:** Add response envelope interceptor + pagination standard
- [ ] **Critical:** Implement refresh token flow (access 15min + refresh 24h with Redis)
- [ ] **Critical:** Replace mock SMS with Twilio/MSG91 integration
- [ ] **Critical:** Move OTP from in-memory Map to Redis
- [ ] **Critical:** Add `@Throttle()` on `verify-otp` endpoint
- [ ] **Critical:** Consolidate exception filters to single handler
- [ ] **Critical:** Restrict WebSocket CORS from `*` to specific origins
- [ ] **Critical:** Set `synchronize: false` in production TypeORM config
- [ ] **Critical:** Remove JWT fallback secret; validate at bootstrap

### Pre-Launch Recommended

- [ ] **High:** Add OpenTelemetry tracing
- [ ] **High:** Replace in-memory setTimeout reminders with Bull delayed jobs
- [ ] **High:** Register QueryTimingMiddleware with thresholds
- [ ] **High:** Wire WsExceptionFilter on both gateways
- [ ] **High:** Wrap cache interceptor with try/catch for Redis failure degradation
- [ ] **High:** Add DTOs for KYC submit and bank-details update
- [ ] **High:** Gate ChatGateway auto-responder behind production flag
- [ ] **High:** Add `@CacheControl` / `@NoCache` decorators to controller routes

### Post-Launch

- [ ] **Medium:** Implement MODERATOR role with read-only permissions
- [ ] **Medium:** Track 4xx security events (401/403/429) at warning level in Sentry
- [ ] **Medium:** Replace custom health checks with `@nestjs/terminus`
- [ ] **Medium:** Standardize all transactions to `dataSource.transaction()` pattern
- [ ] **Medium:** Add 7 custom domain exception classes
- [ ] **Medium:** Apply cache decorators to controller routes
