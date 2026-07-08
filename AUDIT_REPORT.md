# Dream Home 11 — Complete Production Audit Report

**Date:** July 7, 2026
**Scope:** Backend (37 modules) + Flutter (24 features / 88 screens) + Admin (24 pages) + Database (36 entities / 3 migrations) + Security + Testing (74 test files)
**Baseline:** Full codebase comparison against DREAM HOME 11.docx, STATUS.md, ROADMAP.md
**Do NOT modify any files without explicit approval.**

---

## Summary

| Category | Score | Critical Issues | High | Medium | Low |
|---|---|---|---|---|---|
| **Backend Logic** | 55/100 | 4 | 12 | 8 | 5 |
| **Flutter App** | 65/100 | 0 | 4 | 10 | 3 |
| **Admin Panel** | 38/100 | 0 | 3 | 5 | 6 |
| **Database** | 53/100 | 2 | 1 | 4 | 3 |
| **Security** | 56/100 | 8 | 14 | 11 | 4 |
| **Testing** | 48/100 | 0 | 10 | 5 | 3 |
| **Point Values** | 52/100 | 2 | 10 | 6 | 2 |
| **Overall** | **52/100** | **16** | **54** | **49** | **26** |

---

# SECTION 1: BACKEND MODULES (37 modules)

## ✅ Complete (6 modules)

### 1. Auth Module
`backend/src/auth/` — Controller, 3 services, entity, 4 DTOs, guards, decorators, 5 spec files
- Routes: POST request-otp, verify-otp, refresh, mock-login
- Issues: mock-login throttle 1000/min too high
- **Status: ✅ Complete** — Minor: verify-otp needs rate limiting

### 2. Chat Module
`backend/src/chat/` — Controller, 2 services, gateway, 3 entities, 3 DTOs, 3 spec files
- Routes: GET chats, chat detail, messages
- **Status: ✅ Complete** — Well-tested with gateway specs

### 3. Config Module
`backend/src/config/` — Controller, service, entity, DTO, 2 spec files
- Routes: GET/PATCH config, maintenance, features
- **Status: ✅ Complete** — Has full test coverage

### 4. Contests Module
`backend/src/contests/` — Controller, service, gateway, scheduler, 2 entities, 3 DTOs, 2 spec files
- Routes: GET contests, winners, leaderboard, POST private, join
- **Status: ✅ Complete** — Gateway tested

### 5. Referral Module
`backend/src/referral/` — Controller, service, entity, DTO, 2 spec files
- Routes: POST apply, GET stats, history
- Issues: No rate limiting on apply
- **Status: ✅ Complete** — Minor: missing friend_joins_contest (+70) and friend_adds_cash (+100)

### 6. Support Module
`backend/src/support/` — Controller, service, entity, DTO, upload config, 2 spec files
- Routes: POST/GET tickets
- Issues: No rate limiting on create
- **Status: ✅ Complete** — Well-tested

---

## ⚠️ Partial (21 modules)

### 7. Achievements Module
`backend/src/achievements/` — Controller, service, module, 2 entities, **NO DTOs, NO tests**
- Routes: GET achievements, POST check
- **Missing:** DTO, tests
- **Effort:** 0.5d

### 8. Admin Module
`backend/src/admin/` — Controller, service, module, 2 entities, 5 DTOs, **2 spec files**
- Routes: 50+ endpoints (dashboard, users, contests, KYC, banners, prizes, warnings, fraud, transactions, withdrawals, rewards, referrals, polls, reports)
- **Missing:** Many handlers use `dto: any` inline (createContest, createBanner, createReward, createPoll, broadcast)
- **Effort:** 1d

### 9. Audit Module
`backend/src/audit/` — Module, service, entity, **NO controller, NO DTOs, NO tests**
- Note: Service-only module — acceptable
- **Missing:** Tests
- **Effort:** 0.25d

### 10. Banners Module
`backend/src/banners/` — Controller, service, module, entity, **NO DTOs, NO tests**
- Routes: GET banners only
- **Missing:** DTO, tests
- **Effort:** 0.5d

### 11. Compensation Module
`backend/src/compensation/` — Service, cron service, module, entity, DTO, **1 spec file**
- No controller (used via admin)
- **Missing:** Cron service tests
- **Effort:** 0.25d

### 12. Feed Module
`backend/src/feed/` — Controller, service, rate limiter, 3 entities, 2 DTOs, **1 spec file**
- Routes: GET/POST feed, like, comment
- **Missing:** Controller test, rate limiter on mutations
- **Effort:** 0.5d

### 13. Gamification Module
`backend/src/gamification/` — Controller, service, module, **NO entities, NO DTOs, 2 spec files**
- Routes: POST spin, GET spin status
- **Missing:** No own entities, no DTOs, spin is luck-based (violates "no random luck" rule)
- **Effort:** 0.5d

### 14. Health Module
`backend/src/health/` — Controller, module, **NO service, NO DTOs, NO tests**
- Routes: GET health, ready, live, detailed
- **Missing:** Tests, no DB/Redis health check
- **Effort:** 0.25d

### 15. KYC Module
`backend/src/kyc/` — Controller, service, module, entity, upload config, **NO DTOs, NO tests**
- Routes: POST submit, GET status/details, POST upload-document
- **Missing:** DTOs, tests, Aadhaar/PAN encryption, third-party API integration
- **Effort:** 1.5d

### 16. Leaderboard Module
`backend/src/leaderboard/` — Controller, 3 services, entity, **NO DTOs, 2 spec files**
- Routes: GET leaderboard, search, contest, me, archive; POST sync, reset
- **Missing:** DTOs, controller test, leaderboard-sync tests, phone numbers exposed in responses
- **Effort:** 1d

### 17. Notifications Module
`backend/src/notifications/` — Controller, service, module, 3 entities, **NO DTOs, 2 spec files**
- Routes: POST fcm-token, CRUD reminders, GET notifications, PATCH read
- **Missing:** DTOs (inline UUID regex), no notification preferences, no throttler on mutations
- **Effort:** 1d

### 18. Payment Methods Module
`backend/src/payment-methods/` — Controller, service, module, entity, **NO DTOs, NO tests**
- Routes: GET categories, CRUD methods
- **Missing:** DTOs, tests, throttler
- **Effort:** 0.5d

### 19. Payments Module
`backend/src/payments/` — Controller, service, module, entity, **NO DTOs, NO tests**
- Routes: POST order, verify, GET history
- **Missing:** DTOs, tests, webhook endpoint, transaction atomicity
- **Effort:** 2d

### 20. Points Module
`backend/src/points/` — Controller, 3 services, module, entity, **NO DTOs, 1 spec file**
- Routes: GET today actions, streak, POST action
- **Missing:** Controller/engine tests, DTO, tier thresholds wrong
- **Effort:** 1d

### 21. Polls Module
`backend/src/polls/` — Controller, service, module, 2 entities, **NO DTOs, 2 spec files**
- Routes: GET active, results; POST vote
- **Missing:** DTOs
- **Effort:** 0.25d

### 22. Prize Homes Module
`backend/src/prize-homes/` — Controller, service, module, entity, **NO DTOs, NO tests**
- Routes: GET list, cities, featured, detail
- **Missing:** DTOs, tests
- **Effort:** 0.5d

### 23. Queue Module
`backend/src/queue/` — Module, service, constants, 6 processors, **NO tests**
- 6 processors: OTP, Push, Email, PrizeDist, Settlement, Reminders
- **Missing:** Tests for all processors
- **Effort:** 1d

### 24. Redis Module
`backend/src/redis/` — Module, cache module, 2 services, constants, logger, **1 spec file**
- **Missing:** RedisCacheService tests
- **Effort:** 0.25d

### 25. Seed Module
`backend/src/seed/` — Module, service, **NO tests**
- Utility module — acceptable
- **Effort:** 0d

### 26. Share Tracker Module
`backend/src/share-tracker/` — Controller, service, module, entity, **NO DTOs, NO tests**
- Routes: POST share, GET history, stats
- **Missing:** DTOs, tests, share values wrong (5 instead of 15/10/20)
- **Effort:** 0.5d

### 27. SMS Module
`backend/src/sms/` — Module, 2 services, **NO tests**
- Internal module — acceptable
- **Effort:** 0.25d

### 28. Transactions Module
`backend/src/transactions/` — Controller, service, module, entity, **NO DTOs, NO tests**
- Routes: GET transactions, balance
- **Missing:** DTOs, tests
- **Effort:** 0.5d

### 29. Users Module
`backend/src/users/` — Controller, service, module, entity, DTO, **NO tests**
- Routes: GET me, multiplier, stats, contests, compensations, homes, search; PATCH profile, bank-details
- **Missing:** Tests for the most critical module, GET /me returns raw entity (exposes fields), bank-details endpoint no DTO
- **Effort:** 2d

### 30. Withdrawals Module
`backend/src/withdrawals/` — Controller, service, module, entity, **NO DTOs, 1 spec file**
- Routes: POST withdraw, GET history, GET bank-details
- **Missing:** DTOs (inline body destructuring), no 3-day hold, no min/max validation
- **Effort:** 1d

---

## ❌ Missing / Critical Gaps (5 modules)

### 31. Wallet Module
**Does NOT exist as separate module** — balance stored on User entity, logic scattered across UsersService/ContestsService/WithdrawalsService
- **Missing:** Wallet entity, service, controller, transactions
- **Severity:** Critical
- **Effort:** 3d
- **Fix:** Create wallet module with optimistic locking

### 32. Challenges Module
**Does NOT exist** — No weekly challenges, no special challenges
- **Missing:** Entity, service, controller, admin CRUD
- **Severity:** Medium
- **Effort:** 2d

### 33. Fraud Detection Module
**Does NOT exist as dedicated module** — FraudAlert entity exists in admin, but no rules engine
- **Missing:** Rules engine, automated detection, dashboard
- **Severity:** High
- **Effort:** 3d

### 34. Restrictions Module
**Does NOT exist** — State restrictions partially in config, no dedicated module
- **Missing:** State restriction entities, enforcement, admin CRUD
- **Severity:** High
- **Effort:** 1d

### 35. GDPR Module
**Does NOT exist** — No data export, no account deletion
- **Missing:** Endpoints, data retention cron, anonymization
- **Severity:** High
- **Effort:** 1.5d

---

# SECTION 2: FLUTTER APP (24 features / 88 screens)

## ✅ Complete (0 modules)

None of the 24 features are fully complete — every feature is missing at least tests and some have widget/state gaps.

## ⚠️ Partial (21 features)

| Feature | Screens | Providers | Repos | Tests | Gaps | Effort |
|---|---|---|---|---|---|---|
| **achievements** | 1 | 1 | 1 | 0 | No widgets dir, no tests | 0.5d |
| **admin** | 11 | 9 | 1 | 0 | No widgets dir, no tests | 1d |
| **auth** | 4 | 2 | 1 | 0 | No widgets dir, no tests | 0.5d |
| **chat** | 4 | 2 | 2 | 0 | No widgets dir, no tests | 0.5d |
| **compensations** | 1 | 1 | 1 | 0 | Missing loading/error states | 0.5d |
| **config** | 1 | 1 | 1 | 0 | No tests | 0.25d |
| **contests** | 11 | 2 | 1 | 0 | No tests, no filter_series screen | 1.5d |
| **dashboard** | 5 | 1 | 1 | 0 | Settings inside dashboard, not standalone | 1d |
| **feed** | 2 | 2 | 1 | 0 | No widgets dir, no tests | 0.5d |
| **gamification** | 1 | 1 | 1 | 0 | Spin is luck-based, no tests | 0.5d |
| **help** | 4 | 1 | 1 | 0 | Support screen inside help, no tests | 0.5d |
| **kyc** | 1 | 2 | 1 | 0 | Single screen, needs KYC enforcement | 0.5d |
| **leaderboard** | 2 | 1 | 1 | 0 | No tests | 0.5d |
| **notifications** | 4 | 3 | 1 | 0 | Services outside data/ pattern, no tests | 1d |
| **points** | 3 | 3 | 1 | 0 | No tests | 0.5d |
| **polls** | 1 | 1 | 1 | 0 | No tests | 0.25d |
| **prize_homes** | 3 | 1 | 1 | 0 | No tests | 0.5d |
| **referral** | 1 | 1 | 1 | 0 | No tests | 0.25d |
| **rewards** | 2 | 1 | 1 | 0 | No tests, missing MyRewardsScreen | 0.5d |
| **share_tracker** | 1 | 1 | 1 | 0 | No tests | 0.25d |
| **wallet** | 10 | 8 | 1 | 0 | No tests, largest feature | 2d |
| **winners** | 2 | 1 | 1 | 0 | No tests | 0.25d |

## ❌ Missing / Critical Gaps (3 features)

### 1. Banners (no screens)
`lib/features/banners/` — Has model, repository, provider but NO screens
- **Fix:** Add banner display widget consumed by dashboard
- **Effort:** 0.5d

### 2. Legal (no providers, no models)
`lib/features/legal/` — 9 static screens, 1 repository, 0 providers, 0 models
- **Fix:** State management needed if dynamic content, otherwise acceptable
- **Effort:** 0.25d

### 3. Challenges (completely missing)
No `lib/features/challenges/` directory at all
- **Fix:** Create full feature module
- **Effort:** 2d

### Missing Screens (client-required, total: 67 required, ~64 present)
| Screen | Client # | Missing | Effort |
|---|---|---|---|
| Winning Rewards (celebration) | 17 | Partially exists as JoinSuccessScreen | 0.5d |
| My Rewards | 25 | Missing entirely | 1d |
| Filter Series | 57 | Missing entirely | 0.5d |

### Missing States Across All 88 Screens
- Loading states: **11 screens** missing
- Error states: **4 screens** missing
- Empty states: **14 screens** missing
- Retry logic: **31 screens** missing
- Localized strings: **88/88 screens** use hardcoded strings (Phase 7 ARBs exist but not integrated)
- **Effort:** 3d

---

# SECTION 3: ADMIN PANEL (24 pages)

## Overall Status: 38/100

### ✅ Complete (21 pages)
All 24 pages exist and are functional with loading, error, empty states:
- Dashboard, Login, Users, UserDetail, Contests, ContestDetail, ContestCreate, PrizeHomes, Banners, Warnings, FraudDashboard, Kyc, Config, Support, Notifications, AuditLogs, Compensations, Leaderboard, Payments, Withdrawals, Rewards, Referrals, Polls, Reports

### ⚠️ Issues Found
| Issue | File | Severity | Effort |
|---|---|---|---|
| API URL hardcoded `https://admin.dreamhome11.com` | `admin/src/lib/api.ts` | High | 0.25d |
| No test framework configured | `admin/package.json` | High | 0.5d |
| No types/ or utils/ directories | `admin/src/` | Medium | 0.25d |
| Silent error handling on UsersPage | `admin/src/pages/UsersPage.tsx` | Medium | 0.25d |
| Browser confirm() instead of Modal component | Multiple pages | Medium | 0.25d |
| PaymentsPage stats are hardcoded `"—"` | `admin/src/pages/PaymentsPage.tsx` | Medium | 0.25d |
| No error boundary component | `admin/src/` | Medium | 0.25d |
| ConfigPage save has no validation | `admin/src/pages/ConfigPage.tsx` | Medium | 0.25d |
| Some pages use raw `<table>` instead of `<Table>` component | SupportPage, AuditLogsPage | Low | 0.25d |

---

# SECTION 4: DATABASE (36 entities / 3 migrations)

## ❌ Critical Issues

### C1: KYC missing created_at and updated_at
- **Problem:** Entity has `@CreateDateColumn`/`@UpdateDateColumn`, but InitialSchema migration does not create these columns
- **File:** `backend/src/kyc/entities/kyc.entity.ts`, `backend/src/migrations/InitialSchema.ts`
- **Impact:** Any read of `kyc.createdAt` returns `undefined`
- **Effort:** 0.25d
- **Fix:** Add migration to add columns

### C2: KYC aadhaar_number/pan_number nullable conflict
- **Problem:** Entity says `nullable: true`, migration says `isNullable: false`
- **Files:** `kyc.entity.ts:30-46`, `InitialSchema.ts`
- **Impact:** DB rejects null values that entity allows
- **Effort:** 0.1d
- **Fix:** Align entity with migration or vice versa

## 🔴 High Issues

### H1: 6 Missing Foreign Keys
| Entity Relation | Missing FK | Effort |
|---|---|---|
| PollVote.poll → polls.id | `poll_votes.poll_id` | 0.1d |
| UserAchievement.achievement → achievements.id | `user_achievements.achievement_id` | 0.1d |
| Share.user → users.id | `shares.user_id` | 0.1d |
| ChatMessage.chat → chats.id | `chat_messages.chat_id` | 0.1d |
| ChatParticipant.chat → chats.id | `chat_participants.chat_id` | 0.1d |
| AuditLog.admin → users.id | `audit_logs.admin_id` | 0.1d |

## 🟡 Medium Issues

### M1: Missing index on polls.is_active
- Entity declares `@Index(['isActive'])` but no DB index exists
- **File:** `backend/src/polls/entities/poll.entity.ts:30`
- **Effort:** 0.05d

### M2: system_config.restrictedStates type mismatch
- Entity uses `simple-array` (comma-separated text), migration uses plain `text` with no default
- **File:** `backend/src/config/entities/system-config.entity.ts:50`
- **Effort:** 0.1d

### M3: 2 orphan FKs (FK exists but no entity relation)
- `fk_payments_user_id` on payments table
- `fk_audit_logs_user_id` on audit_logs table
- **Effort:** 0.1d

### M4: Zero CHECK constraints anywhere
- No `@Check()` decorators or migration CHECK constraints
- Critical for: `points_balance >= 0`, `wallet_balance_inr >= 0`, `amount > 0`
- **Effort:** 0.5d

### Missing Tables (client-required, not in any migration)
| Table | Purpose | Effort |
|---|---|---|
| `warnings` | Warning/penalty system | Exists (AddMissingSchemaFix) |
| `fraud_alerts` | Fraud detection | Exists |
| `weekly_challenges` | Weekly challenge feature | 0.5d |
| `self_exclusions` | Self-exclusion | 0.25d |
| `user_sessions` | Device tracking | 0.25d |
| `api_audit_logs` | Fraud detection | 0.25d |
| `idempotency_keys` | Double-submit prevention | 0.25d |
| `payment_webhook_logs` | Payment audit trail | 0.25d |
| `kyc_verification_attempts` | KYC audit trail | 0.25d |
| `wallet` | Wallet module | 0.5d |
| `wallet_transactions` | Wallet transactions | 0.5d |

---

# SECTION 5: SECURITY & COMPLIANCE (37 findings)

## 🚨 Critical (8)

| # | Finding | File | Fix | Effort |
|---|---|---|---|---|
| S1 | **OTP bypass via Firebase token** — OTP check skipped for non-mock tokens | `auth/auth.service.ts:52-56` | Move OTP verification before/after ALL auth flows | 0.5d |
| S2 | **No rate limiting on verify-otp** — brute-force OTP | `auth/auth.controller.ts:40-53` | Add `@Throttle()` | 0.25d |
| S3 | **Fallback JWT secret** — `'fallbackSecret'` | `auth/auth.module.ts:26` | Remove fallback, crash if env missing | 0.1d |
| S4 | **OTP bypass via mock auth** — ENABLE_MOCK_AUTH=true | `.env:20` | Default to false | 0.1d |
| S5 | **Aadhaar/PAN stored in plaintext** — PII leak | `kyc/entities/kyc.entity.ts:30-46` | Encrypt with AES-256-GCM | 1d |
| S6 | **Bank account stored in plaintext** | `users/entities/user.entity.ts:93-108` | Encrypt at rest | 0.5d |
| S7 | **Phone numbers in leaderboard API** | `contests/contests.service.ts:254-459` | Strip from responses | 0.25d |
| S8 | **OTP code logged to console** in plaintext | `auth/auth.service.ts:34-36` | Remove from logs | 0.1d |

## ⚠️ High (14)

| # | Finding | Severity | Effort |
|---|---|---|---|
| S9 | No rate limiting on refresh token | High | 0.25d |
| S10 | No rate limiting on bank-details update | High | 0.25d |
| S11 | No rate limiting on points action | High | 0.25d |
| S12 | No rate limiting on referral apply | High | 0.25d |
| S13 | No rate limiting on support tickets | High | 0.25d |
| S14 | No rate limiting on shares | High | 0.25d |
| S15 | No rate limiting on polls vote | High | 0.25d |
| S16 | Missing DTOs on bank-details (inline params) | High | 0.25d |
| S17 | Missing DTOs on withdrawal request | High | 0.25d |
| S18 | Missing DTOs on KYC submit | High | 0.25d |
| S19 | Missing DTOs on payment endpoints | High | 0.5d |
| S20 | Missing DTOs on notification register | High | 0.25d |
| S21 | Missing DTOs on points action | High | 0.25d |
| S22 | Admin updateConfig accepts `Record<string, any>` | High | 0.25d |

## 🟡 Medium (11)

| # | Finding | Effort |
|---|---|---|
| M1 | CORS permissive in non-production | 0.25d |
| M2 | CORS credentials with broad origins | 0.25d |
| M3 | WebSocket CORS same permissive logic | 0.25d |
| M4 | No authorization check on WS contest join | 0.5d |
| M5 | No authorization check on WS chat join | 0.5d |
| M6 | Phone numbers in admin API responses | 0.25d |
| M7 | User profile returns bank account unmasked | 0.25d |
| M8 | No certificate pinning in Flutter | 0.5d |
| M9 | Android manifest missing security attributes | 0.25d |
| M10 | No GDPR data export endpoint | 0.5d |
| M11 | No GDPR account deletion endpoint | 0.5d |

---

# SECTION 6: POINT VALUES (vs Client Spec)

## 🚨 Critical Mismatches

| Feature | Client | Code | File | Effort |
|---|---|---|---|---|
| **Gold threshold** | 5000 pts | 2000 pts | `points-engine.service.ts:97-98` + 6 other files | 0.5d |
| **Platinum threshold** | 15000 pts | 5000 pts | `points-engine.service.ts:97-98` + 6 other files | 0.5d |

## 🔴 High Mismatches

| Feature | Client | Code | File | Fix |
|---|---|---|---|---|
| Normal contest join | +50 | Arbitrary (30-500 per contest) | `seed.service.ts`, `contests.service.ts` | Add type-based mapping |
| Contest complete | +100 | Not implemented | — | Add in contests.service.ts |
| Mega contest join | +200 | 100 | `seed.service.ts:99` | Fix value |
| Home contest join | +300 | 120 | `seed.service.ts:162` | Fix value |
| Private contest join | +150 | 350 | `seed.service.ts:178` | Fix value |
| Reminder follow | +30 | 10 | `notifications.service.ts:17` | Fix constant |
| Friend joins contest | +70 | Not implemented | — | Add to referral.service.ts |
| Friend adds cash | +100 | Not implemented | — | Add to referral.service.ts |
| App share | +15 | 5 | `share-tracker.service.ts:7` | Fix constant |
| Contest share | +10 | 5 | `share-tracker.service.ts:7` | Add separate constant |
| Winner/achievement share | +20 | 5 | `share-tracker.service.ts:7` | Add separate constant |
| 10 contests completed | +300 | 100 | `seed.service.ts:575` | Fix bonus |
| 50 contests completed | +1500 | 500 | `seed.service.ts:583` | Fix bonus |

---

# SECTION 7: TESTING COVERAGE

## Backend: 57 test files across 34 modules
| Metric | Count |
|---|---|
| Modules WITH tests | 16 of 34 (47%) |
| Modules WITHOUT tests | 18 of 34 (53%) |
| E2E test files | 9 |
| Security test files | 4 |
| Load test scripts (k6) | 8 |

**Modules with ZERO tests (critical gaps):** achievements, audit, banners, health, kyc, payment-methods, payments, prize-homes, queue, rewards, seed, share-tracker, sms, transactions, users

## Flutter: 17 test files across 24 features
| Metric | Count |
|---|---|
| Features WITH tests | 0 of 24 (0%) |
| Core/infra test files | 13 |
| Integration test files | 1 |
| Widget test files | 1 |

**Critical gap:** Zero feature-specific tests. All tests cover core/infrastructure only.

## Admin: 0 test files
| Metric | Count |
|---|---|
| Test framework configured | No |
| Test files found | 0 |

---

# SECTION 8: CLIENT REQUIREMENT GAPS (DREAM HOME 11.docx)

## Non-Negotiable Rules Check

| Requirement | Status | Details |
|---|---|---|
| No cash refunds — points-only compensation | ✅ Done | Compensation service works |
| KYC mandatory before withdrawal | ⚠️ Partial | Enforced in WithdrawScreen but not backend-hardened |
| Age 18+ only | ❌ Missing | No DOB collection at registration |
| State-based restrictions | ⚠️ Partial | Config exists but not enforced on join/deposit |
| Winner = highest TOTAL POINT | ✅ Done | Leaderboard works on total points |
| Points freeze until contest ends | ⚠️ Partial | Cron exists but not enforced on PointLog level |
| Points expiry: 6–12 months | ❌ Missing | No expiry on PointLog entity |
| Locked points for Home/Mega contests | ❌ Missing | No implementation |
| Monthly rank reset | ✅ Done | Leaderboard reset cron exists |

## Winner Logic Check

| Rank | Prize | Implemented? |
|---|---|---|
| 1 | HOME | ⚠️ Partial — PrizeHome entity exists but winner selection not tested |
| 2 | CAR | ⚠️ Partial |
| 3–10 | CASH / PREMIUM REWARD | ⚠️ Partial |

---

# SECTION 9: COMPREHENSIVE ISSUE SUMMARY

## All Issues by Severity

### Critical (16)
1. OTP bypass via Firebase token (Security)
2. No rate limiting on verify-otp (Security)
3. Fallback JWT secret (Security)
4. OTP bypass via mock auth (Security)
5. Aadhaar/PAN stored in plaintext (Security)
6. Bank account stored in plaintext (Security)
7. Phone numbers in leaderboard API (Security)
8. OTP code logged to console (Security)
9. Gold threshold wrong: 2000 not 5000 (Point Values)
10. Platinum threshold wrong: 5000 not 15000 (Point Values)
11. KYC missing created_at/updated_at columns (Database)
12. KYC aadhaar/pan nullable conflict (Database)
13. Payment verify not in DB transaction (Backend Logic)
14. No server-side payment webhook (Backend Logic)
15. OTP stored in-memory, not Redis (Backend Logic)
16. Wallet module does not exist (Backend Logic)

### High (54) — See each section above for complete list

### Medium (49) — See each section above for complete list

### Low (26) — See each section above for complete list

---

## Effort Summary to Reach 100%

| Area | Estimated Days |
|---|---|
| Security fixes (8 critical, 14 high) | 5d |
| Point value corrections (2 critical, 10 high) | 3d |
| Backend missing logic (wallet, webhook, fraud, GDPR) | 8d |
| Database fixes (FKs, constraints, columns) | 2d |
| Flutter state management (loading/error/empty/retry) | 3d |
| Flutter missing screens (3 screens) | 2d |
| Admin fixes (URL config, tests, missing features) | 3d |
| Backend tests (18 untested modules) | 5d |
| Flutter tests (24 untested features) | 3d |
| Performance optimization (N+1, caching, bundle) | 3d |
| Documentation & compliance | 2d |
| **Total** | **~39 days** |

---

*Generated July 7, 2026. No code modifications made. Awaiting approval to proceed with Phase 1 fixes.*
