# Dream Home 11 — Complete Project Documentation

---

## 1. Project Overview

**Dream Home 11** is a mobile-first prediction contest platform where users compete for real-world prizes (cash, dream homes, etc.). Think of it like Dream11 (fantasy sports) but focused on prediction-based contests rather than fantasy teams.

The project consists of three main parts:

| Part | Technology | Purpose |
|------|-----------|---------|
| **Mobile App** | Flutter (Android + iOS) | What users download and play on |
| **Backend API** | NestJS (Node.js) + PostgreSQL + Redis | Powers everything — users, contests, payments, etc. |
| **Admin Panel** | React + Vite + TailwindCSS | Web dashboard for managing the platform |

---

## 2. Technology Stack

### Mobile App (Flutter)
- **Language:** Dart 3.8.0
- **Framework:** Flutter 3.33.0
- **State Management:** Riverpod (flutter_riverpod)
- **Routing:** go_router
- **HTTP Client:** Dio (with interceptors for auth, caching, offline)
- **Auth:** Firebase Phone Auth + Custom JWT
- **Push Notifications:** Firebase Cloud Messaging (FCM)
- **Real-time:** Socket.IO (for chat + live contests)
- **Analytics/Errors:** Sentry
- **Secure Storage:** FlutterSecureStorage
- **Connectivity:** connectivity_plus
- **Min OS:** Android 8.0 / iOS 15.0

### Backend (API Server)
- **Runtime:** Node.js (NestJS v11.0.1)
- **Database:** PostgreSQL 16 (via TypeORM with migrations)
- **Cache:** Redis (ioredis) — response cache, leaderboard sorted sets, rate limiting, daily spin locks
- **Real-time:** Socket.IO v4 (two namespaces: `/contests` for live leaderboards, `/chat` for messaging)
- **Auth:** Firebase Phone OTP + Custom JWT (7-day access tokens, no refresh tokens yet)
- **Payments:** Razorpay integration (order creation + payment verification)
- **SMS:** Mock implementation (console.log + macOS Messages) — needs Twilio integration
- **Rate Limiting:** 4 layers: global throttler (30/min), per-endpoint `@Throttle()`, per-user Redis groups, API key throttling
- **Scheduling:** @nestjs/schedule (6 cron jobs: streak reset, leaderboard sync/reset, compensation processing, reminders)
- **Background Jobs:** ❌ Not implemented — Bull/BullMQ needed for FCM, SMS, compensation
- **Event Bus:** ❌ Not implemented — `@nestjs/event-emitter` needed to decouple modules
- **API Docs:** Swagger (OpenAPI v3, dev only, bearer + apiKey auth)
- **Monitoring:** Prometheus metrics (12 custom metrics), Sentry error tracking, 4 health endpoints, periodic health metrics (30s)
- **Logging:** Pino structured JSON (requestId/correlationId via AsyncLocalStorage, redacts secrets)
- **Middleware:** Helmet (strict CSP), CORS (prod-specific origins), Compression, RequestId, CorrelationId, RequestLogging (sampled), ETag (MD5), RequestSizeLimiter
- **Error Tracking:** Sentry (>=500 only), Prometheus error counters

### Admin Panel (Web)
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** TailwindCSS
- **Charts:** Recharts
- **Icons:** Lucide React
- **HTTP:** Axios
- **Notifications:** react-hot-toast
- **Date Formatting:** date-fns

---

## 3. Flutter Mobile App — Complete Feature Breakdown

The app has **65+ screens** organized into **24 feature modules**. Every route and screen is listed below.

### 3.1 Authentication (`lib/features/auth/`)

| # | Screen | Route | What the User Sees/Does |
|---|--------|-------|------------------------|
| 1 | **SplashScreen** | `/` | App logo animation, auto-checks login status → goes to `/home` if logged in, `/language` if not |
| 2 | **LanguageScreen** | `/language` | Pick English or Hindi → proceeds to login |
| 3 | **LoginScreen** | `/login` | Enter 10-digit phone number, agree to 18+ terms → tap "Send OTP" |
| 4 | **OtpScreen** | `/otp` | Enter 6-digit OTP (auto-submit), 60s resend timer → verified → lands on home |

**How it works:**
1. User enters phone → `POST /api/v1/auth/request-otp` → SMS sent
2. User enters OTP → `POST /api/v1/auth/verify-otp` → JWT token returned
3. Token stored in secure storage → used for all subsequent API calls

---

### 3.2 Dashboard & Navigation (`lib/features/dashboard/`)

The main app shell has a **bottom navigation bar** with 5 tabs:

| Tab | Label | Screen | What It Shows |
|-----|-------|--------|---------------|
| 1 | **Home** | HomeScreen | Welcome card with username + tier, points balance, active contests, banner carousel, daily actions |
| 2 | **Contest** | ContestTab | Embedded contest lists (Our Contests, Mega Contests, Home Contests, My Contests) |
| 3 | **Wallet** | WalletTab | Balance overview, Add Cash / Withdraw quick buttons, recent transactions |
| 4 | **Rewards** | RewardsTab | Points catalog, spin wheel, achievements, leaderboard links |
| 5 | **Profile** | ProfileTab | User info, settings, KYC status, referral, help, logout |

**Additional Dashboard screens:**

| # | Screen | Route | What It Does |
|---|--------|-------|-------------|
| 5 | **DashboardLayout** | `/home` | 5-tab PageView with nav bar. Shows offline banner, notification badge |
| 6 | **HomeScreen** | (tab 0) | User profile summary, active contests, banner carousel, daily points actions |
| 7 | **EditProfileScreen** | (from settings) | Edit name, email, choose avatar from 6 options (Classic, Gamer, Winner, Elite, Volt, Star) |
| 8 | **PerformanceScreen** | `/performance` | Analytics dashboard: win rate, total points, contests played, rank distribution, tier progress charts |
| 9 | **SettingsScreen** | (from profile) | Links to: Edit Profile, Notifications, Reminders, KYC, Language, App Info, Legal, Logout |

---

### 3.3 Contests (`lib/features/contests/`) — The Core Feature

This is the main game. Users browse, join, create, and track contests.

| # | Screen | Route | What It Does |
|---|--------|-------|-------------|
| 10 | **OurContestsScreen** | `/contest/:id` | Detailed contest view: rules, leaderboard preview, join button |
| 11 | **MegaContestScreen** | `/mega-contests` | Large high-prize contests with same join flow |
| 12 | **HomeContestScreen** | `/home-contests` | Dream home prize contests — shows sample homes with values |
| 13 | **CreateContestScreen** | `/create-contest` | Form: title, entry fee (INR), points to join, max slots, prize, rules → creates contest with invite code |
| 14 | **EnterCodeScreen** | `/enter-code` | Type an invite code. Shows animated states: searching, found, full, not-found, already-joined |
| 15 | **ContestRunningScreen** | `/contest/:id/live` | Live countdown timer, real-time leaderboard via WebSocket, activity feed |
| 16 | **CompletedContestScreen** | `/contest/:id/completed` | Animated results: podium for top 3, full leaderboard, user's rank + points |
| 17 | **MyHomeContestScreen** | `/my-contests` | List of contests the user has joined. Empty state → browse button |
| 18 | **ContestRulesScreen** | (modal) | Shows full contest rules. "I Agree" button to join |
| 19 | **JoinSuccessScreen** | (modal) | Confetti animation, shows contest details, "View Live" button |
| 20 | **ContestListScreen** | (embedded) | Filterable/sortable contest list used inside tabs |

**Contest Types:**
- **Our Contests** — Standard prediction contests
- **Mega Contests** — Larger entry fees, bigger prizes
- **Home Contests** — Special contests where prize is a dream home
- **Private Contests** — Created by users, joined via invite code

**How joining works:**
1. User taps "Join" on a contest
2. If rules exist → user sees ContestRulesScreen first
3. Entry fee deducted from wallet
4. User added to contest members
5. Real-time updates via WebSocket during live phase
6. When contest ends → results shown on CompletedContestScreen

---

### 3.4 Wallet & Payments (`lib/features/wallet/`)

| # | Screen | Route | What It Does |
|---|--------|-------|-------------|
| 21 | **WalletScreen** | `/wallet` | Balance overview, Add Cash / Withdraw buttons, recent transactions |
| 22 | **MyBalanceScreen** | `/my-balance` | Detailed breakdown: cash vs points vs bonus. Tier progress bar |
| 23 | **AddCashScreen** | `/add-cash` | Quick amounts (₹100–₹2000) or custom entry. Payment method selector |
| 24 | **PaymentOptionsScreen** | `/payment-options` | Saved cards/UPI. Add new via bottom sheet |
| 25 | **WithdrawScreen** | `/withdraw` | Withdrawal form (₹100–₹5000). Shows restricted states (Assam, Odisha, Telangana). Checks KYC required |
| 26 | **WithdrawHistoryScreen** | `/withdraw-history` | Past withdrawals with status (Pending/Processed/Failed/Rejected) |
| 27 | **ManagePaymentScreen** | `/manage-payment` | Tabbed: Bank Details (account holder, number, IFSC) or UPI ID. Save/edit/delete |
| 28 | **ContestTransactionsScreen** | `/transactions/contest` | Filtered: entry fees paid, points earned from contests |
| 29 | **DepositTransactionsScreen** | `/transactions/deposit` | Filtered: money added, bonus points received |
| 30 | **OtherTransactionsScreen** | `/transactions/others` | Filtered: withdrawals, redemptions, referral earnings |

**Payment Flow:**
1. User taps "Add Cash" → selects amount + payment method
2. `POST /api/v1/payments/order` → creates Razorpay order
3. Razorpay checkout opens → user pays
4. `POST /api/v1/payments/verify` → verifies payment + credits wallet
5. Bonus points may be awarded based on deposit amount

---

### 3.5 KYC (Identity Verification) (`lib/features/kyc/`)

| # | Screen | Route | What It Does |
|---|--------|-------|-------------|
| 31 | **KycDetailsScreen** | `/kyc` | Enter Aadhaar number, PAN card, full name. Upload document images (Aadhaar front/back, PAN card, selfie). Submit for admin verification |

**KYC Statuses:** Not Submitted → Pending → Verified / Rejected

**Documents required:**
- Aadhaar Card (front + back images)
- PAN Card (image)
- Selfie
- Name, Aadhaar number, PAN number

---

### 3.6 Rewards & Points (`lib/features/rewards/`, `lib/features/points/`)

| # | Screen | Route | What It Does |
|---|--------|-------|-------------|
| 32 | **RewardsCatalogScreen** | `/rewards` | Grid of redeemable items (gift cards, merchandise) with points cost |
| 33 | **RewardDetailScreen** | `/rewards/:id` | Full reward info + Redeem button |
| 34 | **EarnPointsScreen** | `/earn-points` | Daily actions checklist: open app, share, vote, spin, comment. Each action gives points |
| 35 | **MultiplierScreen** | `/multiplier` | Shows tier multipliers: Bronze 1.0× → Silver 1.1× → Gold 1.25× → Platinum 1.5× |
| 36 | **StreakScreen** | `/streak` | Login streak calendar (7-day view), current/best streak, bonus points |

**Points System:**
- Earn points by: logging in daily, sharing app, voting in polls, spinning wheel, commenting on feed
- Points have **multipliers** based on user tier
- Points can be **redeemed** for rewards in the catalog
- **Streaks** give bonus points for consecutive daily logins

---

### 3.7 Leaderboard (`lib/features/leaderboard/`)

| # | Screen | Route | What It Does |
|---|--------|-------|-------------|
| 37 | **LeaderboardScreen** | `/leaderboard` | Global rankings with infinite scroll. Search by username. Highlights current user |
| 38 | **SeriesLeaderboardScreen** | `/series-leaderboard` | Tabbed: All Time / Weekly / Monthly / Custom event series |

---

### 3.8 Social Features

#### Feed & People (`lib/features/feed/`)

| # | Screen | Route | What It Does |
|---|--------|-------|-------------|
| 39 | **FeedScreen** | `/feed` | Infinite-scrolling social feed. Posts with images, like button, comments |
| 40 | **FindPeopleScreen** | `/find-people` | Search users by name/phone. Results with avatars |

#### Chat (`lib/features/chat/`)

| # | Screen | Route | What It Does |
|---|--------|-------|-------------|
| 41 | **ChatDebugScreen** | `/chat` | Developer tool: test Socket.IO connection, send raw messages |
| 42 | **ChatListScreen** | `/conversations` | Active conversations with last message, unread count |
| 43 | **DirectChatScreen** | `/chat/:chatId` | 1-on-1 real-time chat with typing indicators, read receipts |
| 44 | **GroupChatScreen** | `/chat/:chatId/group` | Group chat with member list |

#### Referral (`lib/features/referral/`)

| # | Screen | Route | What It Does |
|---|--------|-------|-------------|
| 45 | **InviteScreen** | `/invite` | Show referral code (copy/share), stats (people referred, points earned). Apply someone else's code |

#### Share Tracker (`lib/features/share_tracker/`)

| # | Screen | Route | What It Does |
|---|--------|-------|-------------|
| 46 | **ShareTrackerScreen** | `/share-tracker` | Share app via WhatsApp/Instagram/Twitter/etc. Tracks shares, shows stats |

---

### 3.9 Gamification & Engagement

| # | Screen | Route | What It Does |
|---|--------|-------|-------------|
| 47 | **SpinScreen** | `/spin` | Spin-the-wheel game: segments with points/bonuses. Shows remaining spins. Confetti on win |
| 48 | **VoteScreen** | `/vote` | Daily poll with multiple choice. Shows results as bar chart after voting |
| 49 | **AchievementsScreen** | `/achievements` | Grid of achievements with unlock progress. Check for newly unlocked ones |
| 50 | **WinnersHistoryScreen** | `/winners` | Past contest winners list with ranks, names, prizes won |
| 51 | **WinnerProfileScreen** | `/winner-profile/:contestId/:userId` | Winner details for a specific contest |
| 52 | **PrizeHomesGalleryScreen** | `/prize-homes` | Browse prize homes with images, names, locations, values |
| 53 | **HomeSpecDetailScreen** | `/prize-homes/:id` | Full home specs: images, BHK, location, amenities, value. "Enter Contest to Win" button |
| 54 | **LocationSelectionScreen** | `/locations` | Browse prize homes by city |

---

### 3.10 Notifications (`lib/features/notifications/`)

| # | Screen | Route | What It Does |
|---|--------|-------|-------------|
| 55 | **NotificationInboxScreen** | `/notifications` | Push notification history with read/unread states. Mark all as read |
| 56 | **RemindersScreen** | `/reminders` | Custom reminders list. Delete or create new |
| 57 | **CreateReminderScreen** | `/create-reminder` | Pick contest + date/time → creates scheduled reminder |
| 58 | **NotificationPreferencesScreen** | `/notification-preferences` | Toggle: Push enabled, SMS enabled, compensation alerts |

---

### 3.11 Help & Support (`lib/features/help/`)

| # | Screen | Route | What It Does |
|---|--------|-------|-------------|
| 59 | **FaqScreen** | `/faq` | Categorized FAQ: General, Account & KYC, Payments, Contests, Rewards |
| 60 | **SupportScreen** | `/support` | Submit support ticket: subject, category, message, optional image |
| 61 | **HowToPlayScreen** | `/how-to-play` | Step-by-step guide with icons: Getting Started, Earning Points, Contests, Wallet, Rewards, Community |
| 62 | **CommunityGuidelinesScreen** | `/community-guidelines` | Rules: conduct, prohibited content, privacy, reporting |

---

### 3.12 Legal & Info (`lib/features/legal/`)

| # | Screen | Route | What It Does |
|---|--------|-------|-------------|
| 63 | **TermsOfServiceScreen** | `/terms-of-service` | Full ToS document |
| 64 | **PrivacyPolicyScreen** | `/privacy-policy` | Privacy policy |
| 65 | **ResponsibleGamingScreen** | `/responsible-gaming` | Responsible gaming info, self-assessment, help resources |
| 66 | **LegalityScreen** | `/legality` | Legal status, state restrictions, tax info |
| 67 | **AboutScreen** | `/about` | Company info, mission, stats |
| 68 | **ContactScreen** | `/contact` | Email, phone, social media links |
| 69 | **VersionScreen** | `/app-info` | App version, build number, tech stack info |
| 70 | **JobsScreen** | `/jobs` | Job listings (Flutter, Backend, PM, Design, Marketing, QA) |
| 71 | **MoreScreen** | `/more` | Misc: language, notifications, data usage, licenses |

---

### 3.13 In-App Admin (legacy Flutter admin)

The Flutter app also contains admin screens (these existed before the web admin panel was built):

| # | Screen | Route | What It Does |
|---|--------|-------|-------------|
| 72 | **AdminDashboardScreen** | `/admin` | Stats overview, quick-action grid |
| 73 | **AdminUsersScreen** | `/admin/users` | Paginated user list with filters |
| 74 | **AdminUserDetailScreen** | `/admin/users/:id` | Edit user profile, balance, tier |
| 75 | **AdminKycScreen** | `/admin/kyc` | KYC queue: view docs, approve/reject |
| 76 | **AdminContestsScreen** | `/admin/contests` | All contests with search/filter |
| 77 | **AdminContestDetailScreen** | `/admin/contests/:id` | Contest details, compensate action |
| 78 | **AdminConfigScreen** | `/admin/config` | System config editor, toggles |
| 79 | **AdminSupportTicketsScreen** | `/admin/support-tickets` | Ticket queue with status management |
| 80 | **AdminCompensationsScreen** | `/admin/compensations` | Compensation requests, process/export |
| 81 | **AdminBroadcastScreen** | `/admin/broadcast` | Send push notification / SMS broadcast |
| 82 | **AdminAuditLogsScreen** | `/admin/audit-logs` | System audit logs with filters |

> Note: The newer **Web Admin Panel** (React) is the recommended admin interface. The Flutter in-app admin screens are legacy and may be removed in future.

---

## 4. Flutter Architecture Assessment & Production Gaps

> **Full specification:** See `FLUTTER_ARCHITECTURE.md` (separate document) for the complete production-ready architecture specification, widget library definitions, testing plan, accessibility spec, and localization architecture.

### 4.1 Architecture Summary

| Layer | Pattern | Status |
|-------|---------|--------|
| **State Management** | Riverpod v2.4.9 — StateNotifierProvider + FutureProvider + StreamProvider | ✅ Consistent across 24 features |
| **Routing** | GoRouter v12.1.3 — 70+ routes, auth redirect guard, deep link parsing | ✅ Comprehensive |
| **Networking** | Dio v5.4.0 — JWT interceptor, SSL pinning, offline queue, Sentry integration | ✅ Production-ready |
| **Offline** | Connectivity stream + request queue (3 retries, 5s delay) + banner | ✅ Production-ready |
| **Image Caching** | cached_network_image + flutter_cache_manager + CDN manifest + preloader | ✅ Production-ready |
| **Security** | Root detection, screenshot protection, background blur, SSL pinning, secure storage | ✅ Production-ready |
| **Error Tracking** | Sentry with PII sanitization, Dio interceptor, exception filtering | ✅ Production-ready |
| **Performance** | 4-phase startup, lazy init, frame timing, memory profiler, scroll tracker, FPS overlay | ✅ Production-ready |
| **Build Config** | Dart defines (dev/staging/prod), obfuscation, split-debug-info | ✅ Production-ready |
| **Splash Screen** | Dart-based fade+scale animation | ⚠️ No native splash — white flash before Dart renders |

### 4.2 Screen State Coverage (18 Screens Audited)

| State | Coverage | Details |
|-------|----------|---------|
| **Loading** | 18/18 (100%) | 11 use shimmer/skeleton, 7 use spinner |
| **Error** | 18/18 (100%) | Icon + message + retry button (most); SnackBar (login/OTP) |
| **Empty** | 11/18 (61%) | **7 screens missing**: HomeScreen, LeaderboardScreen, LoginScreen, OtpScreen, KycDetailsScreen, SpinScreen, EarnPointsScreen |
| **Offline** | 0/18 (0%) | **Critical gap**: No screen checks connectivity. Only app-level `OfflineBanner`. |
| **Semantics** | 0/18 (0%) | **Critical gap**: Zero accessibility across entire app. |
| **Animations** | 7/18 (39%) | CompletedContestScreen, SpinScreen, VoteScreen have rich animations; 11 screens have none |

### 4.3 Critical Gaps (Must Fix Before Launch)

| # | Gap | Severity | Current State | Required Action |
|---|-----|----------|---------------|-----------------|
| 1 | **Localization (i18n)** | **P0** | LanguageScreen is a stub. All strings hardcoded English. No `flutter_localizations`, no `intl`, no `.arb` files. | Add `flutter_localizations` + `intl`, create `app_en.arb` + `app_hi.arb` (~500 strings each), wrap all strings with `AppLocalizations.of(context)` |
| 2 | **Accessibility** | **P0** | Zero `Semantics` widgets across 210+ Dart files. No screen reader support, no accessibility feature detection. | Add `Semantics` to all interactive elements, `MergeSemantics` for list items, `ExcludeSemantics` for decorative elements, respect `reduceMotion` and `boldText` |
| 3 | **Permissions** | **P0** | No `permission_handler`. `image_picker` called without runtime check. Will crash on Android 13+. | Add `permission_handler`, create `PermissionService` for camera/storage/notifications, handle denial gracefully |
| 4 | **Feature Tests** | **P1** | 17 test files cover core infrastructure only. Zero tests for auth/contests/wallet/feed/chat/polls. | Add `mocktail`, write notifier tests (30), widget tests (18), integration tests (3) |
| 5 | **Offline Awareness** | **P1** | App-level offline banner exists. 0/18 screens adapt UI for offline state. | Every screen must watch `connectivityProvider` and show cached data + banner OR `OfflinePlaceholder` |

### 4.4 Partial Gaps (Should Fix)

| # | Gap | Current State | Required Action |
|---|-----|---------------|-----------------|
| 1 | **Global Error Handling** | `ErrorBoundary` exists but not systematic. No `runZonedGuarded`. | Add `runZonedGuarded` in `main()` for global async catch-all |
| 2 | **Deep Links (Native)** | Custom MethodChannel exists. No `app_links`/`uni_links`. No Android/iOS intent filters. | Add `app_links` package, configure Android Manifest + iOS Associated Domains |
| 3 | **Logging** | 200+ ad-hoc `debugPrint()` calls. No structured logging. `sentry_logging` not wired. | Add `logging` package, create `LogService`, replace `debugPrint` |
| 4 | **Splash Screen** | Dart-based only. White flash on cold start. | Add `flutter_native_splash` with branded assets |
| 5 | **Code Generation** | All 30+ models hand-written with manual JSON. High maintenance. | Add `build_runner` + `freezed` + `json_serializable` |
| 6 | **Device Info** | No `device_info_plus`. Cannot read device model/OS for anti-fraud. | Add `device_info_plus` for device fingerprinting |
| 7 | **Route Transitions** | All routes pop in without animation. | Add `CustomTransitionPage` in GoRouter for hero animations |
| 8 | **Missing Empty States** | LeaderboardScreen, HomeScreen lack empty state UI. | Add `EmptyState` widget with icon + message + CTA |

### 4.5 Recommended Shared Widget Library Additions

| Widget | Priority | Purpose |
|--------|----------|---------|
| `AsyncScreen` | P0 | Scaffold that auto-handles loading/error/data/empty via `AsyncValue`. Replaces per-screen boilerplate across all 18+ screens. |
| `ShimmerList` / `ShimmerGrid` | P0 | Reusable shimmer placeholders (replaces 11 ad-hoc shimmer implementations) |
| `EmptyState` | P0 | Configurable icon + title + subtitle + CTA button (standardizes 11+ empty states) |
| `ErrorState` | P0 | Configurable message + retry callback (standardizes 18+ error states) |
| `OfflineAwareWidget` | P1 | Wraps content: cached data + stale banner OR `OfflinePlaceholder` |
| `SemanticIcon` | P0 | Enforces `semanticsLabel` on all icons |
| `AppScaffold` | P1 | Standard page layout with offline awareness, safe area, app bar |
| `CachedImage` | P0 | Wraps `cached_network_image` with loading/error/shimmer placeholders |
| `AnimatedCounter` | P2 | Animated number transitions for points/balance displays |

### 4.6 App Startup Performance (Current — Production-Ready)

```
Phase 0: WidgetsFlutterBinding + deep link config          (~50ms)
Phase 1: Firebase.initializeApp()                          (~500ms)
Phase 2: Deferred init registration                        (~200ms)
Phase 3: Background init (image preloader, memory profiler) (~1000ms)
         ↓
ConfigGate (maintenance check) → DeviceSecurity (root check) → DreamHomeApp
```

### 4.7 Technology Stack (Flutter-Specific)

| Layer | Package | Version | Purpose |
|-------|---------|---------|---------|
| **State** | flutter_riverpod | ^2.4.9 | State management |
| **Routing** | go_router | ^12.1.3 | Declarative routing + deep links |
| **HTTP** | dio | ^5.4.0 | API client with interceptors |
| **Auth** | firebase_auth | ^4.7.0 | Phone OTP authentication |
| **Push** | firebase_messaging | ^14.7.10 | FCM notifications |
| **Storage** | flutter_secure_storage | ^9.0.0 | JWT + sensitive data |
| **Cache** | flutter_cache_manager | ^3.3.1 | Image disk cache |
| **Images** | cached_network_image | ^3.3.1 | Network image widget |
| **SVG** | flutter_svg | ^2.0.9 | SVG rendering |
| **Fonts** | google_fonts | ^6.1.0 | Outfit font family |
| **WebSocket** | socket_io_client | ^3.1.6 | Real-time contest updates |
| **Errors** | sentry_flutter | ^8.0.0 | Error tracking |
| **Connectivity** | connectivity_plus | ^6.0.3 | Network state monitoring |
| **Share** | share_plus | ^10.0.0 | Native share sheet |
| **Links** | url_launcher | ^6.2.1 | Opening external URLs |
| **Camera** | image_picker | ^1.0.4 | KYC document photos |
| **Crypto** | crypto | ^3.0.3 | Token generation |

---

## 5. Web Admin Panel — Complete Page Breakdown

The admin panel is a **standalone web application** at `admin/` directory. It has 13 pages + login.

### 5.1 Login (`/login`)

| Element | Description |
|---------|-------------|
| **What it does** | Admin authentication |
| **Form fields** | Phone number + Role selector (admin/moderator) |
| **API called** | `POST /api/v1/auth/mock-login` |
| **Note** | Uses mock-login (dev mode). In production, would use proper admin auth |

---

### 5.2 Dashboard (`/dashboard`)

| Element | Description |
|---------|-------------|
| **What it shows** | Welcome banner, 6 metric cards, compensation analytics, recent signups table, recent activity table |
| **StatsCards** | Total Users, Active Users, Running Contests, Pending KYC, Total Deposits (₹), Open Tickets |
| **Tables** | Recent signups (name, phone, tier, date). Recent transactions (user, type, amount, date) |
| **API called** | `GET /api/v1/admin/dashboard` |

---

### 5.3 Users (`/users`)

| Element | Description |
|---------|-------------|
| **What it shows** | Paginated list of all users with filters |
| **Filters** | Search (name/phone/email), Role (All/User/Admin/Moderator), Status (All/Active/Inactive), Tier (All/Bronze/Silver/Gold/Platinum), KYC (All/Pending/Verified/Rejected) |
| **Columns** | Name + ID, Phone, Email, Tier badge, KYC badge, INR Balance, Status dot, Actions |
| **Row click** | Navigates to `/users/:id` |
| **API called** | `GET /api/v1/admin/users?page=&limit=&search=&role=&isActive=&tier=&kycStatus=` |

---

### 5.4 User Detail (`/users/:id`)

| Element | Description |
|---------|-------------|
| **What it shows** | User summary card + editable form |
| **Form fields** | Full Name, Email, Tier (Bronze/Silver/Gold/Platinum), State, Account Status (Active/Inactive) |
| **Activity** | Contests Joined, Total Deposits (₹), Total Withdrawals (₹) |
| **API called** | `GET /api/v1/admin/users/:id` → `PATCH /api/v1/admin/users/:id` |

---

### 5.5 Contests (`/contests`)

| Element | Description |
|---------|-------------|
| **What it shows** | Paginated contest list with search and filters |
| **Filters** | Search (title), Status (All/Running/Upcoming/Completed/Cancelled), Type (All/Mega/Head-to-Head/Mega Pool/Private) |
| **Columns** | Title, Entry Fee (₹), Prize (₹), Slots (filled/max), Status badge, Type badge, Start Time, Actions |
| **Row click** | Navigates to `/contests/:id` |
| **API called** | `GET /api/v1/admin/contests?page=&limit=&search=&status=&type=` |

---

### 5.6 Contest Detail (`/contests/:id`)

| Element | Description |
|---------|-------------|
| **What it shows** | Contest info card + members table |
| **Info** | Entry Fee, Total Prize, Slots, Status, Type, Start/End Time, Invite Code |
| **Members** | Name, Phone, Points Earned, Joined At |
| **Action** | "Compensate" button (if contest completed + not yet compensated) |
| **API called** | `GET /api/v1/admin/contests/:id` → `POST /api/v1/admin/contests/:id/compensate` |

---

### 5.7 KYC (`/kyc`)

| Element | Description |
|---------|-------------|
| **What it shows** | KYC submissions queue with filters |
| **Filters** | User ID search, Status (All/Pending/Verified/Rejected) |
| **Columns** | User Profile (name + ID), Phone, Documents Submitted (tags), Verification Status, Submitted At, Actions |
| **Actions** | Approve ✓, Reject ✗ (with reason textarea) |
| **Detail modal** | Full KYC info: name, phone, status, Aadhaar/PAN numbers, document images (Aadhaar front/back, PAN, Selfie) with view-fullscreen overlay |
| **API called** | `GET /api/v1/admin/kyc` → `PATCH /api/v1/admin/kyc/:id/approve` or `/reject` |

---

### 5.8 System Config (`/config`)

| Element | Description |
|---------|-------------|
| **What it shows** | System settings editor |
| **Sections** | System Parameters (name, version, API version, environment), Withdrawal Limits (min/max), Daily Limits (max posts, max spins), Min App Versions (Android/iOS), Platform State (Maintenance toggle), Feature Toggles (Daily Spin, Polls, Feed, Chat, Referral), Support Email, Restricted States (tag input) |
| **API called** | `GET /api/v1/config` → `PATCH /api/v1/admin/config` |

---

### 5.9 Support Tickets (`/support`)

| Element | Description |
|---------|-------------|
| **What it shows** | Support ticket queue |
| **Filters** | Status (All/Open/In Progress/Resolved/Closed), Category (All/Technical/Payment/KYC/General/Other) |
| **Columns** | User Name, Phone, Subject, Category badge, Status badge, Created date, Actions |
| **Detail modal** | Full ticket: user info, message, status update dropdown |
| **API called** | `GET /api/v1/admin/support-tickets` → `PATCH /api/v1/admin/support-tickets/:id/status` |

---

### 5.10 Notifications (`/notifications`)

| Element | Description |
|---------|-------------|
| **What it shows** | Send push notifications or SMS broadcasts |
| **Tabs** | Push Notifications (title, message, target tier), SMS Broadcast (message with 160-char limit, target tier) |
| **Confirmation** | Modal with warning before sending |
| **API called** | `POST /api/v1/admin/notifications/broadcast` or `/broadcast-sms` |

---

### 5.11 Audit Logs (`/audit-logs`)

| Element | Description |
|---------|-------------|
| **What it shows** | All admin actions log |
| **Filter** | Action type dropdown (10 options: Update User, Update Config, Approve KYC, Reject KYC, Compensate, Broadcast, etc.) |
| **Columns** | Admin User, Action badge, Target Type, Target ID, IP Address, Timestamp |
| **Expand** | Click row to see full metadata as JSON |
| **API called** | `GET /api/v1/admin/audit-logs?page=&limit=&action=` |

---

### 5.12 Compensations (`/compensations`)

| Element | Description |
|---------|-------------|
| **What it shows** | Compensation records with stats |
| **StatsCards** | Total Compensations, Pending, Processed, Failed |
| **Actions** | Refresh, Export CSV, Process All Pending |
| **Filter** | Status (All/Pending/Processed/Failed) |
| **Columns** | Contest title, User, Entry Fee, Points, Status badge, Created date |
| **API called** | `GET /api/v1/admin/compensations`, `GET /api/v1/admin/compensations/stats`, `POST /api/v1/admin/compensations/process-pending` |

---

### 5.13 Leaderboard Admin (`/leaderboard`)

| Element | Description |
|---------|-------------|
| **What it shows** | Leaderboard management tools |
| **Actions** | Sync Full Leaderboard, Sync Specific Contest (by ID), Reset Weekly Leaderboard, Reset Monthly Leaderboard |
| **Confirmation** | Modal before resetting |
| **API called** | `POST /api/v1/leaderboard/sync`, `/sync/contest/:id`, `/reset/weekly`, `/reset/monthly` |

---

## 6. Backend Architecture — Assessment & Production Gaps

> **Full specification:** See `BACKEND_ARCHITECTURE.md` (separate document) for the complete production-ready backend specification covering queues, events, caching, transactions, monitoring, error handling, authorization, validation, API design, and deployment.

### 6.1 Module Inventory (38 Modules)

The backend has 38 modules across 199 TypeScript files covering: Auth, Users, Contests (with WebSocket gateway), Payments, Transactions, Withdrawals, KYC, Rewards, Points (engine + streak system + cron), Leaderboard (Redis real-time + cron sync/reset), Chat (HTTP + WebSocket gateway), Feed, Notifications (FCM + reminders), Banners, Prize Homes, Achievements, Polls, Gamification (spin wheel), Share Tracker, Referral, Compensation (cron-driven), Support, Payment Methods, Config, SMS (mock), Audit, Admin, Health, Custom Metrics, Redis (cache + throttler), Common (guards, filters, interceptors, pipes, middleware), Batch, Seed, Database, Migrations, AppConfig, Shutdown.

### 6.2 Current State Assessment

| Category | Status | Details |
|----------|--------|---------|
| **Middleware Pipeline** | ✅ Production-ready | 7 middleware: requestId, correlationId, request logging (Pino, sampled), compression, ETag, request size limiter, Helmet |
| **Input Validation** | ✅ Production-ready | Global ValidationPipe (whitelist + forbidNonWhitelisted + transform) + SanitizePipe (XSS, NoSQL injection, control chars) |
| **Security** | ✅ Production-ready | Helmet (strict CSP), CORS (prod-specific origins), 4-layer rate limiting, audit logging, JWT auth, API key auth |
| **Monitoring** | ✅ Production-ready | 12 Prometheus metrics, Sentry, 4 health endpoints, periodic (30s) health metrics, graceful shutdown |
| **Transactions** | ✅ Production-ready | TypeORM pessimistic locking on joinContest, withdrawal, referral, compensation |
| **Caching** | ✅ Partially | Redis cache interceptor (GET, skips auth), leaderboard sorted sets, configurable TTLs. **Missing:** decorators never applied, no graceful degradation |
| **Cron Jobs** | ✅ Production-ready | 6 schedules: streak penalty (midnight), leaderboard sync (5min) + weekly reset + monthly reset, compensation (5min), reminders (1min) |
| **WebSocket** | ✅ Partially | 2 gateways with JWT auth, room-based. **Issues:** `CORS: origin='*'` on contests, debug auto-responder in chat |
| **Auth** | ⚠️ Partial | Firebase OTP + JWT (7d). **P0 Gaps:** no refresh tokens, in-memory OTP (lost on restart), missing rate limit on verify-otp |
| **Error Handling** | ⚠️ Needs consolidation | 3 overlapping exception filters (SentryExceptionFilter suppresses AllExceptionsFilter). QueryTimingMiddleware defined but not registered |
| **Response Structure** | ❌ Missing | No standard success envelope. No pagination response standard. Each service returns raw data differently |
| **Job Queue** | ❌ Missing | No Bull/BullMQ. FCM notifications, SMS, compensation run synchronously. No retry on failure |
| **Event Bus** | ❌ Missing | No `@nestjs/event-emitter`. All inter-service communication via direct injection (tight coupling) |
| **Distributed Tracing** | ❌ Missing | No OpenTelemetry |

### 6.3 Critical Production Gaps (P0 — Must Fix Before Launch)

| # | Gap | Impact | Specification |
|---|-----|--------|---------------|
| 1 | **No Job Queue** | FCM notifications, SMS, compensation processing block request cycle. No retry on failure. No backpressure. | Add Bull/BullMQ with 6 queues (fcm-notifications, sms-delivery, compensation-processing, leaderboard-sync, reminder-execution, email-delivery). Redis backend, 3 retry attempts, exponential backoff. |
| 2 | **No Event Bus** | Tight coupling: CompensationService directly calls NotificationsService + SmsService. ContestsService directly calls PointsEngineService. Cannot scale independently. | Add `@nestjs/event-emitter` with 10 domain events (UserRegistered, ContestJoined, ContestCompleted, ContestCancelled, KycApproved, PaymentCompleted, PointsAwarded, ReferralSettled, ReminderDue). |
| 3 | **No Response Envelope** | Controllers return raw data. No `{ success, data, message, timestamp }`. No pagination standard. | Add global ResponseInterceptor wrapping all responses. Standard pagination: `{ items, total, page, limit, totalPages, hasNextPage }`. Standard error: `{ success: false, statusCode, message, fields?, requestId, correlationId, timestamp }`. |
| 4 | **No Refresh Tokens** | Single 7-day JWT. Token leak = permanent access. No logout-invalidate-other-sessions. | Short-lived access token (15min) + 24h refresh token. Redis blacklist on logout. Rotation on each refresh. |
| 5 | **In-Memory OTP** | OTP store is Map in AuthService. Lost on restart. Not shared across instances. No per-IP tracking. | Move to Redis with 5min TTL. Per-IP rate limiting. Max 3 attempts per phone+IP. |
| 6 | **Mock SMS Provider** | `console.log` only. No actual SMS delivery. | Integrate Twilio/MSG91. Queue-backed delivery. Provider failover. |
| 7 | **verify-otp No Rate Limit** | No `@Throttle()` on verify-otp. Brute-force across phone numbers possible. | Add 5 req/min. Per-IP tracking. |
| 8 | **WebSocket CORS: `*`** | Any website can open WS connection to `/contests`. | Restrict to known dashboard origins. |
| 9 | **Duplicate Exception Filters** | 3 overlapping filters. `AllExceptionsFilter` (Pino-based) never fires. SentryExceptionFilter catches everything. | Consolidate to single filter: Pino logging + Sentry (>=500) + standard error envelope. |
| 10 | **Reminders Use setTimeout** | In-memory setTimeout lost on restart. All pending reminders destroyed. | Move to Bull delayed jobs with persistence. |

### 6.4 Endpoint Reference

Full endpoint list preserved in `BACKEND_ARCHITECTURE.md`. Summary:

| Category | Endpoints | Auth |
|----------|-----------|------|
| **Auth** | `POST request-otp`, `POST verify-otp`, `POST mock-login` (dev) | None (mock-login: dev only) |
| **Users** | `GET me`, `GET me/*`, `PATCH me/profile`, `PATCH me/referral-code`, `GET :id/preview` | JWT |
| **Contests** | `GET /`, `GET winners`, `GET code/:code`, `GET :id`, `POST /private`, `POST :id/join` | JWT |
| **Payments** | `POST order`, `POST verify` | JWT |
| **KYC** | `POST submit`, `POST upload-document`, `GET status` | JWT |
| **Points** | `GET actions/today`, `GET streak`, `POST action` | JWT |
| **Leaderboard** | `GET /`, `GET weekly/monthly/lifetime`, `GET contest/:id`, `POST sync` (admin) | JWT |
| **Notifications** | `POST fcm-token`, `GET reminders`, `POST reminders`, `GET /` | JWT |
| **Feed** | `GET /`, `POST /`, `POST :id/like`, `POST :id/comment` | JWT |
| **Chat** | `GET /`, `GET :id/messages` (HTTP) + WebSocket `/chat` | JWT |
| **Admin** | 18 endpoints: dashboard, users, contests, KYC, config, tickets, compensations, broadcast, audit logs | JWT + ADMIN role |
| **Health** | `GET /health`, `/health/ready`, `/health/live`, `/health/detailed` | None |
| **Metrics** | `GET /metrics` | None |

**WebSocket namespaces:** `/contests` (contest room join/leave, point updates, leaderboard updates), `/chat` (sendMessage, typing, markRead, newMessage, userTyping, messageRead)

---

## 7. Database Schema — All Entities

The backend uses **PostgreSQL** with **TypeORM**. Here are all the database tables:

### 7.1 Core User Tables

| Table | Description | Key Fields |
|-------|-------------|------------|
| `users` | All platform users | id, phone, fullName, email, password, walletBalance, points, lifetimePoints, currentTier, kycStatus, isActive, role, state, avatarUrl, referralCode |
| `kyc` | KYC verification records | id, userId, aadhaarNumber, panNumber, fullName, status, rejectionReason, documents json, submittedAt, verifiedAt |
| `fcm_tokens` | Push notification device tokens | id, userId, token, deviceType, createdAt |
| `saved_payment_methods` | User's saved payment methods | id, userId, type, provider, last4, isDefault, createdAt |

### 7.2 Contest Tables

| Table | Description | Key Fields |
|-------|-------------|------------|
| `contests` | All contests | id, title, type, entryFeeInr, pointsToJoin, maxSlots, filledSlots, prize, rules, status, startTime, endTime, inviteCode, isCompensated |
| `contest_members` | Users who joined contests | id, contestId, userId, pointsEarned, rank, joinedAt |

### 7.3 Financial Tables

| Table | Description | Key Fields |
|-------|-------------|------------|
| `transactions` | All wallet transactions | id, userId, type, amount, description, referenceId, balance, createdAt |
| `payments` | Payment gateway orders | id, userId, amount, currency, status, razorpayOrderId, razorpayPaymentId, createdAt |
| `withdrawals` | Withdrawal requests | id, userId, amount, status, bankAccount, upiId, processedAt, createdAt |
| `compensation_logs` | Admin compensation records | id, contestId, userId, amount, points, type, reason, status, createdAt |

### 7.4 Rewards & Points Tables

| Table | Description | Key Fields |
|-------|-------------|------------|
| `rewards` | Rewards catalog | id, name, description, pointsRequired, imageUrl, stock, isActive |
| `reward_redemptions` | User redemptions | id, userId, rewardId, pointsSpent, status, createdAt |
| `point_logs` | Points earning history | id, userId, points, action, multiplier, referenceId, createdAt |

### 7.5 Social Tables

| Table | Description | Key Fields |
|-------|-------------|------------|
| `posts` | Social feed posts | id, userId, content, imageUrl, likeCount, commentCount, createdAt |
| `likes` | Post likes | id, postId, userId, createdAt |
| `comments` | Post comments | id, postId, userId, content, createdAt |
| `chats` | Chat rooms | id, type (direct/group), name, createdAt |
| `chat_participants` | Chat members | id, chatId, userId, lastReadAt |
| `chat_messages` | Chat messages | id, chatId, senderId, content, messageType, createdAt |

### 7.6 Gamification Tables

| Table | Description | Key Fields |
|-------|-------------|------------|
| `achievements` | Achievement definitions | id, name, description, icon, criteria, pointsReward |
| `user_achievements` | Unlocked achievements | id, userId, achievementId, unlockedAt |
| `polls` | Poll questions | id, question, options (json), status, startAt, endAt |
| `poll_votes` | User poll votes | id, pollId, userId, selectedOption, votedAt |
| `leaderboard_archives` | Historical leaderboard snapshots | id, cycle, data (json), frozenAt |

### 7.7 Support & Config Tables

| Table | Description | Key Fields |
|-------|-------------|------------|
| `support_tickets` | User support requests | id, userId, subject, category, message, attachmentUrl, status, createdAt |
| `system_config` | Key-value app configuration | id, key, value, description, updatedAt |
| `audit_logs` | Admin action audit trail | id, adminId, action, targetType, targetId, metadata (json), ipAddress, createdAt |
| `notifications_log` | Push notification history | id, userId, title, body, data, isRead, createdAt |
| `reminders` | User-set contest reminders | id, userId, contestId, remindAt, status, createdAt |
| `shares` | App share tracking | id, userId, channel, contestId, createdAt |
| `referrals` | Referral tracking | id, referrerId, refereeId, code, bonusAwarded, createdAt |
| `banners` | Home screen banners | id, title, imageUrl, linkUrl, isActive, order, createdAt |
| `prize_homes` | Dream home catalog | id, name, description, images, location, city, value, specs (json), isActive |

---

## 8. Architecture & Data Flow

### 8.1 How a User's Journey Works

```
User opens app
    │
    ▼
SplashScreen → checks if logged in
    │
    ├── No → LanguageScreen → LoginScreen → Enter phone
    │                                              │
    │                                              ▼
    │                                        OTP sent via SMS
    │                                              │
    │                                              ▼
    │                                        User enters OTP
    │                                              │
    │                                              ▼
    │                                        POST /verify-otp
    │                                              │
    │                                              ▼
    │                                        JWT returned
    │                                              │
    └── Yes ───────────────────────────────────────┘
    │
    ▼
Dashboard (Home Tab)
    │
    ├── Browse contests → GET /contests → tap one → Contest detail
    │                                                    │
    │                                                    ▼
    │                                              Join contest
    │                                                    │
    │                                        POST /contests/:id/join
    │                                                    │
    │                                        Fee deducted from wallet
    │                                                    │
    │                                                    ▼
    │                                        Contest running (WebSocket)
    │                                                    │
    │                                                    ▼
    │                                        Contest completed
    │                                                    │
    │                                                    ▼
    │                                        Results shown (winners)
    │
    ├── Add cash → POST /payments/order → Razorpay → POST /payments/verify → Wallet credited
    │
    ├── Withdraw → POST /payments/withdraw → Admin approves → Money transferred
    │
    ├── Submit KYC → Upload docs → POST /kyc/submit → Admin reviews → Approved/Rejected
    │
    ├── Spin wheel → POST /gamification/spin → Points awarded
    │
    ├── Vote in poll → POST /polls/vote → Points earned
    │
    └── Share app → POST /shares → Points earned
```

### 8.2 How Admin Manages the Platform

```
Admin opens web panel → /login → enters credentials
    │
    ▼
Dashboard → sees overview stats
    │
    ├── Users → view list → click user → edit profile / ban
    │
    ├── KYC → view submissions → approve/reject documents
    │
    ├── Contests → view all → click contest → compensate if needed
    │
    ├── Config → toggle maintenance mode, adjust limits
    │
    ├── Support → view tickets → respond / close
    │
    ├── Notifications → compose broadcast → send push/SMS
    │
    ├── Compensations → process pending refunds
    │
    ├── Audit Logs → review all admin actions
    │
    └── Leaderboard → sync / reset rankings
```

### 8.3 Technology Architecture Diagram

```
┌───────────────────────────────────────────────┐
│              Flutter Mobile App                │
│  (Android + iOS)                               │
│                                                │
│  ┌─────────┐  ┌──────────┐  ┌─────────────┐  │
│  │ Riverpod │  │ GoRouter │  │  Dio + JWT  │  │
│  │ (State)  │  │  (Nav)   │  │  (HTTP+WS)  │  │
│  └─────────┘  └──────────┘  └──────┬──────┘  │
│                                    │          │
└────────────────────────────────────┼──────────┘
                                     │
                    ┌────────────────┼─────────────────┐
                    │                │                  │
                    ▼                ▼                  ▼
       ┌─────────────────────────────────────────────────────┐
       │              NestJS Backend API                      │
       │                                                      │
       │  ┌──────────────────────────────────────────────┐   │
       │  │         Request Pipeline (per request)        │   │
       │  │  Helmet → CORS → Compression → RequestId →   │   │
       │  │  CorrelationId → RequestLogging → Etag →     │   │
       │  │  SizeLimiter → Guards → Interceptors →       │   │
       │  │  Pipes → Controller → Service → Response     │   │
       │  └──────────────────────────────────────────────┘   │
       │                                                      │
       │  ┌─────────┐ ┌────────┐ ┌──────────┐ ┌──────────┐ │
       │  │Contests │ │ Users  │ │ Payments │ │ 18 more  │ │
       │  │ Module  │ │ Module │ │  Module  │ │ Modules  │ │
       │  └────┬────┘ └───┬────┘ └────┬─────┘ └────┬─────┘ │
       │       │           │           │             │       │
       │  ┌────▼───────────▼───────────▼─────────────▼────┐ │
       │  │            TypeORM (PostgreSQL)               │ │
       │  │  31 entities, migrations, composite indexes   │ │
       │  └───────────────────────────────────────────────┘ │
       │                                                      │
       │  ┌──────────────────────────────────────────────┐  │
       │  │              Redis (ioredis)                  │  │
       │  │  Cache response | Leaderboard ZSET |         │  │
       │  │  Rate limit | Throttler | Daily spin lock    │  │
       │  └──────────────────────────────────────────────┘  │
       │                                                      │
       │  ┌──────────────────────────────────────────────┐  │
       │  │      Socket.IO (WebSocket) — 2 namespaces     │  │
       │  │  /contests → point/leaderboard updates       │  │
       │  │  /chat → messages, typing, read receipts     │  │
       │  └──────────────────────────────────────────────┘  │
       │                                                      │
       │  ┌──────────────────────────────────────────────┐  │
       │  │     [MISSING] Bull Queue + Event Bus         │  │
       │  │  FCM/SMS/Compensation ← queues (async)      │  │
       │  │  Module decoupling ← events (pub/sub)        │  │
       │  └──────────────────────────────────────────────┘  │
       └─────────────────────────────────────────────────────┘
                            │
             ┌──────────────┼──────────────┐
             ▼              ▼              ▼
       ┌──────────┐ ┌────────────┐ ┌──────────────┐
       │ Admin    │ │ Prometheus │ │   Sentry    │
       │ Web UI  │ │ /metrics   │ │ Error Track │
       │ (React)  │ │ + Grafana │ │ + Checkly   │
       └──────────┘ └────────────┘ └──────────────┘
```

### 8.4 External Services

| Service | Purpose |
|---------|---------|
| **Firebase** | Phone authentication, push notifications (FCM) |
| **Razorpay** | Payment gateway (deposits) |
| **MSG91 / Twilio** | SMS delivery (OTP, broadcasts) |
| **Sentry** | Error tracking + performance monitoring |
| **Prometheus** | Metrics collection |
| **Checkly** | Uptime/API monitoring |
| **Grafana** | Dashboard visualization |

---

## 9. Project Directory Structure

```
dream_home_11/
│
├── lib/                          # FLUTTER MOBILE APP
│   ├── main.dart                 # App entry point
│   ├── core/                     # Shared core layer
│   │   ├── theme/                # Dark theme, colors, typography
│   │   ├── router/               # GoRouter config + deep links
│   │   ├── network/              # Dio client, connectivity, offline queue
│   │   ├── security/             # Root detection, screen blur
│   │   ├── analytics/            # Sentry config
│   │   ├── performance/          # Frame timing, memory, startup
│   │   ├── updater/              # App update checker
│   │   ├── utils/                # Validators, CDN assets, image utils
│   │   └── widgets/              # Shared widgets (offline banner, error, retry)
│   │
│   └── features/                 # Feature modules
│       ├── auth/                 # Login, OTP, language
│       ├── dashboard/            # Home, settings, profile, performance
│       ├── contests/             # All contest screens
│       ├── wallet/               # Balance, payments, withdrawals
│       ├── kyc/                  # Identity verification
│       ├── rewards/              # Rewards catalog
│       ├── points/               # Earn points, multiplier, streak
│       ├── leaderboard/          # Rankings
│       ├── chat/                 # Real-time messaging
│       ├── feed/                 # Social feed
│       ├── notifications/        # Push notifications, reminders
│       ├── admin/                # Legacy in-app admin
│       ├── achievements/         # Achievement badges
│       ├── referral/             # Invite friends
│       ├── prize-homes/          # Dream home catalog
│       ├── winners/              # Winner history
│       ├── share-tracker/        # Share tracking
│       ├── polls/                # Voting
│       ├── gamification/         # Spin wheel
│       ├── compensations/        # Compensation history
│       ├── config/               # Maintenance/update gate
│       ├── help/                 # FAQ, support, how-to-play
│       └── legal/                # ToS, privacy, about, jobs
│
├── backend/                      # NESTJS API SERVER
│   ├── src/                      # Source code
│   │   ├── main.ts               # Server entry point
│   │   ├── app.module.ts         # Root module (imports all)
│   │   ├── app.controller.ts     # Root route (/)
│   │   ├── auth/                 # OTP, JWT, guards
│   │   ├── users/                # User CRUD
│   │   ├── contests/             # Contests + WebSocket gateway
│   │   ├── payments/             # Razorpay integration
│   │   ├── withdrawals/          # Withdrawal management
│   │   ├── transactions/         # Transaction history
│   │   ├── kyc/                  # KYC verification
│   │   ├── rewards/              # Rewards catalog + redemptions
│   │   ├── points/               # Points system + streaks
│   │   ├── leaderboard/          # Rankings
│   │   ├── chat/                 # Chat HTTP + WebSocket
│   │   ├── feed/                 # Social feed CRUD
│   │   ├── notifications/        # FCM + reminders
│   │   ├── admin/                # Admin endpoints
│   │   ├── config/               # System configuration
│   │   ├── support/              # Support tickets
│   │   ├── compensation/         # Compensation logic
│   │   ├── referral/             # Referral system
│   │   ├── banners/              # Banner management
│   │   ├── prize-homes/          # Prize home catalog
│   │   ├── achievements/         # Achievement system
│   │   ├── polls/                # Poll management
│   │   ├── gamification/         # Spin wheel
│   │   ├── share-tracker/        # Share tracking
│   │   ├── payment-methods/      # Saved payment methods
│   │   ├── sms/                  # SMS service
│   │   ├── audit/                # Audit logging
│   │   ├── health/               # Health check endpoints
│   │   ├── common/               # Shared middleware, guards, metrics
│   │   ├── redis/                # Redis client
│   │   ├── database/             # TypeORM config
│   │   └── migrations/           # DB migration files
│   │
│   ├── test/                     # E2E + security tests
│   ├── load-test/                # Performance testing
│   └── Dockerfile
│
├── admin/                        # REACT WEB ADMIN PANEL
│   ├── src/
│   │   ├── main.tsx              # Entry point
│   │   ├── App.tsx               # Route definitions
│   │   ├── index.css             # Tailwind + global styles
│   │   ├── lib/
│   │   │   ├── api.ts            # Axios client + type defs
│   │   │   └── auth.ts           # Login/logout/token
│   │   ├── components/
│   │   │   ├── Layout.tsx        # Sidebar + topbar
│   │   │   ├── ProtectedRoute.tsx # Auth guard
│   │   │   └── ui/               # 14 UI components
│   │   └── pages/                # 13 admin pages
│   │
│   ├── public/
│   │   └── logo.svg              # Dream11 brand logo
│   ├── Dockerfile                # Multi-stage build
│   └── nginx.conf                # SPA + API proxy
│
├── deploy/                       # DEPLOYMENT
│   ├── deploy.sh                 # Master deployment script
│   ├── docker-compose.prod.yml   # Production compose
│   ├── blue-green/               # K8s blue-green manifests
│   ├── nginx/                    # Nginx configs
│   ├── terraform/                # Infrastructure as code
│   ├── monitoring/               # Checkly, Grafana configs
│   └── ssl-setup.sh             # SSL automation
│
├── scripts/                      # UTILITY SCRIPTS
│   ├── release.sh
│   └── verify-release.sh
│
├── android/                      # Android native config
├── ios/                          # iOS native config
├── web/                          # Web build config
├── test/                         # Flutter tests
└── assets/                       # Images, fonts, branding
```

---

## 10. Key Data Flows Summary

### Contest Lifecycle
```
Created (by admin or user)
    │
    ▼
Upcoming (accepting entries)
    │
    ▼
Running (live, real-time updates via WebSocket)
    │
    ▼
Completed (results displayed)
    │
    ▼
[Optional] Compensated (admin refunds if contest had issues)
```

### Payment Lifecycle
```
User taps Add Cash
    │
    ▼
POST /payments/order → Razorpay order created
    │
    ▼
Razorpay checkout (user enters card/UPI)
    │
    ▼
POST /payments/verify → Payment confirmed
    │
    ▼
Wallet credited + Bonus points awarded
```

### Withdrawal Lifecycle
```
User requests withdrawal
    │
    ▼
Admin reviews in KYC/Withdrawal panel
    │
    ├── Approved → Money transferred to bank/UPI
    │
    └── Rejected → Money returned to wallet
```

### KYC Lifecycle
```
User submits documents via app
    │
    ▼
Admin reviews in KYC panel
    │
    ├── Approved → User can withdraw
    │
    └── Rejected → User sees reason, resubmits
```

---

## 11. How to Access Everything

### Mobile App (Flutter)
```bash
cd /path/to/dream_home_11
flutter run                  # Run on connected device
flutter run -d chrome        # Run in browser (web)
```

### Backend API
```bash
cd /path/to/dream_home_11/backend
npm run start:dev            # Development server at localhost:3000
npm run start:prod           # Production build
```

### Admin Panel (Web)
```bash
cd /path/to/dream_home_11/admin
npm run dev                  # Development at localhost:5173
npm run build                # Production build
```

### Docker (All Services)
```bash
cd /path/to/dream_home_11/deploy
docker-compose -f docker-compose.prod.yml up -d
```

---

## 12. Test Suites

| Test Suite | Location | Command |
|------------|----------|---------|
| **E2E Tests** | `backend/test/e2e/` | `cd backend && npx jest --config jest-e2e.json` |
| **Security Tests** | `backend/test/security/` | `cd backend && npx jest --config jest-e2e.json --testPathPattern security` |
| **Load Tests** | `backend/load-test/` | `cd backend && bash run-load-tests.sh` |
| **Flutter Tests** | `test/` | `flutter test` |

---

*Document generated on July 2026 — covers the full Dream Home 11 platform including Flutter mobile app, NestJS backend API, and React admin web panel.*
