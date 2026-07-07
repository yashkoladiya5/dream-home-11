# Dream Home 11 — Production Completion Roadmap (Architecture-Level)

**Date:** July 7, 2026
**Baseline:** 38 backend modules, 108 endpoints, 24 admin pages, 82 Flutter screens, 31 entities
**Readiness:** ~64% (backend 72%, Flutter 65%, admin 58%, infra 75%)
**Target:** 100% production-ready
**Phases:** 20 sequential, each gates on user confirmation

---

## Key Requirements (from DREAM HOME 11.docx)

### Point Values (MUST match exactly)
| Client Spec | Code Value | Fix |
|---|---|---|
| Gold threshold = **5000** | 2000 | Fix threshold |
| Platinum threshold = **15000** | 5000 | Fix threshold |
| Normal join = **+50** | 30–500 (per contest) | Add `+50` base for normal contest join |
| Contest complete = **+100** | Not implemented | Add completion award |
| Mega join = **+200** | 100 | Fix |
| Home join = **+300** | Not implemented | Add |
| Private join = **+150** | 350 | Fix |
| Profile 100% = **+50** (once) | Not implemented | Add |
| Notification ON = **+20** (once) | 20 (daily) | Fix to once per account |
| Reminder set = **+30** (1/day) | 10 | Fix to 30 |
| Add cash ₹100 = **+20** | Not implemented | Add |
| Add cash ₹500 = **+120** | 120 | Correct |
| Add cash ₹1000 = **+300** | Not implemented | Add |
| First withdraw = **+100** (once) | Not implemented | Add |
| Monthly withdraw = **+50** (1/month) | Not implemented | Add |
| Friend signup = **+30** | 30 | Correct |
| Friend joins contest = **+70** | Not implemented | Add |
| Friend adds cash = **+100** | Not implemented | Add |
| Friend KYC = **+50** | 50 | Correct |
| App share = **+15** (3/day cap) | Not implemented | Add |
| Contest share = **+10** (5/day cap) | 5 | Fix to 10, add cap |
| Winner share = **+20** (1/day cap) | Not implemented | Add |
| 7-day streak = **+100** | 100 | Correct |
| 30-day streak = **+600** | 600 | Correct |
| No warning month = **+200** | Not implemented | Add |
| Account 30 days = **+200** | Not implemented | Add |
| Account 90 days = **+500** | Not implemented | Add |
| 10 contests = **+300** | Not implemented | Add |
| 50 contests = **+1500** | Not implemented | Add |
| Spin = **+10 to +50** | 10–50 per tier | Correct |
| Poll vote = **+20** (1/day) | 20 | Correct but missing daily cap enforcement |
| Special challenge = **+50** | Not implemented | Add |

### Non-Negotiable Rules
- No cash refunds — **points-only compensation**
- KYC mandatory before withdrawal
- Age 18+ only (verify via DOB)
- State-based restrictions on money flows
- Winner = highest TOTAL POINT (skill-based, not luck)
- Points freeze until contest ends
- Points expiry: 6–12 months
- Locked points: some points usable only in Home/Mega contests
- Monthly rank reset (points carry forward)

### Winner Logic
| Rank | Prize |
|---|---|
| 1 | HOME |
| 2 | CAR |
| 3–10 | CASH / PREMIUM REWARD |

---

## Critical Inventory & Scores

| Dimension | Score | Key Gaps |
|---|---|---|
| Business Logic | 55/100 | Point values, missing actions, no penalties, no warnings |
| Flutter Screens | 83/100 | 3 missing screens, no loading/error states on most screens |
| Backend API | 81/100 | No webhook, no fraud detection, no GDPR, missing rate limits |
| Database | 53/100 | 11 missing tables, 16 missing columns, 6 missing indexes |
| Admin Panel | 38/100 | 10 missing pages, 6 missing features, no role-based access |
| Security | 56/100 | PII plaintext, JWT 7-day expiry, OTP in-memory, weak CORS |
| Infrastructure | 58/100 | No staging K8s, no DR runbook, no distributed tracing |
| Testing | 48/100 | 22/33 modules have 0 tests, no E2E for critical flows |
| Deployment | 66/100 | No canary, no migration step in deploy, no secrets rotation |
| **Overall** | **64/100** | **NOT PRODUCTION-READY** |

---

## Phase 1: Security Hardening (P0 Critical)

**Goal:** Eliminate all critical security vulnerabilities that could lead to financial loss, data breach, or account takeover.

### Files to Inspect
- `backend/src/main.ts`
- `backend/src/payments/payments.service.ts`
- `backend/src/payments/payments.controller.ts`
- `backend/src/auth/auth.service.ts`
- `backend/src/kyc/entities/kyc.entity.ts`
- `backend/src/users/entities/user.entity.ts`
- `backend/src/leaderboard/leaderboard.controller.ts`
- `backend/src/contests/contests.gateway.ts`
- `backend/src/chat/chat.gateway.ts`
- `backend/src/common/guards/throttler-behind-proxy.guard.ts`
- `backend/src/common/filters/global-exception.filter.ts`

### Implementation Steps

#### 1.1 Remove JWT fallback secret
- `auth.module.ts`: Replace `process.env.JWT_SECRET || 'fallbackSecret'` → throw if env var missing
- Add startup validation in `main.ts`

#### 1.2 Shorten JWT expiry + implement refresh token rotation
- JWT: 7 days → **15 minutes** for access token
- Refresh token: **7 days**, single-use rotation with family-based replay detection
- Add `POST /auth/refresh` endpoint with rotation
- Add `POST /auth/logout` to blacklist refresh token family
- Add `refresh_tokens` table (already exists per Phase 5 migration)

#### 1.3 Move OTP storage to Redis
- `auth.service.ts`: Replace in-memory `Map<string, OtpData>` → Redis with 5min TTL
- Add OTP brute-force lockout: 5 failed attempts → lock 15min per phone

#### 1.4 Encrypt PII at rest
- `kyc.entity.ts`: Encrypt `aadhaarNumber`, `panNumber` fields with AES-256-GCM
- `user.entity.ts`: Encrypt `bankAccountNumber`, `ifscCode` fields
- Use `@Column({ transformer: EncryptionTransformer })` or manual encrypt/decrypt in service
- Store encryption key in environment variable (not code)

#### 1.5 Remove phone from leaderboard API
- `leaderboard.controller.ts`: Strip `phone` field from response DTO
- Create `LeaderboardEntryDto` that excludes PII

#### 1.6 Fix CORS origin
- `main.ts`: Replace `origin: '*'` with env-var based whitelist
- `contests.gateway.ts`, `chat.gateway.ts`: Replace `origin: '*'` with whitelist
- Create shared `cors.config.ts` for REST + WebSocket

#### 1.7 Add CSRF protection
- Install `csurf` or `csrf-csrf` package
- Apply double-submit cookie pattern on all non-GET routes
- **Skip for Bearer-token API routes** (only for cookie-session admin)

#### 1.8 Add rate limiting on 7 missing endpoints
- `POST /auth/verify-otp`: 10/min
- `POST /polls/vote`: 5/min
- `POST /points/action`: 10/min
- `PATCH /users/bank-details`: 5/min
- `POST /referral/apply`: 3/min
- `POST /shares`: 10/min
- `POST /support/tickets`: 5/min

#### 1.9 Disable chat auto-bot in production
- `chat.gateway.ts`: Remove or gate `autoReply` behind `NODE_ENV !== 'production'`

#### 1.10 Add Sentry breadcrumb integration
- `common/filters/global-exception.filter.ts`: Add `Sentry.addBreadcrumb()` before `Sentry.captureException()`

### API Changes
- `POST /auth/refresh` — new endpoint, returns new access + refresh tokens
- `POST /auth/logout` — revoke refresh token family
- `GET /leaderboard` — response DTO excludes `phone`
- All admin routes — `@Throttle` decorators added

### DB Changes
- `refresh_tokens` table usage: family-based rotation (new column: `family_id`, `is_revoked`)
- `users`: Add `failed_otp_attempts`, `otp_locked_until` columns
- Migration: `AddPiiEncryptionAndSecurityColumns`

### Testing Checklist
- [ ] JWT tampering test (modify token → 401)
- [ ] Refresh token replay test (use same token twice → second fails)
- [ ] OTP brute force test (5 wrong attempts → locked)
- [ ] OTP expiry test (wait 5min → invalid)
- [ ] PII encryption test (DB read shows ciphertext)
- [ ] CORS test (request from unauthorized origin → blocked)
- [ ] Rate limit test (exceed 10/min → 429)
- [ ] Chat bot disabled in production

### Acceptance Criteria
- [ ] 0 hardcoded secrets in codebase
- [ ] JWT access token expires in 15 minutes
- [ ] Refresh token rotation works (replay rejected)
- [ ] PII encrypted at rest in DB
- [ ] Phone numbers not exposed in leaderboard
- [ ] All critical rate limits applied
- [ ] CORS whitelist enforced

---

## Phase 2: Point System Correction (P0 Critical)

**Goal:** Fix all point values, tier thresholds, and missing actions to exactly match the client requirement document.

### Files to Inspect
- `backend/src/points/points-engine.service.ts` — tier thresholds, daily actions
- `backend/src/points/points.controller.ts` — action endpoint
- `backend/src/points/points.service.ts` — point balance management
- `backend/src/points/entities/point-log.entity.ts` — add missing fields
- `backend/src/gamification/gamification.service.ts` — spin wheel tiers
- `backend/src/compensation/compensation.service.ts` — compensation slabs
- `backend/src/referral/referral.service.ts` — referral rewards
- `backend/src/notifications/notifications.service.ts` — reminder reward
- `backend/src/share-tracker/share-tracker.service.ts` — share reward
- `backend/src/seed/seed.service.ts` — seed data

### Implementation Steps

#### 2.1 Fix Tier Thresholds
- `points-engine.service.ts:95-103`:
  - Gold: `>= 2000` → `>= 5000`
  - Platinum: `>= 5000` → `>= 15000`
- `points-engine.service.ts:113-115`: Fix `getNextTierInfo` thresholds

#### 2.2 Add Missing Actions to DAILY_ACTIONS
| Action | Base Points | Daily Cap | Type |
|---|---|---|---|
| `contest_complete` | 100 | — | Once per contest completion |
| `join_normal` | 50 | — | Per normal contest join |
| `join_mega` | 200 | — | Per mega contest join |
| `join_home` | 300 | — | Per home contest join |
| `join_private` | 150 | — | Per private contest join |
| `profile_complete` | 50 | 1 (lifetime) | Once per profile 100% |
| `notification_on` | 20 | 1 (lifetime) | Fix from daily to lifetime |
| `first_withdraw` | 100 | 1 (lifetime) | First successful withdrawal |
| `monthly_withdraw` | 50 | 1/month | Monthly withdrawal |
| `app_share` | 15 | 3/day | Share app |
| `contest_share` | 10 | 5/day | Share contest |
| `winner_share` | 20 | 1/day | Share winner/achievement |
| `no_warning_month` | 200 | 1/month | No warnings in calendar month |
| `challenge_complete` | 50 | — | Complete weekly challenge |
| `add_cash_100` | 20 | — | Add ₹100 cash |
| `add_cash_1000` | 300 | — | Add ₹1000 cash |
| `friend_joins_contest` | 70 | — | Referred friend joins contest |
| `friend_adds_cash` | 100 | — | Referred friend adds cash |

#### 2.3 Add Point Expiry & Freeze Fields to PointLog
- `point-log.entity.ts`: Add `expiresAt`, `frozenUntil`, `isFrozen`, `isExpired`, `source` (enum: contest/activity/wallet/referral/social/consistency/experience/gamification)

#### 2.4 Implement Locked Points System
- Add field `lockedForContestType` to PointLog (enum: home/mega/all)
- On contest join: check if user has locked points available
- Award points as locked for Home/Mega contests only

#### 2.5 Implement Early Entry Bonus
- Add `early_entry_deadline` field to Contest entity
- On join before deadline: award bonus `+20` points

#### 2.6 Add Monthly Caps
- Referral rewards: max 10/month per user
- Deposit bonuses: max 5x ₹100, 3x ₹500, 2x ₹1000 per month
- Social share: daily caps as specified

#### 2.7 Add Contest Completion Points
- `contests.service.ts`: When contest transitions to `completed`, award `+100` points to all members who joined
- Distinguished from contest join points

#### 2.8 Fix Share Reward Value
- `share-tracker.service.ts`: Change `share_contest` from 5 → 10 base points

#### 2.9 Fix Reminder Reward Value
- `notifications.service.ts`: Change `reminder_created` from 10 → 30 base points

### API Changes
- `POST /points/action` — extended to support all new action types
- `GET /points/status` — returns today's completed actions, caps remaining
- `GET /points/locked` — returns locked points by contest type
- `POST /contests/:id/join` — adds early entry bonus logic

### DB Changes
- `point_logs`: Add `expiresAt DATE`, `frozenUntil DATE`, `isFrozen BOOLEAN`, `isExpired BOOLEAN`, `source VARCHAR(50)`, `lockedForContestType VARCHAR(20)`
- `contests`: Add `early_entry_deadline TIMESTAMP`
- Migration: `AddPointLogFieldsAndFixTiers`

### Testing Checklist
- [ ] Gold threshold at 5000 (not 2000)
- [ ] Platinum threshold at 15000 (not 5000)
- [ ] Contest join awards correct points per type
- [ ] Contest complete awards +100
- [ ] Early entry bonus +20
- [ ] All referral values match spec
- [ ] Share values match spec (15/10/20)
- [ ] Monthly caps enforced (10 referrals max)
- [ ] Deposit bonus monthly caps enforced
- [ ] Locked points visible only in Home/Mega
- [ ] Point expiry test (expired points not counted)

### Acceptance Criteria
- [ ] All point values match client spec exactly
- [ ] Tier thresholds match client spec
- [ ] All 38+ actions implemented
- [ ] PointLog has expiry/freeze/source fields
- [ ] Monthly caps enforced
- [ ] Early entry bonus works
- [ ] Locked points system works

---

## Phase 3: Payment Webhook & Wallet Module (P0 Critical)

**Goal:** Replace client-trusted payment verification with server-side Razorpay webhook. Extract wallet from User entity into dedicated module. Prevent double-spend and transaction inconsistencies.

### Files to Inspect
- `backend/src/payments/payments.service.ts`
- `backend/src/payments/payments.controller.ts`
- `backend/src/transactions/transactions.service.ts`
- `backend/src/users/entities/user.entity.ts` (wallet fields)
- `backend/src/contests/contests.service.ts` (payment use)
- `backend/src/withdrawals/withdrawals.service.ts`

### New Files to Create
- `backend/src/wallet/wallet.module.ts`
- `backend/src/wallet/wallet.service.ts`
- `backend/src/wallet/wallet.controller.ts`
- `backend/src/wallet/entities/wallet.entity.ts`
- `backend/src/wallet/entities/wallet-transaction.entity.ts`
- `backend/src/wallet/dto/` (transfer, history, freeze)
- `backend/src/payments/dto/create-payment-order.dto.ts`
- `backend/src/payments/dto/verify-payment.dto.ts`

### Implementation Steps

#### 3.1 Extract Wallet Entity
- Create `Wallet` entity: `id, userId, balanceInr DECIMAL(12,2), pointsBalance INT, lockedBalance DECIMAL(12,2), version INT (optimistic lock), createdAt, updatedAt`
- Create `WalletTransaction` entity: `id, walletId, type (credit/debit), amount, balanceBefore, balanceAfter, referenceType, referenceId, description, createdAt`
- Migration: create `wallet` and `wallet_transactions` tables, migrate existing User.balance/walletBalance data

#### 3.2 Implement Razorpay Webhook Endpoint
- `POST /api/v1/payments/webhook` — new endpoint
- Verify webhook signature using `WEBHOOK_SECRET`
- Handle events: `payment.captured`, `payment.failed`
- On `payment.captured`: credit user wallet in DB transaction
- Log all webhook events in `payment_webhook_logs` table

#### 3.3 Fix Payment Verification Flow
- `payments.service.ts` `verifyPayment()`: Remove direct wallet credit (moved to webhook)
- Change to async verification: client calls `verifyPayment` → returns `{ status: 'pending' }` → webhook confirms
- Wrap all payment operations in DB transactions using `@Transactional()` or `QueryRunner`

#### 3.4 Add Idempotency Key Support
- Create `idempotency_keys` table
- On `POST /payments/order`: check idempotency key before creating order
- On `POST /contests/:id/join`: check idempotency key before joining

#### 3.5 Fix Transaction Atomicity
- Payment verify: `updatePayment → addCash → awardPoints` → wrap in single transaction
- Point action: `logPoint → updateBalance` → wrap in single transaction
- Create private contest: `createContest → createMember → updateFilledSlots` → wrap in single transaction

### API Changes
- `POST /api/v1/payments/webhook` — NEW (no auth, signature verified)
- `POST /api/v1/payments/order` — add idempotency key header support
- `POST /api/v1/payments/verify` — return async status
- `GET /api/v1/wallet/balance` — NEW
- `GET /api/v1/wallet/transactions` — NEW (paginated)
- `POST /api/v1/wallet/freeze` — NEW (freeze points for contest)
- `POST /api/v1/wallet/transfer` — NEW (transfer between wallets)

### DB Changes
- NEW: `wallet` table
- NEW: `wallet_transactions` table
- NEW: `idempotency_keys` table (key PK, user_id, operation, expires_at, status)
- NEW: `payment_webhook_logs` table
- Migration: `CreateWalletModule.sql`
- Remove `walletBalance`, `walletBalanceInr`, `pointsBalance` from `users` (migrate data to wallet)

### Testing Checklist
- [ ] Webhook signature verification (valid → process, invalid → 401)
- [ ] Payment.captured → wallet credited
- [ ] Payment.failed → no wallet change
- [ ] Idempotency key prevents double processing
- [ ] Wallet optimistic lock prevents concurrent double-spend
- [ ] Atomic transaction: partial failure rolls back all changes

### Acceptance Criteria
- [ ] No client-trusted payment verification
- [ ] Webhook handles all Razorpay events
- [ ] Wallet module extracted with dedicated tables
- [ ] All financial operations wrapped in transactions
- [ ] Idempotency prevents double-submit
- [ ] Double-spend impossible (optimistic lock + SELECT FOR UPDATE)

---

## Phase 4: Missing Backend Business Logic

**Goal:** Implement all missing business logic: warning/penalty system, social share points, seniority bonuses, contest completion awards, weekly challenges, state restrictions, age verification, self-exclusion.

### Files to Inspect
- `backend/src/admin/admin.service.ts` (warning system exists partially)
- `backend/src/admin/entities/warning.entity.ts`
- `backend/src/admin/admin.controller.ts`
- `backend/src/polls/polls.service.ts`
- `backend/src/referral/referral.service.ts`
- `backend/src/contests/contests.service.ts`
- `backend/src/users/users.service.ts`
- `backend/src/notifications/notifications.service.ts`
- `backend/src/compensation/compensation.service.ts`

### New Files to Create
- `backend/src/challenges/challenges.module.ts`
- `backend/src/challenges/challenges.service.ts`
- `backend/src/challenges/challenges.controller.ts`
- `backend/src/challenges/entities/weekly-challenge.entity.ts`
- `backend/src/challenges/dto/create-challenge.dto.ts`
- `backend/src/challenges/dto/update-challenge.dto.ts`
- `backend/src/restrictions/restrictions.module.ts`
- `backend/src/restrictions/restrictions.service.ts`
- `backend/src/restrictions/entities/state-restriction.entity.ts`
- `backend/src/restrictions/entities/user-restriction.entity.ts`
- `backend/src/gdpr/gdpr.module.ts`
- `backend/src/gdpr/gdpr.service.ts`
- `backend/src/gdpr/gdpr.controller.ts`
- `backend/src/cron/account-age-bonus.cron.ts`
- `backend/src/cron/penalty-expiry.cron.ts`
- `backend/src/cron/data-retention.cron.ts`

### Implementation Steps

#### 4.1 Complete Warning/Penalty System
- Warning Level 1: auto-deduct −200 points (applied AFTER tier multiplier)
- Warning Level 2: auto-deduct −1000 points
- Warning Level 3: account ban (all features disabled)
- Add `POST /api/v1/admin/users/:id/warn` endpoint
- Retention: warnings expire after 30 days (Level 1), 90 days (Level 2), permanent (Level 3)

#### 4.2 Implement Social Share Points
- `share-tracker.service.ts`: Add `app_share` (+15, cap 3/day), `winner_share` (+20, cap 1/day)
- Fix `contest_share` from 5 → 10 base points, add cap 5/day

#### 4.3 Implement Seniority Bonuses (Cron)
- Account age 30 days: check daily → award +200
- Account age 90 days: check daily → award +500
- 10 contests completed: check on contest completion → award +300
- 50 contests completed: check on contest completion → award +1500
- No warnings monthly: check on 1st of month → award +200

#### 4.4 Implement Weekly Challenge System
- Create `weekly_challenges` table
- Admin CRUD for challenges: title, description, type, points_reward, criteria_json, start/end date
- User tracks progress: join/complete contests, share, likes, etc.
- Award points on completion

#### 4.5 Implement State Restrictions
- `restrictions` table: state_name, feature (join/deposit/withdraw), is_restricted
- On contest join: check user's state against restrictions
- On deposit/withdraw: check user's state against restrictions
- Admin CRUD for restriction management

#### 4.6 Implement Age Verification (18+)
- Add `date_of_birth` to User entity
- On registration: require DOB, validate age ≥ 18
- Reject registration if under 18

#### 4.7 Implement Self-Exclusion
- `POST /api/v1/users/self-exclude` with duration
- Prevent login, contest join, deposit during exclusion period
- Auto-reinstate after period expires

#### 4.8 Implement GDPR Endpoints
- `POST /api/v1/users/export-data` — returns JSON of all user data
- `DELETE /api/v1/users/delete-account` — soft-delete + anonymize
- Cron: monthly data retention purge (anonymize inactive > 1 year)

### API Changes
- `POST /api/v1/admin/users/:id/warn` — Issue warning (level 1-3)
- `POST /api/v1/contests/:id/complete` — Trigger contest completion + award
- `GET /api/v1/challenges` — List active challenges
- `POST /api/v1/challenges/:id/claim` — Claim challenge reward
- `GET /api/v1/restrictions` — Get state restrictions
- `POST /api/v1/users/self-exclude` — Self-exclusion
- `POST /api/v1/users/export-data` — GDPR export
- `DELETE /api/v1/users/delete-account` — GDPR deletion
- `GET /api/v1/admin/restrictions` — List all restrictions
- `POST /api/v1/admin/restrictions` — Create restriction
- `PATCH /api/v1/admin/restrictions/:id` — Update restriction
- `DELETE /api/v1/admin/restrictions/:id` — Remove restriction

### DB Changes
- NEW: `weekly_challenges` table
- NEW: `challenge_progress` table (user_id, challenge_id, progress, completed_at)
- NEW: `state_restrictions` table
- NEW: `user_restrictions` table (self_exclusion)
- NEW: `data_retention_logs` table
- `users`: Add `date_of_birth DATE`, `is_self_excluded BOOLEAN`, `self_excluded_until TIMESTAMP`, `restricted_state_verified BOOLEAN`, `deleted_at TIMESTAMP`, `phone_verified_at TIMESTAMP`
- Migration: `AddBusinessLogicTables`

### Testing Checklist
- [ ] Warning Level 1 deducts −200 correctly
- [ ] Warning Level 2 deducts −1000 correctly
- [ ] Warning Level 3 bans account
- [ ] Warnings auto-expire
- [ ] Social share daily caps enforced
- [ ] Account age bonus awarded at 30/90 days
- [ ] Contest count bonus at 10/50 contests
- [ ] No-warning bonus on 1st of month
- [ ] Weekly challenge CRUD + award
- [ ] State restriction blocks join/deposit/withdraw
- [ ] Under-18 registration rejected
- [ ] Self-exclusion prevents login
- [ ] GDPR export returns all user data
- [ ] GDPR deletion soft-deletes + anonymizes

### Acceptance Criteria
- [ ] All missing business logic implemented
- [ ] Warning/penalty system complete (Level 1-3)
- [ ] Social share points with daily caps
- [ ] Seniority bonuses on schedule
- [ ] Weekly challenges with admin management
- [ ] State restrictions enforced
- [ ] 18+ verification on registration
- [ ] Self-exclusion + GDPR compliance

---

## Phase 5: Flutter State Management Completion

**Goal:** Add loading, error, empty states, retry logic, and offline handling to all 82 Flutter screens. Integrate localized strings (from Phase 7) into all screens.

### Files to Inspect
- `lib/core/network/base_repository.dart`
- `lib/core/widgets/` (existing shared widgets)
- `lib/features/*/presentation/screens/*.dart` (all screen files)
- `lib/features/*/presentation/providers/*.dart` (all providers)
- `lib/l10n/app_en.arb`
- `lib/generated/app_localizations.dart`

### New Files to Create
- `lib/core/widgets/app_loading_widget.dart`
- `lib/core/widgets/app_error_widget.dart`
- `lib/core/widgets/app_empty_widget.dart`
- `lib/core/widgets/app_retry_widget.dart`
- `lib/core/widgets/offline_banner.dart`
- `lib/core/mixins/state_mixin.dart` (reusable loading/error state mixin for providers)

### Implementation Steps

#### 5.1 Create Shared Widgets
- `AppLoadingWidget`: Skeleton shimmer or branded spinner
- `AppErrorWidget`: Icon + message + retry button
- `AppEmptyWidget`: Icon + message + optional CTA
- `AppRetryWidget`: Inline retry button with message
- `OfflineBanner`: Shows when connectivity changes (using `connectivity_plus`)

#### 5.2 Create State Mixin
- `StateMixin<T>`: Template for AsyncValue-based states
  - `.when(loading: ..., error: ..., data: ...)`
  - Handles `AsyncLoading`, `AsyncError`, `AsyncData`

#### 5.3 Audit and Fix Missing States
Screens with missing loading states (11 screens):
- `compensations/` — CompensationsScreen
- `share_tracker/` — ShareTrackerScreen
- `challenges/` — ChallengesScreen
- `wallet/` — BankTransferScreen
- `wallet/` — WithdrawScreen
- `spin/` — DailySpinScreen
- `polls/` — PollVoteScreen
- `winners/` — WinnersHistoryScreen
- `prize_homes/` — PrizeHomeDetailScreen
- `achievements/` — AchievementsScreen
- `notifications/` — NotificationsListScreen

Screens with missing error states (4 screens):
- `compensations/` — CompensationsScreen
- `challenges/` — ChallengesScreen
- `spin/` — DailySpinScreen
- `winners/` — WinnersHistoryScreen

Screens with missing empty states (14 screens):
- `feed/` — FeedScreen
- `chat/` — ChatListScreen
- `notifications/` — NotificationsListScreen
- `rewards/` — RewardsCatalogScreen
- `rewards/` — MyRewardsScreen
- `compensations/` — CompensationsScreen
- `share_tracker/` — ShareTrackerScreen
- `challenges/` — ChallengesScreen
- `referral/` — ReferralScreen
- `help/` — HelpCenterScreen
- `support/` — SupportTicketScreen
- `prize_homes/` — PrizeHomeListScreen
- `achievements/` — AchievementsScreen
- `wallet/` — TransactionHistoryScreen

#### 5.4 Add Retry Logic
All screens with error states must have retry button. 31 screens currently missing retry.

#### 5.5 Integrate Localized Strings
Replace all hardcoded strings across 82 screens with `AppLocalizations.of(context)!.key` references.

### Flutter Changes
- All 82 screens: wrap content in `AsyncValue.when()` pattern
- All providers: expose `AsyncValue<T>` (already Riverpod pattern)
- OfflineBanner in `DashboardLayout` scaffold
- Connectivity provider using `connectivity_plus` package

### Testing Checklist
- [ ] Each screen shows loading → data transition
- [ ] Network error shows error widget with retry
- [ ] Empty data shows empty state widget
- [ ] Offline banner appears when connectivity lost
- [ ] Retry button re-fetches data
- [ ] All hardcoded strings use localized references

### Acceptance Criteria
- [ ] 82/82 screens have loading state
- [ ] 82/82 screens have error state with retry
- [ ] 82/82 screens have empty state where applicable
- [ ] Offline banner visible on all screens
- [ ] All strings localized

---

## Phase 6: Missing Flutter Screens

**Goal:** Create the 3 missing client-required screens: Winning Rewards (Screen 17), My Rewards (Screen 25), Filter Series (Screen 57). Fix 4 partially implemented screens.

### New Files to Create
- `lib/features/contests/presentation/screens/join_success_screen.dart` (or enhance existing)
- `lib/features/rewards/presentation/screens/my_rewards_screen.dart`
- `lib/features/contests/presentation/screens/filter_series_screen.dart`

### Implementation Steps

#### 6.1 Screen 17 — Winning Rewards (JoinSuccessScreen)
- Celebration animation (confetti)
- Contest detail summary (name, type, entry fee)
- Points earned display
- Current rank in contest
- "View Live" button → navigates to contest live screen
- "Invite Friends" button → share contest link

#### 6.2 Screen 25 — My Rewards
- List of user's redeemed rewards
- Each card: reward name, points spent, status (processing/shipped/delivered), date
- Delivery tracking info if shipped
- Empty state: "No rewards redeemed yet"

#### 6.3 Screen 57 — Filter Series
- Advanced contest filter panel (bottom sheet or full screen)
- Filters: date range, prize range, contest type (normal/mega/home/private), status (upcoming/running/completed), entry fee range
- Apply/Clear buttons
- Results update in real-time as filters change

#### 6.4 Fix Partially Implemented Screens
- Nav Drawer (Screen 6): Wire all onTap handlers for legal/help links
- HomeContestScreen (Screen 10): Replace hardcoded sample homes with `prizeHomeProvider` API call
- ContestRunningScreen (Screen 14): Connect mock activity events to WebSocket
- WithdrawScreen (Screen 35): Add KYC check before showing form

### Flutter Changes
- New Riverpod providers: `filteredContestsProvider`, `myRewardsProvider`
- New route entries in `AppRouter`

### Testing Checklist
- [ ] JoinSuccessScreen shows celebration + contest detail
- [ ] MyRewardsScreen shows all redeemed rewards
- [ ] FilterSeriesScreen applies filters correctly
- [ ] Nav drawer all links navigate correctly
- [ ] HomeContestScreen loads from API
- [ ] ContestRunningScreen receives WebSocket events
- [ ] WithdrawScreen requires KYC first

### Acceptance Criteria
- [ ] All 67 client-required screens exist
- [ ] 3 missing screens fully implemented
- [ ] 4 partial screens fully fixed

---

## Phase 7: Admin Panel Completion

**Goal:** Complete all admin pages, add contest CRUD, prize homes CRUD, banner reorder, permission levels, and import all admin/API changes from Phase 2 (admin backend CRUDs).

### Files to Inspect
- `admin/src/pages/`
- `admin/src/components/`
- `admin/src/api.ts`
- `admin/src/App.tsx`
- `admin/src/Layout.tsx`
- `admin/src/types/`
- `admin/src/utils/`

### Implementation Steps

#### 7.1 Contest Create/Edit Page
- Form: title, type (dropdown), entryFee, maxSlots, prize, rules (rich text), start/end time (date-time picker)
- Validation: contest duration 30–45 days
- Draft mode before publishing

#### 7.2 Prize Homes CRUD Page
- Image gallery (upload + preview)
- Spec editor (bedrooms, bathrooms, area, location)
- Active/inactive toggle
- Display order

#### 7.3 Banners CRUD + Reorder
- Drag-and-drop reorder (react-beautiful-dnd)
- Image upload, link URL, date range
- Active/inactive per banner

#### 7.4 Warn/Penalty Management Page
- Issue warning to user (select level, write reason)
- View warning history per user
- Lift penalty button
- Fraud alert dashboard: duplicate accounts, IP abuse, point velocity

#### 7.5 Payment Management Page
- All transactions table (filterable by status, date range, amount)
- Razorpay payment ID link
- Refund button (with confirmation dialog)

#### 7.6 Withdrawal Management Page
- Pending queue with approve/reject batch actions
- View UPI/bank details
- 3-day hold check (warn if early)

#### 7.7 Role-Based Access Control
- Super Admin: full access + role management
- Moderator: user management, KYC review, warnings
- Viewer: read-only dashboard + reports

#### 7.8 Fix Admin Production URL
- `admin/src/api.ts`: Replace `https://admin.dreamhome11.com` with `process.env.VITE_API_URL`
- Add env var validation on startup

#### 7.9 Bulk Actions
- Checkbox selection on list pages
- Batch approve/reject (withdrawals, KYC)
- Batch warn users

#### 7.10 Dashboard Charts
- Add Recharts for: DAU/MAU, revenue, KYC funnel, contest completion rate

### API Changes
- All admin CRUD endpoints from Phase 2 already exist
- New: `POST /api/v1/admin/contests` — create
- New: `PATCH /api/v1/admin/contests/:id` — update
- New: `DELETE /api/v1/admin/contests/:id` — soft-delete

### UI Improvements
- Glass-morphism styling consistency across all pages
- Toast notifications for all mutations
- Loading/empty/error states on all pages
- Pagination on all list pages

### Testing Checklist
- [ ] Contest create validates all fields
- [ ] Banner drag-and-drop reorder saves
- [ ] Prize home image upload works
- [ ] Warning level dropdown + reason required
- [ ] Withdrawal approve/reject batch works
- [ ] Role-based access: moderator cannot see admin management
- [ ] Dashboard charts render with real data

### Acceptance Criteria
- [ ] All 24 admin pages complete
- [ ] Role-based access implemented (3 roles)
- [ ] Contest create/edit with validation
- [ ] Banner drag-and-drop reorder
- [ ] Payment/withdrawal management
- [ ] Dashboard with real charts

---

## Phase 8: KYC Module Completion

**Goal:** Complete KYC module with third-party API integration (Digio/Zoop), encryption, Aadhaar OTP verification, PAN verification, KYC mandatory enforcement, and admin "Request Revision" workflow.

### Files to Inspect
- `backend/src/kyc/kyc.service.ts`
- `backend/src/kyc/kyc.controller.ts`
- `backend/src/kyc/entities/kyc.entity.ts`
- `backend/src/users/users.service.ts`
- `backend/src/admin/admin.service.ts`

### New Files to Create
- `backend/src/kyc/providers/kyc-provider.interface.ts`
- `backend/src/kyc/providers/digio.provider.ts`
- `backend/src/kyc/providers/zoop.provider.ts`
- `backend/src/kyc/dto/verify-aadhaar.dto.ts`
- `backend/src/kyc/dto/verify-pan.dto.ts`

### Implementation Steps

#### 8.1 Third-Party KYC API Integration
- Create `KycProviderInterface`: `verifyAadhaar(aadhaarNumber, otp)`, `verifyPan(panNumber)`
- Implement `DigioProvider` (primary)
- Implement `ZoopProvider` (fallback)
- Configurable via env var `KYC_PROVIDER=digio|zoop`

#### 8.2 Aadhaar OTP Verification Flow
- `POST /api/v1/kyc/send-aadhaar-otp` → send OTP via Digio/Zoop to Aadhaar-linked phone
- `POST /api/v1/kyc/verify-aadhaar-otp` → verify OTP, accept if valid
- Log all attempts in `kyc_verification_attempts` table

#### 8.3 PAN Verification
- `POST /api/v1/kyc/verify-pan` → verify PAN against IT department via provider
- Accept only if name on PAN matches user name

#### 8.4 KYC Mandatory Enforcement
- Block withdrawal if KYC not approved
- Block contest join if KYC not submitted within 7 days of registration
- Block deposit > ₹2000 if KYC not approved

#### 8.5 Admin "Request Revision" Workflow
- Add `revision_requested` status to KYC status enum
- Admin can request revision with comments
- User sees revision reason and can resubmit

### API Changes
- `POST /api/v1/kyc/send-aadhaar-otp` — Send OTP via third-party
- `POST /api/v1/kyc/verify-aadhaar-otp` — Verify Aadhaar OTP
- `POST /api/v1/kyc/verify-pan` — Verify PAN
- `POST /api/v1/admin/kyc/:id/request-revision` — Request resubmission
- `POST /api/v1/admin/kyc/:id/approve` — Existing
- `POST /api/v1/admin/kyc/:id/reject` — Existing

### DB Changes
- `kyc`: Add `aadhaarVerified BOOLEAN`, `panVerified BOOLEAN`, `revisionReason TEXT`, `verificationAttempts INT`
- NEW: `kyc_verification_attempts` table

### Testing Checklist
- [ ] Aadhaar OTP sent via provider
- [ ] Valid OTP → KYC approved
- [ ] Invalid OTP → retry, max attempts lockout
- [ ] PAN verification matches user name
- [ ] Withdrawal blocked if KYC not approved
- [ ] Contest join blocked after 7 days without KYC
- [ ] Admin can request revision
- [ ] User can resubmit after revision

### Acceptance Criteria
- [ ] Third-party KYC API integrated
- [ ] Aadhaar OTP verification works
- [ ] PAN verification works
- [ ] KYC mandatory enforcement on all money flows
- [ ] Admin "Request Revision" workflow
- [ ] PII encrypted at rest

---

## Phase 9: Flutter Localization Integration

**Goal:** Replace all hardcoded strings across 82 screens with `AppLocalizations.of(context)` references. Complete Hindi translations. Add language switch UI.

### Files to Inspect
- `lib/l10n/app_en.arb` (130 keys)
- `lib/l10n/app_hi.arb`
- `lib/generated/app_localizations.dart`
- `lib/core/i18n/locale_provider.dart`
- `lib/features/*/presentation/screens/*.dart` (all 82 screens)

### Implementation Steps

#### 9.1 String Extraction
- Audit all 82 screens for hardcoded strings
- Extract to ARB keys (many strings already in ARB)
- Replace with `AppLocalizations.of(context)!.key`

#### 9.2 Complete Hindi Translations
- Audit all 130+ keys have Hindi translations
- Add missing translations (particularly for admin, how-to-play, update sections)

#### 9.3 Language Switch UI
- Add language picker in Settings screen
- Options: English, Hindi (हिन्दी)
- Persist selection in SharedPreferences (via `locale_provider.dart`)
- Apply immediately without restart

#### 9.4 RTL Support Check
- Verify Hindi text renders correctly (left-to-right for Hindi is fine)
- Test on both English and Hindi locales

### API Changes
- None (purely Flutter-side)

### Flutter Changes
- All 82 screens: string references updated
- `SettingsScreen`: Language selector dropdown

### Testing Checklist
- [ ] All screens display English correctly
- [ ] All screens display Hindi correctly
- [ ] Language switch persists after app restart
- [ ] Language switch immediately updates UI
- [ ] No missing translation keys at runtime

### Acceptance Criteria
- [ ] 0 hardcoded strings in screen files
- [ ] Hindi translations for all 130+ keys
- [ ] Language switch in settings works
- [ ] No runtime localization errors

---

## Phase 10: Notifications & Chat Completion

**Goal:** Complete push notification processor, email processor, notification preferences, chat moderation endpoints, and WebSocket room caps.

### Files to Inspect
- `backend/src/queue/processors/push-notifications.processor.ts` (already created in Phase 4)
- `backend/src/queue/processors/email.processor.ts` (already created)
- `backend/src/queue/queue.module.ts`
- `backend/src/notifications/notifications.service.ts`
- `backend/src/chat/chat.gateway.ts`
- `backend/src/chat/chat.service.ts`

### Implementation Steps

#### 10.1 Push Notification Processing
- Ensure `PushNotificationsProcessor` uses FCM token from `fcm_tokens` table
- Handle token refresh (update on send failure)
- Batch send for broadcast notifications
- Log all sends in `notification_logs` table

#### 10.2 Email Processing
- Ensure `EmailProcessor` integrates with SMTP/SES
- Handle HTML email templates
- Log sends with delivery status

#### 10.3 Notification Preferences
- Create `notification_preferences` table (or use existing)
- Per-user toggle: push, email, SMS for each notification type
- Types: contest_updates, payment_updates, kyc_updates, promotional, reminders

#### 10.4 Chat Moderation Endpoints
- `DELETE /api/v1/admin/chat/messages/:id` — delete message
- `POST /api/v1/admin/chat/users/:id/mute` — mute user in chat
- `POST /api/v1/admin/chat/users/:id/ban` — ban from chat

#### 10.5 WebSocket Room Caps
- Max 100 users per contest room
- Implement via Socket.IO `maxClients` per room or manual check

### API Changes
- `GET /api/v1/notifications/preferences` — Get user preferences
- `PATCH /api/v1/notifications/preferences` — Update preferences
- `DELETE /api/v1/admin/chat/messages/:id` — Moderation
- `POST /api/v1/admin/chat/users/:id/mute` — Mute user
- `POST /api/v1/admin/chat/users/:id/ban` — Ban from chat

### DB Changes
- NEW: `notification_preferences` table
- `fcm_tokens`: Add `lastUsedAt` for cleanup

### Testing Checklist
- [ ] Push notification sent via FCM
- [ ] Email sent via SMTP/SES
- [ ] Notification preferences saved and respected
- [ ] Admin can delete chat messages
- [ ] Muted user cannot send chat
- [ ] Banned user kicked from chat
- [ ] Room cap enforced (101st user rejected)

### Acceptance Criteria
- [ ] Push notifications work end-to-end
- [ ] Email notifications work
- [ ] Notification preferences per user
- [ ] Chat moderation endpoints functional
- [ ] WebSocket room capacity enforced

---

## Phase 11: Leaderboard & Rewards Completion

**Goal:** Complete leaderboard with tie-breaking rules, real-time push, rewards catalog CRUD, reward redemption flow.

### Files to Inspect
- `backend/src/leaderboard/leaderboard.service.ts`
- `backend/src/leaderboard/leaderboard.controller.ts`
- `backend/src/leaderboard/entities/leaderboard-archive.entity.ts`
- `backend/src/rewards/rewards.service.ts`
- `backend/src/rewards/rewards.controller.ts`
- `backend/src/rewards/entities/reward.entity.ts`
- `backend/src/rewards/entities/reward-redemption.entity.ts`
- `backend/src/contests/contests.gateway.ts`

### Implementation Steps

#### 11.1 Leaderboard Tie-Breaking
- Tie-breaker formula: `total_points → contests_completed → joined_at`
- User who joined earlier ranks higher on points tie
- Implement in `leaderboard.service.ts` query

#### 11.2 Real-Time Leaderboard Push
- On point change, emit updated leaderboard via WebSocket to contest room
- Throttle to max 1 emit per 5 seconds per contest

#### 11.3 Rewards Catalog CRUD
- Admin: create/edit/delete rewards
- Fields: name, description, points_required, stock, image, category, is_active
- User: browse catalog, filter by category

#### 11.4 Reward Redemption Flow
- User clicks "Redeem" → check points balance
- Deduct points → create redemption record (status: processing)
- Admin: view redemptions, mark as shipped/delivered
- User: view my redemptions status

#### 11.5 Flutter Rewards Screens
- `RewardsCatalogScreen`: Browse rewards with filter
- `MyRewardsScreen`: Track redemption status (Phase 6)

### API Changes
- `GET /api/v1/leaderboard` — Add `contests_completed`, `joined_at` fields for tie-breaking
- `GET /api/v1/admin/rewards` — List all (admin)
- `POST /api/v1/admin/rewards` — Create
- `PATCH /api/v1/admin/rewards/:id` — Update
- `DELETE /api/v1/admin/rewards/:id` — Delete
- `GET /api/v1/admin/rewards/redemptions` — List redemptions
- `PATCH /api/v1/admin/rewards/redemptions/:id` — Update status

### Testing Checklist
- [ ] Leaderboard tie-breaking: same points → earlier join ranks higher
- [ ] WebSocket emits leaderboard on point change
- [ ] Reward CRUD (create/update/delete)
- [ ] Reward redemption deducts points
- [ ] Redemption status shows correctly
- [ ] Stock decrement on redemption
- [ ] Out-of-stock shows "Sold out"

### Acceptance Criteria
- [ ] Leaderboard tie-breaking rules implemented
- [ ] Real-time leaderboard via WebSocket
- [ ] Rewards catalog with admin CRUD
- [ ] Full redemption flow (user + admin)
- [ ] Flutter rewards screens complete

---

## Phase 12: Withdrawal & Referral System

**Goal:** Complete withdrawal module with 3-day hold, minimum amount validation, bank account encryption, fraud detection. Complete referral system with missing bonuses (friend joins contest +70, friend adds cash +100).

### Files to Inspect
- `backend/src/withdrawals/withdrawals.service.ts`
- `backend/src/withdrawals/withdrawals.controller.ts`
- `backend/src/withdrawals/entities/withdrawal.entity.ts`
- `backend/src/referral/referral.service.ts`
- `backend/src/referral/referral.controller.ts`
- `backend/src/users/entities/user.entity.ts`

### Implementation Steps

#### 12.1 Withdrawal 3-Day Hold
- First withdrawal: must wait 3 days after registration
- Subsequent withdrawals: 24h between requests
- Implement as `earliest_withdrawal_date` check

#### 12.2 Minimum/Maximum Withdrawal
- Minimum: ₹100 (check client spec)
- Maximum: ₹10,000 per day (configurable)

#### 12.3 Bank Account Encryption
- `user.entity.ts`: Encrypt `bankAccountNumber`, `ifscCode`, `upiId` at rest
- Decrypt only in withdrawal admin view

#### 12.4 Fraud Detection on Withdrawal
- Flag if: same bank account used by multiple users
- Flag if: withdrawal requested immediately after deposit
- Flag if: IP mismatch between registration and withdrawal

#### 12.5 Referral Missing Bonuses
- `referral.service.ts`: Add `friend_joins_contest` (+70) — triggered when referred user joins contest
- Add `friend_adds_cash` (+100) — triggered when referred user adds cash
- Monthly cap: max 10 referrals per user per month

#### 12.6 Referral Fraud Prevention
- Same device check: reject if device ID matches any existing user
- IP check: reject if registration IP matches existing user
- Phone pattern: reject if phone number similar (+1 digit variation)

### API Changes
- `POST /api/v1/withdrawals` — Add validation for 3-day hold, min/max amount
- `GET /api/v1/admin/withdrawals` — Add fraud flags
- `POST /api/v1/referral/apply` — Enhanced fraud detection
- `GET /api/v1/referral/stats` — Enhanced with friend_joins_contest/+cash stats

### DB Changes
- `withdrawals`: Add `fraudFlag BOOLEAN`, `fraudReason TEXT`, `holdUntil TIMESTAMP`
- `referrals`: Add `friendJoinsContestAwarded BOOLEAN`, `friendAddsCashAwarded BOOLEAN`

### Testing Checklist
- [ ] First withdrawal blocked before 3 days
- [ ] Minimum withdrawal ₹100 enforced
- [ ] Maximum withdrawal ₹10,000/day enforced
- [ ] Bank account encrypted at rest
- [ ] Same-bank-account fraud detected
- [ ] Deposit-then-withdraw immediately flagged
- [ ] Friend joins contest awards +70
- [ ] Friend adds cash awards +100
- [ ] Monthly referral cap enforced
- [ ] Same device referral rejected

### Acceptance Criteria
- [ ] Withdrawal 3-day hold works
- [ ] Withdrawal amount limits enforced
- [ ] Bank details encrypted at rest
- [ ] Fraud detection flags suspicious withdrawals
- [ ] Referral system complete (all 4 bonuses)
- [ ] Referral fraud prevention active

---

## Phase 13: Fraud Detection & Monitoring

**Goal:** Implement comprehensive fraud detection system, monitoring dashboards, audit logging, and business metrics.

### New Files to Create
- `backend/src/fraud/fraud.module.ts`
- `backend/src/fraud/fraud.service.ts`
- `backend/src/fraud/fraud.controller.ts`
- `backend/src/fraud/entities/fraud-rule.entity.ts`
- `backend/src/fraud/dto/create-fraud-rule.dto.ts`
- `backend/src/fraud/dto/update-fraud-rule.dto.ts`
- `backend/src/monitoring/metrics.service.ts`
- `backend/src/monitoring/monitoring.module.ts`

### Implementation Steps

#### 13.1 Fraud Detection Rules Engine
- Rule-based: configurable rules with thresholds
- Built-in rules:
  - Same device multiple accounts (>3 accounts per device)
  - Point velocity (>500 points/day from non-contest actions)
  - Rapid join/leave contests (>10 join+leave in 1 hour)
  - Deposit from same UPI by multiple users
  - Withdrawal immediately after deposit (<5 minutes)
  - Known abusive IPs (blocklist)

#### 13.2 Audit Logging
- `api_audit_logs` table: log all financial + admin mutations
- Fields: user_id, endpoint, method, ip, user_agent, request_body, response_status, timestamp
- Retention: 90 days (then archive)

#### 13.3 Business Metrics
- Prometheus gauges: active_users, contest_count, pending_withdrawals, kyc_pending, fraud_alerts, daily_revenue
- Grafana dashboard: DAU/MAU, revenue, KYC funnel, contest engagement, fraud alerts

### API Changes
- `GET /api/v1/admin/fraud/rules` — List fraud rules
- `POST /api/v1/admin/fraud/rules` — Create rule
- `PATCH /api/v1/admin/fraud/rules/:id` — Update rule
- `DELETE /api/v1/admin/fraud/rules/:id` — Delete rule
- `GET /api/v1/admin/audit-logs` — View audit logs
- `GET /api/v1/admin/metrics/business` — Business metrics

### DB Changes
- NEW: `fraud_rules` table
- NEW: `api_audit_logs` table

### Testing Checklist
- [ ] Same device >3 accounts → fraud alert
- [ ] Point velocity >500/day → fraud alert
- [ ] Immediate withdrawal after deposit → fraud flag
- [ ] Audit log records all admin mutations
- [ ] Business metrics visible in Grafana

### Acceptance Criteria
- [ ] Fraud detection rules engine works
- [ ] Built-in rules active (device, velocity, timing)
- [ ] Audit logging for all financial/admin actions
- [ ] Business metrics dashboard functional

---

## Phase 14: Database Hardening

**Goal:** Add missing CHECK constraints, indexes, tables, columns. Ensure referential integrity with all FK constraints.

### Files to Inspect
- `backend/src/migrations/AddMissingSchemaFix.ts` (already created)
- `backend/src/migrations/InitialSchema.ts`

### Implementation Steps

#### 14.1 Add CHECK Constraints
```sql
ALTER TABLE users ADD CONSTRAINT chk_points_balance CHECK (points_balance >= 0);
ALTER TABLE users ADD CONSTRAINT chk_wallet_balance CHECK (wallet_balance_inr >= 0);
ALTER TABLE contests ADD CONSTRAINT chk_entry_fee CHECK (entry_fee_inr >= 0);
ALTER TABLE transactions ADD CONSTRAINT chk_amount CHECK (cash_amount >= 0);
ALTER TABLE withdrawals ADD CONSTRAINT chk_withdraw_amount CHECK (amount > 0);
```

#### 14.2 Add Missing Indexes
```sql
CREATE INDEX idx_point_logs_user_date ON point_logs (user_id, created_at);
CREATE INDEX idx_transactions_user_type ON transactions (user_id, type, created_at);
CREATE INDEX idx_kyc_status_date ON kyc (status, created_at);
CREATE INDEX idx_support_status_date ON support_tickets (status, created_at);
CREATE INDEX idx_contests_invite_code ON contests (invite_code);
CREATE INDEX idx_users_search ON users USING gin(to_tsvector('english', full_name || ' ' || phone));
```

#### 14.3 Verify All FK Constraints
- All 28 FK constraints from Phase 5 migration are in place
- Add any missing ones for: `wallet`, `challenge_progress`, `notification_preferences`

#### 14.4 Add Missing Columns
- `contests`: `min_slots_required INT DEFAULT 2`, `early_entry_deadline TIMESTAMP`
- `contest_members`: `penalty_points INT DEFAULT 0`, `warning_count INT DEFAULT 0`, `disqualified BOOLEAN DEFAULT FALSE`
- `transactions`: `idempotency_key VARCHAR(255)`

### Migration to Create
- `AddDatabaseHardening.sql`

### Testing Checklist
- [ ] All CHECK constraints reject invalid data
- [ ] All indexes used in relevant query plans
- [ ] FK constraints prevent orphaned records
- [ ] Missing columns added with correct defaults

### Acceptance Criteria
- [ ] All CHECK constraints applied
- [ ] All missing indexes created
- [ ] All FK constraints verified
- [ ] All missing columns added

---

## Phase 15: Performance Optimization

**Goal:** Fix N+1 queries, add Redis caching, optimize images, reduce bundle size, add pagination to all list endpoints.

### Files to Inspect
- `backend/src/contests/contests.service.ts`
- `backend/src/leaderboard/leaderboard.service.ts`
- `backend/src/feed/feed.service.ts`
- `backend/src/notifications/notifications.service.ts`
- `backend/src/rewards/rewards.service.ts`
- `backend/src/transactions/transactions.service.ts`
- `backend/src/admin/admin.service.ts`

### Implementation Steps

#### 15.1 N+1 Query Audit
- Check all `find()` calls for missing `relations` or `join`
- Fix with `@RelationId()` or eager joins where appropriate

#### 15.2 Redis Caching Strategy
- Cache contest list (TTL: 30s)
- Cache leaderboard (TTL: 15s) — invalidate on point change
- Cache user profile (TTL: 60s)
- Cache rewards catalog (TTL: 300s)
- Implement cache-aside pattern with manual invalidation

#### 15.3 Image Optimization
- Serve images via CDN with resize parameters
- Add lazy loading in Flutter (all `Image.network` → `cached_network_image`)
- Add thumbnail generation endpoint for uploads

#### 15.4 Flutter Bundle Optimization
- Enable tree-shaking: `--tree-shake-icons`
- Deferred loading for non-critical screens
- Remove unused assets from bundle

#### 15.5 API Pagination
- Ensure ALL list endpoints support `page`/`limit` params
- Add `X-Total-Count` header on all list responses
- Add cursor-based pagination for feed and chat

### Testing Checklist
- [ ] N+1 queries identified and fixed (check query logs)
- [ ] Redis cache hit ratio > 80% under load
- [ ] Images load with correct sizing
- [ ] Flutter bundle size < 25MB
- [ ] All list endpoints return paginated results

### Acceptance Criteria
- [ ] All N+1 queries fixed
- [ ] Redis caching implemented for high-read endpoints
- [ ] Image optimization in place
- [ ] Flutter bundle optimized
- [ ] Pagination on all list endpoints

---

## Phase 16: Testing — Backend

**Goal:** Achieve 75%+ line coverage on backend. Write unit tests for all 33 modules. Write E2E tests for critical flows.

### Files to Create
- `backend/src/**/*.spec.ts` for all 33 modules
- `test/e2e/payment.e2e-spec.ts`
- `test/e2e/auth.e2e-spec.ts`
- `test/e2e/contest.e2e-spec.ts`
- `test/e2e/kyc.e2e-spec.ts`
- `test/e2e/admin.e2e-spec.ts`
- `test/e2e/chat.e2e-spec.ts`
- `test/e2e/leaderboard.e2e-spec.ts`

### Implementation Steps

#### 16.1 Unit Tests Priority (by risk)
1. Payments module — financial transactions (~200 lines, 0 coverage)
2. Points engine — core scoring (~250 lines, 0 coverage)
3. Auth module — JWT, OTP, refresh tokens
4. KYC module — verification flow
5. Wallet module — balance transfers, concurrency
6. Admin controller — CRUD operations
7. All remaining 22 modules with 0 coverage

#### 16.2 E2E Tests
- Auth: register → OTP verify → login → refresh → logout
- Payment: create order → verify → webhook → wallet credited
- Contest: create → join → complete → points awarded → compensation
- KYC: submit docs → admin approve → withdrawal allowed
- Admin: contest CRUD → banner reorder → KYC review
- Chat: send message → receive via WebSocket → admin delete
- Leaderboard: points change → leaderboard updates → tie-breaking

#### 16.3 Security Tests
- JWT tampering
- Token replay (refresh rotation)
- IDOR (user A accessing user B's endpoint)
- Rate limiting
- SQL injection attempt
- Mass assignment

### Testing Checklist
- [ ] 33/33 modules have unit tests
- [ ] All 7 E2E spec files pass
- [ ] Security tests pass
- [ ] Coverage ≥ 75% line coverage
- [ ] Critical path tests (payment, auth, contest) always pass

### Acceptance Criteria
- [ ] Line coverage ≥ 75%
- [ ] All 33 modules tested
- [ ] All critical flows E2E tested
- [ ] Security tests pass

---

## Phase 17: Testing — Flutter

**Goal:** Achieve 60%+ line coverage on Flutter. Write widget tests for all 82 screens. Write integration tests for critical flows.

### Files to Create
- `test/widgets/` — widget tests for all screens
- `test/providers/` — provider tests for all providers
- `test/integration/` — integration tests for critical flows

### Implementation Steps

#### 17.1 Provider Tests
- `auth_provider_test.dart` — register, login, logout
- `contest_provider_test.dart` — join, leave, list, filter
- `wallet_provider_test.dart` — balance, deposit, withdraw
- `points_provider_test.dart` — earn, spend, tier
- `kyc_provider_test.dart` — submit, status check

#### 17.2 Widget Tests
- Core widgets: loading, error, empty, offline banner
- Auth screens: language select, OTP input
- Contest screens: list, detail, join, live
- Wallet screens: balance, history, deposit form
- Dashboard: home, navigation

#### 17.3 Integration Tests
- Full contest flow: enter app → browse → join → view live → complete
- Full payment flow: enter app → deposit → check balance
- KYC flow: enter app → submit KYC → wait approval → withdraw

### Testing Checklist
- [ ] All providers tested (mock repositories)
- [ ] Core widgets tested (loading, error, empty)
- [ ] Critical screens widget-tested
- [ ] Integration tests for 3 critical flows
- [ ] Coverage ≥ 60%

### Acceptance Criteria
- [ ] Provider coverage ≥ 70%
- [ ] Widget coverage for core screens
- [ ] Integration tests pass
- [ ] No regressions

---

## Phase 18: Infrastructure & DevOps

**Goal:** Complete infrastructure: K8s parity, canary deployment, secrets rotation, DR runbook, distributed tracing, performance load testing.

### Files to Inspect
- `deploy/docker-compose.yml`
- `deploy/k8s/`
- `.github/workflows/`
- `deploy/docs/`

### Implementation Steps

#### 18.1 Staging K8s Parity
- Migrate from Docker Compose to K8s in staging
- Match production setup exactly
- Feature branch previews with ephemeral namespaces

#### 18.2 Canary Deployment
- 5% traffic → 20% → 100%
- Auto-rollback if error rate > 1% or latency > 500ms p95
- Configure in GitHub Actions

#### 18.3 Secrets Rotation
- Monthly rotation of JWT_SECRET, DB_PASSWORD, ENCRYPTION_KEY
- Lambda function or GitHub Actions workflow
- Zero-downtime rotation (support old + new concurrently)

#### 18.4 DR Runbook
- RTO: 1 hour, RPO: 15 minutes
- Steps: failover PostgreSQL, Redis, backend, admin
- Documented in `deploy/docs/dr-runbook.md`

#### 18.5 Distributed Tracing
- OpenTelemetry SDK in NestJS
- Export to Grafana Tempo
- Trace samples: 10% of requests (100% for errors)

#### 18.6 Load Testing
- Normal load: 100 concurrent users, 10 req/s
- Peak load: 1000 concurrent users, 100 req/s
- Burst: 100 → 5000 spike
- WebSocket scaling: 500 concurrent connections
- k6 scripts in `test/load/`

### Testing Checklist
- [ ] Staging K8s matches production
- [ ] Canary deployment works (5% → 100%)
- [ ] Secrets rotation succeeds without downtime
- [ ] DR failover completes within 1 hour
- [ ] OpenTelemetry traces visible in Tempo
- [ ] Load test: p95 < 500ms at 1000 concurrent users

### Acceptance Criteria
- [ ] K8s staging = production parity
- [ ] Canary deployment pipeline ready
- [ ] Secrets rotation automated
- [ ] DR runbook documented and tested
- [ ] Distributed tracing enabled
- [ ] Load tests pass at 10x expected traffic

---

## Phase 19: Documentation & Compliance

**Goal:** Complete all documentation (Swagger, env vars, runbooks) and compliance requirements (GDPR, responsible gaming, legal disclaimers).

### Files to Inspect
- `deploy/docs/` (all existing docs)
- `backend/src/common/decorators/` (Swagger decorators)

### Implementation Steps

#### 19.1 Swagger/OpenAPI Completion
- Add `@ApiTags` to all controllers
- Add `@ApiBearerAuth` to all authenticated endpoints
- Add `@ApiOperation`, `@ApiResponse` decorators
- Generate OpenAPI spec on build

#### 19.2 Environment Variable Reference
- Document ALL env vars in `deploy/docs/env-reference.md`
- Include: description, type, default, required/optional, example

#### 19.3 Compliance Documentation
- GDPR: data export, deletion, retention policy documented
- Responsible gaming: self-exclusion, deposit limits, cooling periods documented
- Legal: game of skill classification, age 18+, state restrictions documented
- Add terms-of-service and privacy-policy screens in Flutter

#### 19.4 Pre-Launch Checklist
- Update `deploy/docs/pre-launch-checklist.md` with all 20 phase items
- Include sign-off for: security, compliance, performance, testing

### Testing Checklist
- [ ] All controllers have Swagger decorators
- [ ] OpenAPI spec generates without errors
- [ ] All env vars documented
- [ ] GDPR documentation complete
- [ ] Responsible gaming documentation complete
- [ ] Pre-launch checklist updated

### Acceptance Criteria
- [ ] Complete Swagger/OpenAPI documentation
- [ ] Full env var reference
- [ ] Compliance docs complete (GDPR, gaming, legal)
- [ ] Updated pre-launch checklist

---

## Phase 20: Production Release

**Goal:** Final sign-off, security audit, penetration testing, performance validation, and production deployment.

### Files to Inspect
- `deploy/docs/pre-launch-checklist.md`
- `deploy/docs/penetration-testing-guide.md`
- `deploy/k8s/production/`

### Implementation Steps

#### 20.1 Third-Party Penetration Testing
- Engage security firm for full pen test
- Scope: API, WebSocket, admin panel, Flutter app
- Fix all critical/high findings

#### 20.2 Load Testing Sign-Off
- Run full load test suite (Phase 18)
- Verify p95 < 500ms, error rate < 0.1%
- Verify auto-scaling works

#### 20.3 Security Audit Sign-Off
- All 15 security findings resolved
- No critical/high vulnerabilities open
- PII encryption verified
- Payment webhook penetration tested

#### 20.4 Compliance Review
- GDPR: data export, deletion, retention all verified
- Responsible gaming: self-exclusion, deposit limits verified
- Game of skill classification verified with legal counsel
- Age 18+ enforcement verified
- State restrictions verified

#### 20.5 Production Deployment
- Blue-green deployment (zero downtime)
- Database migration step included in deploy script
- Monitoring dashboards verified
- Rollback plan documented and tested
- Traffic switch: 0% → 10% → 50% → 100%

### Testing Checklist
- [ ] Penetration test: no critical/high findings
- [ ] Load test: p95 < 500ms at 10x traffic
- [ ] All security findings resolved
- [ ] Compliance review signed off
- [ ] Blue-green deployment tested on staging
- [ ] Rollback verified

### Acceptance Criteria
- [ ] Penetration test passed
- [ ] Load tests passed
- [ ] Security audit clean
- [ ] Compliance review complete
- [ ] Production deployed with monitoring

---

## Dependency Map

```
Phase 1 (Security)        Phase 2 (Point System)    Phase 3 (Wallet)
    │                          │                         │
    └──────────┬───────────────┘                         │
               ▼                                         │
         Phase 4 (Business Logic) ◄──────────────────────┘
               │
               ▼
         Phase 5 (Flutter States) ◄─────── Phase 9 (Localization)
               │                                  │
               ▼                                  │
         Phase 6 (Missing Screens) ────────────────┘
               │
               ▼
         Phase 7 (Admin Panel)
               │
               ▼
         Phase 8 (KYC) ◄────────────────── Phase 10 (Notifications)
               │                                  │
               ▼                                  │
         Phase 11 (Leaderboard/Rewards) ──────────┘
               │
               ▼
         Phase 12 (Withdrawal/Referral)
               │
               ▼
         Phase 13 (Fraud Detection)
               │
               ▼
         Phase 14 (DB Hardening)
               │
               ▼
         Phase 15 (Performance)
               │
               ▼
         Phase 16 (Backend Tests) ◄──────── Phase 17 (Flutter Tests)
               │                                  │
               └──────────┬───────────────────────┘
                          ▼
                    Phase 18 (Infrastructure)
                          │
                          ▼
                    Phase 19 (Documentation)
                          │
                          ▼
                    Phase 20 (Production Release)
```

Parallel tracks possible: Phase 9 (Localization) with Phase 5, Phase 14 (DB) with Phase 16.

---

## Effort Estimate

| Phase | Phase Name | Days | Risk |
|---|---|---|---|
| 1 | Security Hardening | 3 | Low (well-defined) |
| 2 | Point System Correction | 4 | Medium (business logic) |
| 3 | Payment Webhook & Wallet | 4 | High (financial) |
| 4 | Missing Business Logic | 5 | High (many features) |
| 5 | Flutter State Management | 4 | Medium (wide scope) |
| 6 | Missing Flutter Screens | 2 | Low |
| 7 | Admin Panel Completion | 5 | Medium |
| 8 | KYC Module | 3 | High (third-party API) |
| 9 | Flutter Localization | 2 | Low |
| 10 | Notifications & Chat | 2 | Low |
| 11 | Leaderboard & Rewards | 3 | Medium |
| 12 | Withdrawal & Referral | 3 | Medium |
| 13 | Fraud Detection | 3 | Medium |
| 14 | Database Hardening | 1 | Low |
| 15 | Performance Optimization | 3 | Medium |
| 16 | Testing — Backend | 5 | Medium |
| 17 | Testing — Flutter | 3 | Medium |
| 18 | Infrastructure & DevOps | 4 | Medium |
| 19 | Documentation & Compliance | 2 | Low |
| 20 | Production Release | 3 | High |
| **Total** | | **65 days** | |

---

## Risk Watch

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| Payment webhook breaks financial flow | Financial loss | Medium | Extensive E2E tests + manual QA |
| Third-party KYC API (Digio/Zoop) integration failure | Feature blocked | Medium | Build abstraction layer with fallback provider |
| Penetration test finds critical vulnerabilities | Launch delay | Medium | Phase 1 eliminates all known criticals |
| Fraud detection false positives lock users | User friction | Low | Configurable thresholds, manual override |
| Flutter localization misses strings | Incomplete UX | Low | Automated string audit before launch |
| Performance insufficient at scale | Poor UX | Medium | Load test in Phase 15 before launch |

---

## Blockers for Production Launch
1. ❌ Payment webhook (financial integrity) — Phase 3
2. ❌ PII encryption (legal compliance) — Phase 1
3. ❌ State/age restrictions (legal compliance) — Phase 4
4. ❌ Fraud detection (platform abuse) — Phase 13
5. ❌ Testing coverage below 70% — Phase 16

*Start with Phase 1: Security Hardening.*
