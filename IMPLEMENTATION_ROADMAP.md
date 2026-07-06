# Dream11 Implementation Roadmap

> **Generated**: 2026-07-06  
> **Status**: Active Planning  
> **Scope**: Full-stack production readiness — Flutter, NestJS, Admin Panel  
> **Target**: 90% readiness within 8 weeks

---

## Table of Contents

1. [Summary Dashboard](#1-summary-dashboard)
2. [Epic Catalog](#2-epic-catalog)
3. [User Stories & Tasks](#3-user-stories--tasks)
4. [Sprint Plan](#4-sprint-plan)
5. [Dependency Graph](#5-dependency-graph)
6. [Development Order](#6-development-order)
7. [Quality Assurance Plan](#7-quality-assurance-plan)
8. [Release Plan](#8-release-plan)
9. [Risk Register](#9-risk-register)

---

## 1. Summary Dashboard

### Overall Readiness: **64%**

```
┌─────────────────────────────────────────────────────────────────┐
│  Backend Modules    ■■■■■■■■■■■■■■■■■■■■■■□□□□□□□   64% (199f) │
│  Flutter Screens    ■■■■■■■■■■■■■■■■■□□□□□□□□□□□   52% (82s)  │
│  Admin Pages        ■■■■■■■■■■■■■■■□□□□□□□□□□□□□   48% (13p)  │
│  API Endpoints      ■■■■■■■■■■■■■■■■■■■■■□□□□□□□   68% (108e) │
│  Tests              ■■■■■■■■■□□□□□□□□□□□□□□□□□□□□   30% (0/6m) │
└─────────────────────────────────────────────────────────────────┘
```

### Gap Distribution (443 total items)

| Priority | Backend | Flutter | Admin | API | Tests | Total |
|----------|---------|---------|-------|-----|-------|-------|
| **P0** | 10 | 6 | 0 | 3 | 1 | 20 |
| **P1** | 4 | 12 | 2 | 5 | 2 | 25 |
| **P2** | 5 | 18 | 5 | 8 | 3 | 39 |
| **P3** | 0 | 24 | 6 | 12 | 4 | 46 |
| **Enhancement** | 0 | 0 | 0 | 0 | 0 | 313 |
| **Total** | 19 | 60 | 13 | 28 | 10 | 443 |

### Team Structure

| Role | Count | Sprint Capacity |
|------|-------|----------------|
| Flutter Engineers | 3 | 45 SP/sprint |
| Backend Engineers | 2 | 30 SP/sprint |
| Full-Stack Admin | 1 | 15 SP/sprint |
| QA Engineers | 1 | — |
| **Total** | **7** | **90 SP/sprint** |

---

## 2. Epic Catalog

| Epic | ID | Scope | SP | Depends On | Priority |
|------|-----|-------|-----|------------|----------|
| **E1: Backend Infrastructure** | BE-INFRA | Bull queue, EventBus, envelope, refresh tokens, Redis OTP, Twilio SMS, error filters | 21 | — | P0 |
| **E2: Backend Security & Auth** | BE-SEC | Rate limiting audit, WAF headers, 2FA, session management, input sanitization | 13 | BE-INFRA | P0 |
| **E3: Contest Lifecycle** | BE-CONTEST | Contest CRUD, prize distribution, leaderboard, status workflows, reminders | 18 | BE-INFRA | P0 |
| **E4: Payment & Wallet** | BE-PAY | Payment gateway integration, wallet engine, settlement, refunds, reconciliation | 15 | BE-INFRA | P0 |
| **E5: User & KYC** | BE-KYC | KYC provider integration, verification workflows, document management, compliance | 12 | BE-INFRA | P0 |
| **E6: Notification Engine** | BE-NOTIF | Push notifications, email service, in-app notifications, templates, preferences | 10 | BE-INFRA | P1 |
| **E7: Analytics & Monitoring** | BE-MONITOR | Prometheus metrics (16 missing), structured logging, Grafana dashboards, alerts | 8 | BE-INFRA | P1 |
| **E8: Admin Panel Complete** | ADMIN-ALL | ContestCreate KYC verification page, PrizeHomes detail page, AuditLog filters, notifications, compensations | 18 | BE-* | P1 |
| **E9: Flutter P0 Gaps** | FLUTTER-P0 | Localization ARB files (hi-IN, gu-IN, bn-IN, ta-IN, te-IN, kn-IN, mr-IN), Semantics on 18 screens, permission_handler | 21 | — | P0 |
| **E10: Flutter P1 Gaps** | FLUTTER-P1 | Empty states, offline awareness, shimmer loading, error boundaries, pull-to-refresh, deep links | 24 | FLUTTER-P0 | P1 |
| **E11: Flutter P2 Gaps** | FLUTTER-P2 | Animations on 11 screens, skeleton screens, swipe-to-delete, optimistic UI, pagination | 18 | FLUTTER-P1 | P2 |
| **E12: API Polish** | API-ALL | API versioning, response envelope migration (108 endpoints), OpenAPI 3.0 docs, versioned Swagger | 13 | BE-INFRA | P1 |
| **E13: Test Foundation** | TEST-ALL | 6 modules: 0→coverage, 15 E2E scenarios, 15 security tests, load test (1000 RPS) | 21 | BE-*, FLUTTER-* | P1 |
| **E14: Performance Optimization** | PERF | Query optimization (N+1 fixes), Redis caching (entities), CDN for static, lazy loading, bundle analysis | 12 | BE-INFRA | P2 |
| **E15: Production Readiness** | PROD | SSL/TLS audit, secrets management, CI/CD pipelines, blue/green deploy, disaster recovery docs | 10 | ALL | P2 |
| **E16: Localization & i18n** | I18N | Flutter i18n framework, 7 languages, dynamic switching, RTL support, number/date formatting | 15 | FLUTTER-P0 | P2 |

**Total: 249 Story Points**

---

## 3. User Stories & Tasks

### E1: Backend Infrastructure (BE-INFRA, 21 SP)

| Story | Tasks | SP | Deps |
|-------|-------|----|------|
| **US-BE-INFRA-01**: Job Queue with Bull/BullMQ | `@nestjs/bull` setup, Queue definitions, worker processors, job retry, stalled job handling, queue UI | 5 | — |
| **US-BE-INFRA-02**: Event Bus with @nestjs/event-emitter | Module setup, 10 domain event definitions, listeners/handlers, error isolation | 3 | — |
| **US-BE-INFRA-03**: Response Envelope Interceptor | `ApiResponse<T>` interface, `TransformInterceptor<T>`, envelope for all 108 endpoints, `@SkipEnvelope()` decorator | 4 | — |
| **US-BE-INFRA-04**: Refresh Token Flow | JWT module upgrade, `refresh_token` table, `/auth/refresh` endpoint, Redis blacklist, rotation logic | 3 | — |
| **US-BE-INFRA-05**: Redis OTP Storage | `otp:` prefix with 5-min TTL, rate-limit counter, verify endpoint, cleanup job | 2 | — |
| **US-BE-INFRA-06**: Twilio SMS Integration | TwilioModule, `sendSms()` via queue (retry 3×), template system, status callback | 2 | — |
| **US-BE-INFRA-07**: Exception Filter Consolidation | Single `AllExceptionsFilter`, typed `AppException` class hierarchy, error codes, structured JSON | 2 | — |

### E2: Backend Security & Auth (BE-SEC, 13 SP)

| Story | Tasks | SP | Deps |
|-------|-------|----|------|
| **US-BE-SEC-01**: Rate Limiting Audit | @nestjs/throttler global guard, route-specific limits, header propagation, Redis store | 3 | BE-INFRA-05 |
| **US-BE-SEC-02**: WAF & Security Headers | helmet/csurf, Content-Security-Policy, HSTS, X-Frame-Options, CORS restrict WebSocket origin | 2 | — |
| **US-BE-SEC-03**: 2FA/MFA Support | Authenticator app integration, backup codes, trusted device cookie, 2FA enforcement middleware | 3 | BE-INFRA-04 |
| **US-BE-SEC-04**: Session Management | Device tracking table, concurrent session limit (5), force-logout endpoint, audit log | 3 | — |
| **US-BE-SEC-05**: Input Sanitization | XSS filter pipe, SQL injection prevention (TypeORM parameterized), NoSQL injection guard, file upload validation | 2 | — |

### E3: Contest Lifecycle (BE-CONTEST, 18 SP)

| Story | Tasks | SP | Deps |
|-------|-------|----|------|
| **US-BE-CONTEST-01**: Contest CRUD with Status Workflow | Draft→Scheduled→Active→Filled→Completed→Cancelled, validation at transitions, scheduled activation | 5 | BE-INFRA-01 |
| **US-BE-CONTEST-02**: Prize Distribution via Queue | Queue job for distribution, payout calculation, concurrent wallet deductions, idempotency keys, failure rollback | 4 | BE-INFRA-01, BE-PAY |
| **US-BE-CONTEST-03**: Leaderboard Real-time | Redis sorted set (ZADD/ZINCRBY), WebSocket broadcast on score change, paginated leaderboard | 4 | BE-INFRA-02 |
| **US-BE-CONTEST-04**: Contest Reminder Notifications | Cron job (bull) for 24h/6h/1h reminders, push + in-app + email, preference-respecting | 3 | BE-NOTIF |
| **US-BE-CONTEST-05**: WebSocket CORS Restrict | `@nestjs/websockets` CORS config, origin whitelist, disconnect on unauthorized, rate-limited events | 2 | — |

### E4: Payment & Wallet (BE-PAY, 15 SP)

| Story | Tasks | SP | Deps |
|-------|-------|----|------|
| **US-BE-PAY-01**: Payment Gateway Integration | Razorpay/Stripe module, webhook handler, signature verification, idempotency, refund flow | 5 | BE-INFRA-01 |
| **US-BE-PAY-02**: Wallet Engine | Wallet entity, deposit/withdraw transactions, balance locking, concurrent deduction guard | 4 | BE-INFRA-01 |
| **US-BE-PAY-03**: Settlement Engine | Scheduled settlement (daily), T+1 cycle, batch processing, exception report, manual override | 3 | BE-INFRA-01 |
| **US-BE-PAY-04**: Reconciliation | External gateway reconciliation, mismatch alert, auto-correction, daily report | 3 | BE-PAY-01 |

### E5: User & KYC (BE-KYC, 12 SP)

| Story | Tasks | SP | Deps |
|-------|-------|----|------|
| **US-BE-KYC-01**: KYC Provider Integration | Digilocker/IDfy integration, document upload endpoint, OCR parse, verification queue | 4 | BE-INFRA-01 |
| **US-BE-KYC-02**: Verification Workflow | Status machine (Pending→Processing→Verified/Rejected), manual review, re-verification, expiry | 3 | BE-INFRA-02 |
| **US-BE-KYC-03**: Document Management | Document entity, S3 storage (presigned URLs), retention policy, compliance audit trail | 3 | — |
| **US-BE-KYC-04**: Compliance Reporting | AML check integration, PEP screening, suspicious activity report, daily regulatory dump | 2 | BE-INFRA-01 |

### E6: Notification Engine (BE-NOTIF, 10 SP)

| Story | Tasks | SP | Deps |
|-------|-------|----|------|
| **US-BE-NOTIF-01**: Push Notification Service | Firebase Cloud Messaging module, device token registry, topic-based broadcast, silent data push | 3 | BE-INFRA-01 |
| **US-BE-NOTIF-02**: Email Service | Nodemailer/SendGrid module, HTML templates (handlebars), attachment support, bounce handling | 2 | BE-INFRA-01 |
| **US-BE-NOTIF-03**: In-App Notification | `notifications` table, real-time via WebSocket, read/unread, mark-all-read, paginated history | 3 | BE-INFRA-02 |
| **US-BE-NOTIF-04**: Notification Preferences | Preference entity, per-channel opt-in/opt-out, quiet hours, per-category toggle | 2 | | |

### E7: Analytics & Monitoring (BE-MONITOR, 8 SP)

| Story | Tasks | SP | Deps |
|-------|-------|----|------|
| **US-BE-MONITOR-01**: Prometheus Metrics (16 missing) | `@willsoto/nestjs-prometheus`, custom metrics: http_duration_ms, db_query_duration, queue_depth, otp_requests, auth_failures, wallet_balance | 4 | BE-INFRA |
| **US-BE-MONITOR-02**: Grafana Dashboards | CPU/Memory/DB pool/Queue depth dashboard, HTTP error rate, p50/p95/p99 latency, alert rules | 2 | BE-MONITOR-01 |
| **US-BE-MONITOR-03**: Structured Logging Audit | Pino logger `req.id` trace, consistent `component` field, log levels audit, sensitive data redaction, ELK pipeline | 2 | — |

### E8: Admin Panel Complete (ADMIN-ALL, 18 SP)

| Story | Tasks | SP | Deps |
|-------|-------|----|------|
| **US-ADMIN-01**: ContestCreatePage | Create/edit contest form, prize breakdown editor, validation, preview | 3 | BE-CONTEST-01 |
| **US-ADMIN-02**: PrizeHomes List/Detail | List with status filter, detail view with assigned contests, edit modal | 3 | — |
| **US-ADMIN-03**: Banners List/Create | Banner CRUD, image upload, schedule picker, link-type selector, A/B test toggle | 3 | — |
| **US-ADMIN-04**: KYC Verification Queue | Pending KYC table, document viewer, approve/reject actions, reason input | 3 | BE-KYC-02 |
| **US-ADMIN-05**: Notifications Page | Send push/email/in-app form, history log, template editor, scheduled send | 2 | BE-NOTIF |
| **US-ADMIN-06**: AuditLog Filters | Date range picker, user search, action type filter, CSV export | 2 | — |
| **US-ADMIN-07**: Compensations Page | Compensation slab CRUD, manual award, history log, wallet integration | 2 | BE-PAY |

### E9: Flutter P0 Gaps (FLUTTER-P0, 21 SP)

| Story | Tasks | SP | Deps |
|-------|-------|----|------|
| **US-FLUTTER-P0-01**: Localization ARB Files (7 languages) | Generate/translate ARB files, `flutter_localizations` setup, language switcher, plural/ICU support | 8 | — |
| **US-FLUTTER-P0-02**: Accessibility Semantics (18 screens) | `Semantics` widget wrapping, labels/values/hints, `MergeSemantics`, `ExcludeSemantics`, TalkBack/VoiceOver testing | 8 | — |
| **US-FLUTTER-P0-03**: permission_handler | `permission_handler` package, camera/storage/location permission flows, rational dialogs, denied-forever fallback | 5 | — |

### E10: Flutter P1 Gaps (FLUTTER-P1, 24 SP)

| Story | Tasks | SP | Deps |
|-------|-------|----|------|
| **US-FLUTTER-P1-01**: Empty States (18 screens) | Empty state widget with illustration + CTA, per-screen empty content, retry action | 5 | — |
| **US-FLUTTER-P1-02**: Offline Awareness | Connectivity package, offline banner, offline queue, cached data display, sync on reconnect | 5 | — |
| **US-FLUTTER-P1-03**: Shimmer Loading | Shimmer package integration, skeleton templates (card/list/detail/profile), shimmer delay optimization | 4 | — |
| **US-FLUTTER-P1-04**: Error Boundaries | `FlutterError.onError` handler, crash reporting (Sentry), error widget builder, fallback UI, retry mechanism | 3 | — |
| **US-FLUTTER-P1-05**: Pull-to-refresh (18 screens) | `RefreshIndicator` on all scrollable screens, refresh controller, HUD pattern | 3 | — |
| **US-FLUTTER-P1-06**: Deep Linking | `go_router` deep link config, deeplink handler, universal links (iOS), app links (Android), fallback URLs | 4 | FLUTTER-P0-01 |

### E11: Flutter P2 Gaps (FLUTTER-P2, 18 SP)

| Story | Tasks | SP | Deps |
|-------|-------|----|------|
| **US-FLUTTER-P2-01**: Animations (11 screens) | Hero transitions, staggered animations, `AnimatedList`, implicit animations, page route transitions | 6 | FLUTTER-P1 |
| **US-FLUTTER-P2-02**: Skeleton Screens | Skeleton screen per loading state (contest list, wallet, leaderboard, profile), shimmer timing | 3 | FLUTTER-P1-03 |
| **US-FLUTTER-P2-03**: Swipe-to-delete | `Dismissible` on list items, confirmation dialog, undo snackbar, optimistic removal | 2 | — |
| **US-FLUTTER-P2-04**: Optimistic UI | Optimistic update pattern, rollback on failure, conflict resolution for wallet balance, contest entry | 4 | FLUTTER-P1-02 |
| **US-FLUTTER-P2-05**: Pagination | `ScrollController` + `NotificationListener<ScrollNotification>`, cursor-based pagination, infinite scroll, loading indicator | 3 | — |

### E12: API Polish (API-ALL, 13 SP)

| Story | Tasks | SP | Deps |
|-------|-------|----|------|
| **US-API-01**: API Versioning | URL path versioning (`/api/v1/...`), version header fallback, version migration strategy | 3 | — |
| **US-API-02**: Response Envelope Migration | `TransformInterceptor` from BE-INFRA-03 applied to all 108 endpoints, test each controller | 5 | BE-INFRA-03 |
| **US-API-03**: OpenAPI 3.0 Documentation | `@nestjs/swagger` DTO docs, operation summaries, response schemas, error schema, examples | 4 | API-02 |
| **US-API-04**: Versioned Swagger UI | Multi-version Swagger UI, version selector dropdown, deprecated endpoint marking, API changelog | 1 | API-03 |

### E13: Test Foundation (TEST-ALL, 21 SP)

| Story | Tasks | SP | Deps |
|-------|-------|----|------|
| **US-TEST-01**: Module Unit Tests (6 modules) | Jest config for each module, controller unit tests, service unit tests, guard/interceptor/filter tests, 80% line coverage | 8 | BE-* |
| **US-TEST-02**: E2E Scenarios (15) | Playwright/Supertest setup, contest lifecycle (5), auth flow (3), payment flow (3), admin actions (4) | 6 | BE-* ADMIN-* |
| **US-TEST-03**: Security Tests (15) | OTP brute-force (3), KYC bypass (3), JWT tampering (2), SQL injection (2), XSS (2), rate limit bypass (3) | 4 | BE-SEC |
| **US-TEST-04**: Load Test (1000 RPS) | k6/artillery script, /contests (200 RPS), /auth/login (100 RPS), /wallet (100 RPS), report p50/p95/p99 | 3 | BE-INFRA |

### E14: Performance Optimization (PERF, 12 SP)

| Story | Tasks | SP | Deps |
|-------|-------|----|------|
| **US-PERF-01**: Query Optimization | TypeORM logging, N+1 detection, `LEFT JOIN` eager loading, batch queries, composite index review | 4 | — |
| **US-PERF-02**: Redis Caching | `@Cacheable` decorator, contest list (60s), leaderboard (30s), user profile (120s), cache invalidation events | 3 | BE-INFRA-02 |
| **US-PERF-03**: CDN Integration | CloudFront/Cloudflare for static uploads, image optimization pipeline, cache-control headers, origin pull | 2 | — |
| **US-PERF-04**: Lazy Loading | Module lazy loading (admin routes), component code splitting, preload strategy, bundle analysis | 3 | — |

### E15: Production Readiness (PROD, 10 SP)

| Story | Tasks | SP | Deps |
|-------|-------|----|------|
| **US-PROD-01**: SSL/TLS Audit | mTLS for inter-service, cert rotation, SSL Labs scan, HSTS preload, OCSP stapling | 3 | — |
| **US-PROD-02**: Secrets Management | HashiCorp Vault / AWS Secrets Manager integration, rotation policy, audit logging | 2 | — |
| **US-PROD-03**: CI/CD Pipeline | GitHub Actions / GitLab CI, lint→test→build→deploy, environment promotion, rollback trigger | 3 | ALL |
| **US-PROD-04**: Blue/Green Deployment | Deployment strategy doc, health check endpoints, traffic switch, rollback procedure, monitoring | 2 | PROD-03 |

### E16: Localization & i18n (I18N, 15 SP)

| Story | Tasks | SP | Deps |
|-------|-------|----|------|
| **US-I18N-01**: Flutter i18n Framework | `flutter_i18n` / `intl` setup, arb file generation, locale resolution, fallback chain | 4 | FLUTTER-P0-01 |
| **US-I18N-02**: Dynamic Language Switch | Language selection UI, persisted locale, `MaterialApp` rebuild, right-to-left for Urdu/Arabic | 3 | I18N-01 |
| **US-I18N-03**: Number & Date Formatting | `NumberFormat` locale-aware, `DateFormat` locale-aware, currency formatting per locale, pluralization rules | 2 | I18N-01 |
| **US-I18N-04**: RTL Layout Support | `Directionality` widget, RTL-aware list views, flipped icons for back/next, text alignment | 3 | I18N-02 |
| **US-I18N-05**: Backend i18n | `nestjs-i18n` setup, validation messages per locale, email templates per locale, SMS templates | 3 | BE-INFRA |

---

## 4. Sprint Plan

> **Assumptions**: 2-week sprints, 90 SP capacity, 7-person team  
> **Total**: 249 SP / 90 SP per sprint = ~3 sprints = 6 weeks (core), +2 weeks buffer = **8 weeks**

### Sprint 1 (Weeks 1–2): Infrastructure Foundation

| Story | SP | Assigned | Status |
|-------|-----|----------|--------|
| BE-INFRA-01: Bull Queue | 5 | BE-2 | |
| BE-INFRA-02: Event Bus | 3 | BE-1 | |
| BE-INFRA-03: Response Envelope | 4 | BE-1 | |
| BE-INFRA-04: Refresh Token | 3 | BE-2 | |
| BE-INFRA-05: Redis OTP | 2 | BE-2 | |
| BE-INFRA-06: Twilio SMS | 2 | BE-1 | |
| BE-INFRA-07: Error Filters | 2 | BE-1 | |
| FLUTTER-P0-01: Localization ARB | 8 | FL-3 | |
| FLUTTER-P0-02: Semantics | 8 | FL-1, FL-2 | |
| FLUTTER-P0-03: permission_handler | 5 | FL-1 | |
| **Sprint Total** | **42** | | |

**Sprint 1 OKR**: Functional infrastructure (queue, events, envelopes, auth upgrades) + Flutter i18n/accessibility foundation.

### Sprint 2 (Weeks 3–4): Feature Core + Admin

| Story | SP | Assigned | Status |
|-------|-----|----------|--------|
| BE-CONTEST-01: Contest CRUD | 5 | BE-1 | |
| BE-CONTEST-04: Reminder Notifications | 3 | BE-2 | |
| BE-CONTEST-05: WebSocket CORS | 2 | BE-1 | |
| BE-KYC-01: KYC Provider | 4 | BE-2 | |
| BE-KYC-02: Verification Workflow | 3 | BE-2 | |
| BE-PAY-01: Payment Gateway | 5 | BE-1 | |
| BE-PAY-02: Wallet Engine | 4 | BE-1 | |
| BE-SEC-01: Rate Limiting | 3 | BE-2 | |
| BE-SEC-02: WAF Headers | 2 | BE-1 | |
| BE-SEC-04: Session Management | 3 | BE-2 | |
| BE-SEC-05: Input Sanitization | 2 | BE-1 | |
| ADMIN-ALL: (US-ADMIN-01→06) | 16 | FS-1 | |
| **Sprint Total** | **52** | | |

**Sprint 2 OKR**: All contest/kyc/payment backend endpoints operational + 6 admin pages complete + security hardening.

### Sprint 3 (Weeks 5–6): Flutter Polish + Monitoring + Tests

| Story | SP | Assigned | Status |
|-------|-----|----------|--------|
| BE-CONTEST-02: Prize Distribution | 4 | BE-1 | |
| BE-CONTEST-03: Leaderboard RT | 4 | BE-1 | |
| BE-KYC-03: Document Mgmt | 3 | BE-2 | |
| BE-KYC-04: Compliance | 2 | BE-2 | |
| BE-PAY-03: Settlement | 3 | BE-1 | |
| BE-PAY-04: Reconciliation | 3 | BE-1 | |
| BE-NOTIF-01: Push | 3 | BE-2 | |
| BE-NOTIF-02: Email | 2 | BE-2 | |
| BE-NOTIF-03: In-App | 3 | BE-1 | |
| BE-NOTIF-04: Preferences | 2 | BE-1 | |
| BE-MONITOR-01: Metrics | 4 | BE-2 | |
| BE-MONITOR-02: Grafana | 2 | BE-2 | |
| BE-MONITOR-03: Logging | 2 | BE-1 | |
| FLUTTER-P1-01: Empty States | 5 | FL-1 | |
| FLUTTER-P1-02: Offline | 5 | FL-2 | |
| FLUTTER-P1-03: Shimmer | 4 | FL-3 | |
| FLUTTER-P1-04: Error Boundaries | 3 | FL-2 | |
| FLUTTER-P1-05: Pull-to-refresh | 3 | FL-1 | |
| FLUTTER-P1-06: Deep Linking | 4 | FL-3 | |
| **Sprint Total** | **61** | | |

**Sprint 3 OKR**: Notification engine operational, monitoring live, Flutter UX polished (empty states, offline, shimmer, deep links).

### Sprint 4 (Weeks 7–8): Finalization + Release

| Story | SP | Assigned | Status |
|-------|-----|----------|--------|
| TEST-ALL: All 4 stories | 21 | QA+BE | |
| API-ALL: All 4 stories | 13 | BE-1 | |
| PERF-ALL: All 4 stories | 12 | BE-2 | |
| PROD-ALL: All 4 stories | 10 | Devops | |
| I18N-ALL: All 5 stories | 15 | FL-1, FL-2 | |
| FLUTTER-P2-01: Animations | 6 | FL-3 | |
| FLUTTER-P2-02: Skeleton | 3 | FL-2 | |
| FLUTTER-P2-03: Swipe-delete | 2 | FL-1 | |
| FLUTTER-P2-04: Optimistic UI | 4 | FL-1 | |
| FLUTTER-P2-05: Pagination | 3 | FL-3 | |
| ADMIN-07: Compensations | 2 | FS-1 | |
| BE-SEC-03: 2FA | 3 | BE-1 | |
| **Sprint Total** | **94** | | |

**Sprint 4 OKR**: 90%+ test coverage, OpenAPI docs finalized, performance optimized, production deployment ready, Flutter animations & polish complete.

---

## 5. Dependency Graph

```
Sprint 1                    Sprint 2                    Sprint 3                    Sprint 4
────────                    ────────                    ────────                    ────────

BE-INFRA ──> BE-CONTEST ──>  BE-CONTEST-02/03           BE-CONTEST-02/03
  ├──> BE-SEC-01/05          BE-PAY-01/02               BE-PAY-03/04
  ├──> BE-KYC-01/02          BE-KYC-03/04               BE-NOTIF-01─04
  ├──> BE-PAY-01/02          BE-SEC-02/04               BE-MONITOR-01─03
  ├──> API-02 (envelope)     ADMIN-01─06 (dep on BE*)   FLUTTER-P1-01─06 ──> FLUTTER-P2-01─05
  └──> TEST-01 (dep on BE*)  └──> TEST-02                │                  API-03/04
                                                         └──> TEST-03       PERF-01─04
FLUTTER-P0-01 ──> I18N-01/02                             I18N-01/02 ──> I18N-03/04/05
FLUTTER-P0-02 ──> (none, independent)                    TEST-01/02/03 ──> TEST-04
FLUTTER-P0-03 ──> US-FLUTTER-P1-02 (offline)             └──> PROD-03/04
```

**Critical Path**: BE-INFRA → BE-CONTEST → BE-PAY → TEST-ALL → PROD-03/04

**Risk of delay on critical path**: Medium. BE-INFRA is foundational and touches all backend work. If delayed, Sprint 2 backend stories shift right.

---

## 6. Development Order

### Phase 1: Foundation (Week 1, days 1–5)
**Rationale**: Everything depends on infra. Do this first or nothing compiles.

1. **BE-INFRA-01 Bull Queue** — Day 1–3 — Queue module, worker pattern, retry config
2. **BE-INFRA-02 Event Bus** — Day 2–4 (parallel) — 10 domain event definitions
3. **BE-INFRA-03 Response Envelope** — Day 3–5 — Interceptor, `ApiResponse`, `@SkipEnvelope`
4. **BE-INFRA-04 Refresh Token** — Day 3–5 (parallel) — JWT module upgrade
5. **BE-INFRA-05 Redis OTP** — Day 4–5 — OTP storage, TTL, verification
6. **BE-INFRA-06 Twilio SMS** — Day 4–5 (parallel) — Queue-based SMS sender

### Phase 2: Flutter i18n & Accessibility (Week 1–2, parallel to Phase 1)
**Rationale**: Independent frontend work — no backend dependency.

7. **FLUTTER-P0-01 ARB generation** — 8 SP — all 3 Flutter engineers
8. **FLUTTER-P0-02 Semantics** — 8 SP — semantics on 18 screens
9. **FLUTTER-P0-03 permission_handler** — 5 SP — permission flows

### Phase 3: Backend Feature Sprint (Week 2–3)
**Rationale**: All backend engineering works on feature modules once infra is stable.

10. **BE-CONTEST-01 Contest CRUD** — Full lifecycle with status machine
11. **BE-KYC-01/02** — KYC provider + verification workflow
12. **BE-PAY-01/02** — Payment gateway + wallet engine (parallel to contest)
13. **BE-SEC-01/02/04/05** — Rate limiting, headers, session, sanitization
14. **ADMIN-01→06** — Admin panel pages (parallel, depends on respective BE)

### Phase 4: Flutter UX Sprint (Week 3–4)
**Rationale**: Flutter engineers work on UX while backend stabilizes.

15. **FLUTTER-P1-01→06** — Empty states, offline, shimmer, errors, pull-refresh, deep links

### Phase 5: Notification + Monitoring (Week 4–5)
**Rationale**: Delivery layer — push, email, in-app alerts + observability.

16. **BE-NOTIF-01→04** — All notification channels
17. **BE-MONITOR-01→03** — Metrics, dashboards, logging audit

### Phase 6: Finalization (Week 6–8)
**Rationale**: Tests, docs, performance, deployment.

18. **TEST-ALL** — Unit, E2E, security, load
19. **API-ALL** — Versioning, envelope migration, OpenAPI docs
20. **PERF-ALL** — Query optimization, caching, CDN, lazy loading
21. **PROD-ALL** — SSL, secrets, CI/CD, blue/green
22. **I18N-ALL** — Language switch, RTL, formatting
23. **FLUTTER-P2-ALL** — Animations, skeletons, swipe, optimistic, pagination
24. **BE-SEC-03** — 2FA (low priority, can shift to post-launch)

---

## 7. Quality Assurance Plan

### Test Types

| Type | Tool | Target | Pass Criteria |
|------|------|--------|---------------|
| **Unit Tests** | Jest / flutter_test | All services, controllers, guards, pipes, BLoCs | ≥80% line coverage, 100% of P0 logic |
| **Integration Tests** | Supertest + test DB | All API endpoints | 200/400/401/403/404/500 all handled |
| **E2E Tests** | Playwright (web), integration_test (Flutter) | 15 full user scenarios | 100% pass, <30s per test |
| **Security Tests** | OWASP ZAP + custom | 15 attack vectors | 0 critical, 0 high findings |
| **Load Tests** | k6 / artillery | 1000 RPS sustained | p95 <500ms, 0% error rate |
| **Accessibility Tests** | axe-core, Flutter semantics tester | 18 Flutter screens + 13 admin pages | WCAG 2.1 AA compliance |

### QA Gates per Sprint

| Gate | Sprint 1 | Sprint 2 | Sprint 3 | Sprint 4 |
|------|----------|----------|----------|----------|
| Unit test pass | BE-INFRA only | All BE modules | + Flutter BLoCs | All modules |
| Integration pass | — | Contest + Auth | + KYC + Payment | All endpoints |
| E2E smoke | — | — | 5 core scenarios | All 15 scenarios |
| Security scan | — | — | 10 vectors | All 15 vectors |
| Load test | — | — | — | 1000 RPS |
| A11y audit | Flutter P0-02 | — | — | All Flutter + Admin |
| Regression | — | — | Sprint 1–2 scope | Full suite |

### Bug Triage

| Severity | Definition | SLA |
|----------|------------|-----|
| **S0: Critical** | Data loss, payment failure, security breach | Fix within 4 hours |
| **S1: High** | Major feature broken, 500 errors on key endpoints | Fix within 24 hours |
| **S2: Medium** | Non-critical feature broken, UI defect | Fix within 1 sprint |
| **S3: Low** | Cosmetic, minor UX, edge cases | Fix within 2 sprints |

---

## 8. Release Plan

### Release Cadence: 4 releases over 8 weeks

| Release | Week | Contents | Entry Criteria | Exit Criteria |
|---------|------|----------|----------------|---------------|
| **Alpha v0.1** | Week 2 | BE-INFRA 1–7, FLUTTER-P0 1–3 | All dependencies resolved | Sprint 1 stories done, infra smoke test pass |
| **Beta v0.2** | Week 4 | BE-CONTEST, BE-KYC, BE-PAY, BE-SEC, ADMIN 1–6 | Alpha stable, no S0 bugs | Sprint 2 stories done, E2E smoke pass |
| **RC v0.3** | Week 6 | BE-NOTIF, BE-MONITOR, FLUTTER-P1 1–6, BE-CONTEST 2–3, BE-PAY 3–4, BE-KYC 3–4 | Beta stable, no S0/S1 bugs | Sprint 3 stories done, security scan pass, load test pass |
| **Production v1.0** | Week 8 | TEST-ALL, API-ALL, PERF-ALL, PROD-ALL, I18N-ALL, FLUTTER-P2-ALL, ADMIN-07, BE-SEC-03 | RC stable 1 week, all S0/S1 bugs fixed | Sprint 4 stories done, full regression pass, production sign-off |

### Rollout Strategy

```
Blue/Green Deployment:

  Blue (current) ──> traffic 100%
  Green (new)    ──> deploy, health check, smoke test
  Switch         ──> route 10% → 50% → 100% over 2 hours
  Monitor        ──> 30-min observation window
  Rollback       ──> instant traffic switch back to Blue
```

### Post-Launch (Weeks 9–12)

| Activity | Owner | Duration |
|----------|-------|----------|
| Bug triage & hotfixes | All | Week 9–10 |
| Performance tuning | BE, SRE | Week 9–11 |
| Feature flags cleanup | BE, FL | Week 9–10 |
| Technical debt sprint | All | Week 11–12 |
| Retrospective & v2.0 planning | PM | Week 12 |

---

## 9. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation | Owner |
|----|------|------------|--------|------------|-------|
| R1 | BE-INFRA takes >1 sprint | Medium | High | Parallelize BE-INFRA-02/04/05/06; spike major unknowns | BE lead |
| R2 | KYC provider integration complexity | Medium | High | Start KYC spike in Sprint 1; have fallback provider | BE-2 |
| R3 | Flutter localization delays | Medium | Medium | Prioritize hi-IN + en-IN first; rest can ship post-launch | FL lead |
| R4 | Payment gateway webhook failure | Low | Critical | Webhook retry queue with dead-letter; manual reconciliation | BE-1 |
| R5 | Load test reveals p95 > 1s | Medium | High | Cache optimization in PERF; horizontal scaling plan | BE lead |
| R6 | Key team member unavailable | Low | High | Cross-training: each feature has 2 engineers capable | EM |
| R7 | Security audit critical findings | Low | Critical | External pen test in Week 5; fix window before RC | BE lead |
| R8 | App store review delays | Medium | Medium | Submit for TestFlight in Week 5; production in Week 7 | FL lead |

---

> **Next Review**: 2026-07-20 (end of Sprint 1)  
> **Owner**: CTO / Engineering Manager  
> **Governance**: Bi-weekly sprint review + daily standup (15 min)
