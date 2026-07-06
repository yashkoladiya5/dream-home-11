# Dream Home 11 — Complete Production Gap Analysis Report

**Date:** July 6, 2026
**Scope:** Full platform audit: Flutter App (83 screens) + NestJS Backend (108 endpoints) + Admin Panel (13 pages) + PostgreSQL (30+ tables) + DevOps + Security + Testing
**Method:** Line-by-line comparison of original client requirements (dream_home_11_analysis.md + schedule) vs. current implementation at `/Users/yash/Desktop/Dream11/`

---

## Overall Completion Summary

| Category | Items | ✅ Full | 🟡 Partial | ❌ Missing | Completion % |
|----------|-------|---------|------------|------------|-------------|
| Business Logic | 78 | 33 | 21 | 24 | **55%** |
| Flutter Screens | 67 | 52 | 8 | 7 | **83%** |
| Backend API | 108 | 82 | 16 | 10 | **81%** |
| Database | 45 | 18 | 11 | 16 | **53%** |
| Admin Panel | 25 | 8 | 3 | 14 | **38%** |
| Security | 30 | 14 | 6 | 10 | **56%** |
| Infrastructure | 25 | 12 | 5 | 8 | **58%** |
| Testing | 50 | 18 | 12 | 20 | **48%** |
| Deployment | 15 | 8 | 4 | 3 | **66%** |
| **TOTAL** | **443** | **245** | **86** | **112** | **64%** |

### Production Readiness Score: **64/100** ⚠️

---

## 1. Business Logic — 55% Complete

### ✅ Fully Implemented (33 items)

| # | Item | Details |
|---|------|---------|
| A2 | Contest Auto-Close (not filled) | CRON every 5min, `compensation.cron.service.ts` |
| A3 | No-Refund Compensation Slab | ₹49→120pts, ₹99→250pts, ₹199→550pts, ₹499→1500pts |
| A4 | Contest Types (normal, mega, home, private) | `ContestType` enum |
| A5 | Contest Statuses (upcoming, running, completed, cancelled) | `ContestStatus` enum |
| A6 | Private Contest + Invite Code | 8-char code generation |
| A8 | Contest Locking (max slots) | `BadRequestException` when full |
| A9 | SELECT FOR UPDATE on join | `pessimistic_write` lock |
| B6a | Daily Login Streak (+10) | `daily_login` action |
| B6b | 7-day Streak (+100) | Recurring |
| B6c | 30-day Streak (+600) | Recurring |
| B10 | Level Multiplier Tiers | Bronze(1.0), Silver(1.1), Gold(1.25), Platinum(1.5) |
| D2 | Double-Entry Ledger | Balance snapshots in transactions |
| D3 | Double-Spend Prevention | Pessimistic locks |
| D4 | Payment Order & Verification | Full Razorpay flow |
| D5 | Bonus Points on Deposit | Tiered calculation |
| E4 | Document Upload Flow | Multi-file upload |
| E5 | KYC Status Management | Pending/Approved/Rejected |
| F1 | Redis Sorted Sets | Leaderboard in Redis |
| F2 | Leaderboard Sync | PG → Redis every 5min |
| F3 | Weekly/Monthly/All-Time cycles | Full implementation |
| F4 | Points Freeze & Reset | CRON jobs |
| F5 | Leaderboard Archive | Archive table |
| H1 | Spin Wheel Daily Limit | Redis key with 24h TTL |
| H2 | Spin Wheel Tier Rewards | Bronze(10-20), Silver(15-30), Gold(20-40), Platinum(30-50) |
| H3 | Server-side Spin Result | No client tampering possible |
| I1 | Self-Referral Prevention | Device ID + same user check |
| I2 | Duplicate Device Prevention | Referral code check |
| J1 | Auto-Compensation (not filled) | CRON + slab calculation |
| J2 | Points-only compensation (no cash refund) | `calculateCompensationPoints()` |
| J3 | Push/SMS notification on compensation | FCM + SMS |

### 🟡 Partially Implemented (21 items)

| # | Item | What's Missing | Fix Priority |
|---|------|----------------|--------------|
| A1 | Contest Duration 30-45 days | No validation on contest creation | MEDIUM |
| B1a | Join Normal Contest (+50) | Configurable via `pointsToJoin`, not hardcoded 50 | LOW |
| B1b | Complete Normal Contest (+100) | **No completion points awarded** | HIGH |
| B2a | Profile Complete (+50, once) | No points trigger on profile completion | MEDIUM |
| B2b | Notification Toggle (+20, once) | Currently coded as daily (should be once per account) | MEDIUM |
| B2c | Set Reminders (+30, 1/day) | Currently awards 10pts not 30pts | LOW |
| B3a | Add Cash bonus monthly caps | No enforcement of 5/3/2 per month limits | HIGH |
| B3b | First Withdraw (+100, once) | Not implemented | MEDIUM |
| B3c | Monthly Withdraw (+50, 1/month) | Not implemented | LOW |
| B4a | Friend Signup (+30, max 10/month) | Value correct, no monthly cap | MEDIUM |
| B4b | Friend KYC (+50, max 10/month) | Value correct, no monthly cap | MEDIUM |
| B8b | Poll Vote (+20, 1/day) | Doesn't enforce 1/day limit across all polls | MEDIUM |
| D1 | Razorpay Webhook | Client-side verification only, needs server-side webhook | CRITICAL |
| G1 | State Restrictions | Only blocked in WithdrawScreen, not enforced on join/deposit | HIGH |
| G3 | Game of Skill Classification | Screens exist, no actual enforcement | LOW |
| G4 | Responsible Gaming | Info screens exist, no backend deposit caps/time limits | MEDIUM |
| I3 | Referral Bonus Structure | Missing Friend Joins Contest (+70), Friend Adds Cash (+100) | HIGH |

### ❌ Missing (24 items)

| # | Item | Severity | Design Ready? |
|---|------|----------|---------------|
| A7 | Early Entry Bonus (+20) | LOW | ✅ In report |
| B1c | Join Mega (+200) | LOW | ✅ |
| B1d | Join Home (+300) | LOW | ✅ |
| B1e | Join Private (+150) | LOW | ✅ |
| B5 | Social Share Points (15/10/20 with daily caps) | HIGH | ✅ In report |
| B7a | Account 30 Days (+200) | MEDIUM | ✅ In report |
| B7b | Account 90 Days (+500) | MEDIUM | ✅ In report |
| B7c | 10 Contests Completed (+300) | MEDIUM | ✅ In report |
| B7d | 50 Contests Completed (+1500) | MEDIUM | ✅ In report |
| B6d | No Warnings Monthly (+200) | MEDIUM | ✅ In report |
| B8c | Weekly Challenge (+50) | MEDIUM | ✅ In report |
| C1 | Warning Level 1 (-200) | HIGH | ✅ In report |
| C2 | Warning Level 2 (-1000) | HIGH | ✅ In report |
| C3 | Warning Level 3 (Account Ban) | HIGH | ✅ In report |
| C4 | Penalties Applied AFTER Multiplier | HIGH | ✅ In report |
| E1 | Third-Party KYC API (Digio/Zoop) | CRITICAL | ✅ In report |
| E2 | Aadhaar OTP Verification Flow | CRITICAL | ✅ In report |
| E3 | PAN Verification Against IT Dept | CRITICAL | ✅ In report |
| G2 | 18+ Age Verification | HIGH | ✅ In report |
| G5 | Self-Exclusion Option | MEDIUM | ✅ In report |
| F6 | Leaderboard Tie-Breaking Rules | MEDIUM | ✅ In report |
| B1f | Early Entry Bonus (+20) contest join | LOW | ✅ |
| B2d | Feed Like/Comment +50 daily cap enforcement | LOW | ✅ |
| B8a | Spin +10 to +50 tier ranges | Already ✅ | N/A |

---

## 2. Flutter Screens — 83% Complete

### Status per screen group:

| Screen Group | Count | ✅ | 🟡 | ❌ | Notes |
|-------------|-------|---|----|----|-------|
| Auth (1-4) | 4 | 4 | 0 | 0 | Splash, Language, Login, OTP |
| Dashboard (5-6) | 2 | 2 | 0 | 0 | DashboardLayout, HomeScreen |
| Contests (7-17) | 11 | 9 | 2 | 0 | RulesScreen needs offline handling |
| Rewards/Winners (18-27) | 10 | 7 | 1 | 2 | Screen 17 "Winning Rewards" & Screen 25 "My Rewards" missing |
| Leaderboard (28-30) | 3 | 3 | 0 | 0 | Full implementation |
| Wallet (31-41) | 11 | 10 | 1 | 0 | WithdrawScreen needs location gating at login |
| Profile (42-47) | 6 | 6 | 0 | 0 | Edit, Settings, Performance |
| Social (48-53) | 6 | 6 | 0 | 0 | Feed, Chat, Referral |
| Engagement (54-57) | 4 | 3 | 0 | 1 | "Filter Series" (Screen 57) missing |
| Help/Legal (58-67) | 10 | 10 | 0 | 0 | All present |
| **Requirements Total** | **67** | **60** | **4** | **3** | |
| Extra Screens Added | 16 | 16 | 0 | 0 | Admin in-app screens, compensation history, notification prefs |

### ❌ Missing Screens

| Screen # | Name | Route | What It Should Show |
|----------|------|-------|---------------------|
| Screen 17 | Winning Rewards (JoinSuccess) | `/joined` or modal | Celebration anim + confetti + contest detail + "View Live" button — Partially exists as JoinSuccessScreen but incomplete |
| Screen 25 | My Rewards | `/my-rewards` | List of user's redeemed rewards with status (processing/shipped/delivered) + delivery tracking |
| Screen 57 | Filter Series | `/filter-series` | Advanced contest filter: by date range, prize range, type, status, entry fee range |

### 🟡 Partially Implemented Screens (fixes needed)

| Screen | Issue | Fix |
|--------|-------|-----|
| Nav Drawer (Screen 6) | Missing route handlers for legal/help links | Wire all onTap handlers |
| HomeContestScreen (Screen 10) | Hardcoded sample homes | Use prizeHomeProvider API |
| ContestRunningScreen (Screen 14) | Mock activity events | Connect to WebSocket |
| WithdrawScreen (Screen 35) | KYC not enforced | Add KYC check before showing form |

---

## 3. Backend API — 81% Complete

### ❌ Missing Endpoints (8)

| # | Endpoint | Why | Severity |
|---|----------|-----|----------|
| 1 | `POST /api/v1/payments/webhook` | Server-side Razorpay webhook (current verify is client-trusted) | 🚨 CRITICAL |
| 2 | `POST /api/v1/kyc/verify-aadhaar` | Third-party API integration (Digio/Zoop) | ⚠️ HIGH |
| 3 | `POST /api/v1/kyc/verify-pan` | Third-party API integration | ⚠️ HIGH |
| 4 | `POST /api/v1/admin/users/:id/warn` | Warning system levels 1-3 | ⚠️ HIGH |
| 5 | `POST /api/v1/admin/challenges` | Weekly challenge CRUD | 🔶 MEDIUM |
| 6 | `POST /api/v1/users/self-exclude` | Responsible gaming / GDPR | 🔶 MEDIUM |
| 7 | `POST /api/v1/users/export-data` | GDPR data portability | ℹ️ LOW |
| 8 | `DELETE /api/v1/users/delete-account` | GDPR right to deletion | ℹ️ LOW |

### 🚨 Missing Rate Limiting (7 endpoints missing @Throttle)

| Endpoint | Missing Limit |
|----------|--------------|
| `POST /auth/verify-otp` | 10/min |
| `POST /polls/vote` | 5/min |
| `POST /points/action` | 10/min |
| `PATCH /users/bank-details` | 5/min |
| `POST /referral/apply` | 3/min |
| `POST /shares` | 10/min |
| `POST /support/tickets` | 5/min |

### 🚨 Missing DTOs (7 endpoints)

- `POST /payments/order`: No `CreatePaymentOrderDto` — missing `@IsNumber(), @Min(1), @Max(50000)`
- `POST /payments/verify`: No `VerifyPaymentDto` — missing `@Matches(/^pay_/)`
- `POST /payments/withdraw`: No `RequestWithdrawalDto` — missing IFSC/UPI validators
- `POST /kyc/submit`: No `SubmitKycDto` — missing `@Matches(/^\d{12}$/)` for Aadhaar
- `PATCH /users/bank-details`: No `UpdateBankDetailsDto` — missing IFSC format
- `POST /points/action`: No `PerformActionDto` — missing `@IsIn([...])` for allowed actions
- `POST /polls/vote`: No DTO — missing `@IsUUID()` for pollId

### 🚨 Missing Transactions (3 operations)

| Operation | Issue |
|-----------|-------|
| Payment verify (`payments.service.ts:46-73`) | Updates payment, addCash, awardPoints as **separate unmanaged calls**. If addCash succeeds but awardPoints fails, cash is credited without points. |
| Point action (`points.controller.ts:49-103`) | Logs point, updates balance in separate calls. If balance update fails, point log is orphaned. |
| Create private contest (`contests.service.ts:228-241`) | Creates contest, creates member, updates filledSlots — 3 separate `save()` calls. |

### 🚨 Missing Cron Jobs (3)

| Cron Job | What It Should Do |
|----------|-------------------|
| Account Age Bonus (daily) | Find users reaching 30/90 day milestones → award +200/+500 points |
| Penalty Expiry (daily) | Auto-expire warnings past `expires_at` |
| Data Retention/Purge (monthly) | Anonymize inactive users > 1 year (GDPR) |

---

## 4. Database — 53% Complete

### ❌ Missing Tables (11)

| Table | Fields | Why |
|-------|--------|-----|
| `warnings` / `penalties` | user_id, level (enum 1-3), points_deducted, reason, issued_by, expires_at, is_active | Warning system (core requirement) |
| `compensation_rules` | min_fee, max_fee, points_awarded, is_active | Currently hardcoded in service |
| `weekly_challenges` | title, description, challenge_type, points_reward, criteria_json, dates | Weekly challenge feature |
| `self_exclusions` | user_id, excluded_until, reason, auto_reinstate | Legal/Responsible gaming |
| `user_sessions` | user_id, device_id, ip_address, user_agent, last_active_at | Anti-fraud / device tracking |
| `api_audit_logs` | user_id, endpoint, method, ip, request_body, response_status | Fraud detection |
| `idempotency_keys` | key, user_id, operation, expires_at, status | Double-submit prevention |
| `payment_webhook_logs` | webhook_id, event_type, payload, signature, verified | Payment audit trail |
| `kyc_verification_attempts` | user_id, provider, document_type, request, response | KYC audit trail |
| `user_restrictions` | state_name, feature, is_restricted | State restriction management |
| `data_retention_logs` | user_id, action, initiated_by, executed_at | GDPR compliance |

### ❌ Missing Columns (16)

| Table | Missing Columns |
|-------|----------------|
| `users` | `last_login_at`, `failed_otp_attempts`, `otp_locked_until`, `is_self_excluded`, `self_excluded_until`, `restricted_state_verified`, `data_retention_date`, `deleted_at`, `phone_verified_at`, `date_of_birth` |
| `contests` | `compensation_slab_id`, `auto_closed`, `cancellation_reason`, `min_slots_required`, `early_entry_deadline` |
| `contest_members` | `penalty_points`, `warning_count`, `disqualified` |
| `point_logs` | `is_compensation`, `contest_id` |
| `transactions` | `idempotency_key` |

### ❌ Missing Indexes (6)

| Index | Table | Query Pattern |
|-------|-------|---------------|
| `(user_id, created_at)` | `point_logs` | "Points over time" for user dashboard |
| `(user_id, type, created_at)` | `transactions` | "Filter transactions by type" |
| `(status, created_at)` | `kyc` | "Pending KYC sorted by newest" |
| `(status, created_at)` | `support_tickets` | "Open tickets sorted by oldest" |
| Full-text | `users(full_name, phone)` | User search |
| `(invite_code)` | `contests` | Invite code lookup |

### ❌ Missing CHECK Constraints (5)

- `CHECK (points_balance >= 0)` on `users`
- `CHECK (wallet_balance_inr >= 0)` on `users`
- `CHECK (entry_fee_inr >= 0)` on `contests`
- `CHECK (cash_amount >= 0)` on `transactions`
- `CHECK (amount > 0)` on `withdrawals`

---

## 5. Admin Panel — 38% Complete

### ❌ Missing Pages (10)

| Page | Route | Features Needed |
|------|-------|-----------------|
| Contest Create/Edit | `/contests/new`, `/contests/:id/edit` | Form: title, type, entryFee, maxSlots, prize, rules, start/end time |
| Prize Homes CRUD | `/prize-homes` | Image gallery, spec editor, active toggle |
| Banners CRUD | `/banners` | Drag-and-drop reorder, image upload, link URL, date range |
| Warning/Penalty Management | `/penalties` | Issue warning, view history, lift penalty |
| Fraud Detection Dashboard | `/fraud` | Duplicate accounts, IP abuse, point velocity alerts |
| System Health | `/system-health` | API latency, DB pool, Redis memory, uptime |
| Payment Management | `/payments` | All transactions, filter, Razorpay details |
| Withdrawal Management | `/withdrawals` | Pending queue, approve/reject batch |
| Login History | `/login-history` | Admin logins, IP, success/failure |
| Achievement Management | `/achievements` | CRUD achievement definitions |
| Poll Management | `/polls` | Create/edit polls, view results charts |
| Data Export | `/data-export` | Export users, transactions, contests as CSV/JSON |

### ❌ Missing Admin Features (6)

| Feature | Missing |
|---------|---------|
| KYC "Request Revision" | Only approve/reject, no 3rd option to request resubmission |
| Point Freeze Management | No freeze/unfreeze per user |
| Auto-Close Management | No admin dashboard for auto-close rules |
| User Impersonation | No "Login as User" feature |
| Bulk Actions | No checkbox select + batch operations |
| Dashboard Charts | No Recharts usage on dashboard |

### ❌ Missing Permission Levels

| Role | Missing Features |
|------|-----------------|
| Super Admin | Role management, audit log deletion, financial actions |
| Moderator | Exists but lacks clear permission boundaries |
| Viewer (read-only) | Completely missing |

---

## 6. Security — 56% Complete

### 🚨 Critical Security Issues (7)

| # | Issue | Location | Risk |
|---|-------|----------|------|
| 1 | JWT expiry = 7 days (no refresh token) | `auth.module.ts:25` | Token theft gives 7-day access |
| 2 | JWT fallback secret | `auth.module.ts:21` | Production crash risk if env var missing |
| 3 | OTP stored in-memory (not Redis) | `auth.service.ts:13-16` | Lost on restart, not shared across instances |
| 4 | PAN/Aadhaar not encrypted at rest | `kyc.entity.ts:35,41` | PII leak if DB compromised |
| 5 | Bank details not encrypted at rest | `user.entity.ts:94-101` | Financial data leak |
| 6 | Phone numbers leaked in leaderboard | `leaderboard.controller.ts:254` | PII exposure to all users |
| 7 | Payment verify not atomic (no transaction) | `payments.service.ts:46-73` | Cash credited without points, or worse |

### ⚠️ High Security Issues (10)

| # | Issue | Risk |
|---|-------|------|
| 8 | Client-trusted payment verification (no webhook) | Fake payment claims |
| 9 | Missing rate limiting on 7 endpoints | DDoS / abuse |
| 10 | No fraud detection system | Multi-account, point farming, referral fraud |
| 11 | No device fingerprinting | Same device multiple accounts |
| 12 | Chat auto-bot in production (dev tool) | Unwanted bot replies to real users |
| 13 | WebSocket room cap missing | Server overload from large rooms |
| 14 | No idempotency key table | Double-submit on payment/join |
| 15 | Leaderboard exposes phone numbers | PII violation |
| 16 | No CSRF on non-JWT endpoints | CSRF attacks |
| 17 | No data retention/GDPR automation | Legal non-compliance |

---

## 7. Infrastructure — 58% Complete

### ❌ Missing Infrastructure Items

| Item | What's Needed |
|------|---------------|
| Dev docker-compose.yml | PostgreSQL 16 + Redis 7 + backend with hot-reload + admin with Vite |
| K8s ResourceQuota | limits.cpu: 40, limits.memory: 80Gi, pods: 50 |
| Secrets rotation policy | Monthly rotation of JWT_SECRET, DB_PASSWORD via Lambda |
| PostgreSQL backup script | pg_dump → S3 with lifecycle policy |
| Redis backup config | save 900 1 / save 300 10 / save 60 10000 |
| DR runbook | Failover steps, RTO=1h, RPO=15min |
| Multi-region deployment | us-west-2 with Route53 latency routing |
| Custom app metrics | Prometheus gauges for points, contests, users, deposits |
| Business metrics dashboard | Grafana: DAU/MAU, revenue, KYC funnel |
| Distributed tracing | OpenTelemetry → Grafana Tempo |
| Error budget tracking | SLO: 99.5% uptime, p95 < 500ms |
| Staging K8s parity | Migrate from Docker Compose to K8s |
| Feature branch previews | Ephemeral environment per PR |

---

## 8. Testing — 48% Complete

### ❌ Missing Tests by Category

**Unit Tests — 6 Modules with ZERO coverage:**

| Module | Risk | Lines of Code |
|--------|------|---------------|
| `payments/` | 🚨 CRITICAL — Financial transactions | ~200 |
| `users/` | ⚠️ HIGH — User data management | ~300 |
| `kyc/` | ⚠️ HIGH — Identity verification | ~150 |
| `points/points-engine.service.ts` | ⚠️ HIGH — Core scoring engine | ~250 |
| `transactions/` | ⚠️ HIGH — Financial ledger | ~100 |
| `audit/` | 🔶 MEDIUM — Audit trail | ~80 |

**E2E Tests — 15 Missing Scenarios:**

| Test | Priority |
|------|----------|
| KYC full flow (submit → approve → withdraw) | 🚨 HIGH |
| Contest auto-close + compensation | 🚨 HIGH |
| Payment webhook (simulated Razorpay) | 🚨 HIGH |
| Leaderboard sync + reset | ⚠️ HIGH |
| Admin CRUD operations | ⚠️ HIGH |
| User ban/unban | ⚠️ HIGH |
| Multi-device login | ⚠️ HIGH |
| Concurrent contest join (race condition) | 🚨 HIGH |
| Duplicate transaction prevention | 🚨 HIGH |
| OTP abuse prevention | ⚠️ HIGH |
| Referral fraud prevention | ⚠️ HIGH |
| Point cap enforcement | ⚠️ HIGH |
| State restriction enforcement | ⚠️ HIGH |
| Self-exclusion flow | 🔶 MEDIUM |
| GDPR data deletion | 🔶 MEDIUM |

**Security Tests — 15 Missing Scenarios:**

| Test | Priority |
|------|----------|
| JWT tampering | 🚨 HIGH |
| Token replay | 🚨 HIGH |
| Privilege escalation | 🚨 HIGH |
| IDOR (user A accessing user B's data) | 🚨 HIGH |
| Mass assignment | ⚠️ HIGH |
| Parameter pollution | 🔶 MEDIUM |
| CSRF | 🔶 MEDIUM |
| SSRF | 🔶 MEDIUM |
| Path traversal | ⚠️ HIGH |
| Race condition (TOCTOU) | 🚨 HIGH |
| OTP brute force | ⚠️ HIGH |
| Account enumeration | 🔶 MEDIUM |
| Bonus/points manipulation | 🚨 HIGH |
| Wallet balance manipulation | 🚨 HIGH |
| Contest result manipulation | 🚨 HIGH |

**Performance/Load Tests — Missing Scenarios:**

| Scenario | Concurrent Users | Priority |
|----------|------------------|----------|
| Normal load | 100 users, 10 req/s | ⚠️ HIGH |
| Peak load | 1000 users, 100 req/s | 🚨 HIGH |
| Burst load | 100→5000 spike | ⚠️ HIGH |
| Endurance | 500 users, 2 hours | 🔶 MEDIUM |
| Soak test | 24h sustained | 🔶 MEDIUM |
| WebSocket scaling | 500 concurrent connections | ⚠️ HIGH |

### Current Test Coverage Estimate

| Metric | Estimate |
|--------|----------|
| Line coverage | 35-45% |
| Branch coverage | 20-30% |
| Function coverage | 40-50% |

---

## 9. Deployment — 66% Complete

### ❌ Missing Deployment Items

| Item | What's Needed |
|------|---------------|
| DB migration in production deploy | `kubectl exec` migration step before traffic switch |
| Staging K8s upgrade | Migrate from Docker Compose (SSH) to K8s namespace |
| Canary release strategy | 5% traffic → monitor → 100% or auto-rollback |
| Encrypted CI/CD secrets | GitHub Environments with required reviewers |
| Fluentd S3 output configuration | Log destination currently missing |

---

## 10. Critical Issues — Must Fix Before Production

### 🚨 10 Critical (P0) Issues

| # | Issue | Category | Impact |
|---|-------|----------|--------|
| 1 | **No server-side payment webhook** — Client-trusted `POST /payments/verify` can be forged | Security/Backend | Financial loss |
| 2 | **Payment verify not in DB transaction** — If `awardPoints` fails after `addCash`, money lost | Backend | Financial inconsistency |
| 3 | **JWT expires in 7 days, no refresh token** — Token theft gives full access for a week | Security | Account takeover |
| 4 | **JWT fallback secret** — `'fallbackSecret'` in production if env var missing | Security | All tokens forgeable |
| 5 | **OTP stored in-memory** — Lost on restart, not shared across instances | Security | OTP bypass |
| 6 | **PAN/Aadhaar not encrypted at rest** — Plain text PII in database | Security/Compliance | Legal liability |
| 7 | **Bank details not encrypted at rest** — Plain text financial data | Security/Compliance | Legal liability |
| 8 | **Phone numbers exposed in leaderboard API** — PII leak to all users | Security/Compliance | GDPR violation |
| 9 | **No fraud detection system** — Multi-account, point farming, referral fraud undetected | Business/Security | Platform abuse |
| 10 | **Missing rate limiting on 7 endpoints** — OTP verify, vote, referral, points, etc. | Security | DDoS/abuse |

---

## 11. Recommended Roadmap

### Phase 1 — Critical Fixes (Week 1-2)

| Priority | Task | Effort |
|----------|------|--------|
| P0 | Server-side Razorpay webhook endpoint + fix payment transaction | 2 days |
| P0 | Shorten JWT to 15min + implement refresh token rotation | 1 day |
| P0 | Move OTP storage to Redis (from in-memory map) | 0.5 day |
| P0 | Encrypt PAN, Aadhaar, bank details at rest | 1 day |
| P0 | Remove phone numbers from leaderboard response | 0.5 day |
| P0 | Remove JWT fallback secret (crash if env var missing) | 0.5 day |
| P0 | Add missing @Throttle() decorators on 7 endpoints | 0.5 day |
| P0 | Add idempotency_keys table + double-submit prevention | 1 day |
| P0 | Write payment unit tests + payment webhook E2E test | 1 day |
| P0 | Disable chat auto-bot in production | 0.25 day |

### Phase 2 — Business Logic Completion (Week 3-4)

| Priority | Task | Effort |
|----------|------|--------|
| P1 | Warning/Penalty system (Level 1-3 with admin endpoints) | 2 days |
| P1 | Social Share Points (15/10/20 with daily caps) | 1 day |
| P1 | Seniority bonuses (30/90 day account age, 10/50 contests) | 1 day |
| P1 | Monthly caps on deposit bonuses and referral rewards | 1 day |
| P1 | Contest completion points (+100) + early entry bonus (+20) | 1 day |
| P1 | Weekly challenge system | 1.5 days |
| P1 | Leaderboard tie-breaking (combined score formula) | 0.5 day |
| P1 | Add missing DB indexes, CHECK constraints | 1 day |
| P2 | 18+ age verification (date of birth) | 1 day |
| P2 | State restriction enforcement on all money flows | 1 day |

### Phase 3 — Admin Panel Enhancement (Week 5-6)

| Priority | Task | Effort |
|----------|------|--------|
| P2 | Contest Create/Edit page | 2 days |
| P2 | KYC "Request Revision" workflow | 1 day |
| P2 | Prize Homes CRUD page | 1.5 days |
| P2 | Banners CRUD page | 1 day |
| P2 | Payment management page | 1.5 days |
| P2 | Withdrawal management page | 1 day |
| P2 | Warning/Penalty management page | 1 day |
| P2 | Permission levels (Super Admin, Moderator, Viewer) | 1 day |
| P2 | Bulk actions (select + batch operations) | 1 day |
| P3 | Dashboard charts (Recharts) | 1 day |

### Phase 4 — Hardening & Infrastructure (Week 7-8)

| Priority | Task | Effort |
|----------|------|--------|
| P2 | Third-party KYC API integration (Digio/Zoop) | 3 days |
| P2 | Fraud detection system (multi-account, IP abuse, velocity) | 3 days |
| P2 | Self-exclusion + responsible gaming limits | 1.5 days |
| P3 | GDPR data export + account deletion | 1 day |
| P3 | PostgreSQL backup scripts + retention policy | 1 day |
| P3 | DR runbook + multi-region deployment config | 2 days |
| P3 | K8s ResourceQuota + canary deployment | 1 day |
| P3 | Dev docker-compose.yml with hot-reload | 0.5 day |
| P3 | Add missing cron jobs (account age, penalty expiry, data retention) | 1 day |
| P3 | OpenTelemetry distributed tracing | 1 day |
| P3 | Business metrics Grafana dashboard | 1 day |
| P3 | Write remaining missing tests (E2E, security, performance) | 3 days |

---

## 12. Technical Debt Summary

| Category | Items | Estimated Hours |
|----------|-------|-----------------|
| Code quality (missing DTOs, validation) | 12 | 8h |
| Missing transaction wrappers | 3 | 4h |
| Missing DB indexes | 6 | 2h |
| Missing DB constraints | 5 | 1h |
| Missing DB columns | 16 | 4h |
| Missing DB tables | 11 | 14h |
| Total Technical Debt | **53 items** | **~33 hours** |

---

## 13. Final Score

| Dimension | Score |
|-----------|-------|
| Business Logic | 55/100 |
| Flutter App Screens | 83/100 |
| Backend API | 81/100 |
| Database Design | 53/100 |
| Admin Panel | 38/100 |
| Security | 56/100 |
| Infrastructure | 58/100 |
| Testing Coverage | 48/100 |
| Deployment | 66/100 |
| **Production Readiness** | **64/100** |

### Verdict
**NOT PRODUCTION-READY** ⚠️

The platform has a solid foundation (good Flutter coverage, decent API coverage) but has critical security gaps (payment verification, JWT management, PII encryption), major business logic holes (penalty system, missing point rules, missing compliance features), and insufficient testing coverage (48%).

**Estimated effort to reach 90% production readiness:** 8 weeks full-time (or 12 weeks part-time) focused on the roadmap above.

**Blockers for production launch:**
1. Payment webhook (financial integrity)
2. PII encryption (legal compliance)
3. State/age restrictions (legal compliance)
4. Fraud detection (platform abuse)
5. Testing coverage below 70%

---

*Analysis completed July 6, 2026. Full details available in agent-specific reports.*
