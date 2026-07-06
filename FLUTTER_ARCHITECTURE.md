# Dream Home 11 — Production-Ready Flutter Architecture Specification

> **Author:** Principal Product Architect
> **Date:** July 6, 2026
> **Scope:** Complete Flutter mobile app architecture analysis, gap assessment, and production-ready specification.
> **Status:** Architecture Review — Ready for Engineering Implementation

---

## TABLE OF CONTENTS

1. [Current State Assessment](#1-current-state-assessment)
2. [Architectural Patterns](#2-architectural-patterns)
3. [Screen-by-Screen State Coverage Matrix](#3-screen-by-screen-state-coverage-matrix)
4. [Navigation & Routing Architecture](#4-navigation--routing-architecture)
5. [State Management Architecture](#5-state-management-architecture)
6. [Widget Architecture](#6-widget-architecture)
7. [Core Infrastructure Review](#7-core-infrastructure-review)
8. [Critical Gaps & Remediation Plan](#8-critical-gaps--remediation-plan)
9. [Production-Ready Widget Library Specification](#9-production-ready-widget-library-specification)
10. [Testing Architecture](#10-testing-architecture)
11. [Accessibility Specification](#11-accessibility-specification)
12. [Localization Architecture](#12-localization-architecture)
13. [Performance Budget & Benchmarks](#13-performance-budget--benchmarks)
14. [Appendix: Complete Provider Inventory](#14-appendix-complete-provider-inventory)
15. [Appendix: Screen State Requirements Checklist](#15-appendix-screen-state-requirements-checklist)

---

## 1. Current State Assessment

### 1.1 Strengths (Production-Ready)

| Area | Assessment |
|------|-----------|
| **Image Caching** | Full-stack: `cached_network_image` + `flutter_cache_manager` + CDN manifest + image preloader at startup |
| **Offline Support** | `connectivity_plus` stream monitoring, `OfflineRequestQueue` with auto-replay (3 retries, 5s delay), `OfflineBanner` at app top, `OfflinePlaceholder` widget |
| **Platform Channels** | 3 channels operational: device security (root/jailbreak detection), screenshot protection, deep links |
| **Security** | Device integrity check on startup, sensitive screen blur on background, SSL pinning, JWT in FlutterSecureStorage |
| **Performance** | 4-phase app startup, priority-based lazy initialization, frame timing monitor, memory profiler with leak detection, scroll tracker, FPS overlay |
| **Error Tracking** | Sentry with Dio interceptor, PII sanitization, exception filtering |
| **Build Config** | Environment flavors via `--dart-define` (dev/staging/prod), obfuscation, split-debug-info |
| **State Management** | Riverpod v2.4.9 used consistently across all 24 feature modules (StateNotifierProvider, FutureProvider, StreamProvider) |
| **Routing** | GoRouter v12.1.3 with 70+ routes, auth redirect guard, deep link support |

### 1.2 Partial Implementations (Needs Hardening)

| Area | Current State | Gaps |
|------|--------------|------|
| **Error Handling** | `ErrorBoundary` widget exists, widespread try-catch | No `runZonedGuarded` for global async errors, `ErrorBoundary` not systematically applied to all screens |
| **App Lifecycle** | `WidgetsBindingObserver` in 5 places | No centralized lifecycle management service |
| **Deep Links** | Custom MethodChannel + URI parser | No `app_links`/`uni_links` package, no Android manifest intent filters visible, no iOS Associated Domains |
| **Animations** | Extensive custom `AnimationController` work | No Lottie/Rive for complex animations (spin wheel, confetti are hand-coded) |
| **Logging** | Ad-hoc `debugPrint()` (200+ calls) | No structured logging, `sentry_logging` not wired up |
| **Splash Screen** | Dart-based fade+scale animation | No native splash (`flutter_native_splash` absent) — white flash before Dart renders |
| **Device Info** | Custom root detection only | No `device_info_plus` package, no device fingerprinting for anti-fraud |
| **Code Generation** | No `build_runner`/`freezed`/`json_serializable` | All 30+ models hand-written with manual `fromJson`/`toJson` — maintenance burden |

### 1.3 Critical Gaps (Blocking Production)

| Gap | Severity | Impact |
|-----|----------|--------|
| **Localization (i18n)** | **P0 Critical** | `LanguageScreen` is a stub. All strings hardcoded English. App advertises Hindi support but has zero translation infrastructure. |
| **Accessibility** | **P0 Critical** | Zero `Semantics` widgets across all 210+ Dart files. No screen reader support. May violate accessibility regulations. |
| **Permissions** | **P0 Critical** | No `permission_handler` package. Camera/storage permissions not requested explicitly. Will crash on Android 13+ when selecting KYC images. |
| **Feature Tests** | **P1 High** | 17 test files cover only core/infrastructure. Zero tests for auth, contests, wallet, notifications, feed, chat, polls, achievements features. |
| **Offline Checks** | **P1 High** | 0/18 audited screens check connectivity. Offline banner at app level exists but screens don't show offline-adapted UI. |

---

## 2. Architectural Patterns

### 2.1 Current Architecture (Feature-First Clean Architecture)

```
lib/
├── main.dart                          # Entry point
├── core/                              # Shared infrastructure
│   ├── theme/
│   ├── router/
│   ├── network/
│   ├── security/
│   ├── analytics/
│   ├── performance/
│   ├── updater/
│   ├── utils/
│   └── widgets/
└── features/                          # 24 feature modules
    ├── auth/
    │   ├── data/
    │   │   ├── models/
    │   │   └── repositories/
    │   └── presentation/
    │       ├── providers/
    │       ├── screens/
    │       └── widgets/
    ├── contests/
    ├── wallet/
    └── ... (21 more)
```

### 2.2 Recommended Additions for Production

```
lib/
├── core/
│   ├── ... (existing)
│   ├── localization/       ← NEW: ARB files + l10n delegate
│   ├── permissions/        ← NEW: Centralized permission service
│   ├── accessibility/      ← NEW: Semantic helpers, focus management
│   ├── lifecycle/          ← NEW: Centralized app lifecycle service
│   ├── logging/            ← NEW: Structured logging service
│   └── testing/            ← NEW: Test utilities, mocks, fixtures
└── shared/                  ← NEW: Cross-feature shared widgets
    ├── widgets/
    │   ├── async/          # AsyncValueWidget, Shimmer, ErrorState, EmptyState
    │   ├── layout/         # AppScaffold, ResponsiveGrid, SafeAreaWrapper
    │   ├── feedback/       # Toast, Snackbar, BottomSheet variants
    │   └── media/          # CachedImage, VideoPlayer, Avatar
    ├── models/             # Shared domain models
    └── mixins/             # Reusable mixins (lifecycle, accessibility)
```

### 2.3 State Management Pattern (Standards)

**Current pattern** (inconsistent): Some notifiers extend `StateNotifier<AsyncValue<T>>`, others use custom state classes, some return raw data.

**Production standard:**

```
┌─────────────────────────────────────────────────┐
│                  Screen Widget                    │
│   ConsumerWidget / ConsumerStatefulWidget        │
└──────────────────┬──────────────────────────────┘
                   │ ref.watch(provider)
┌──────────────────▼──────────────────────────────┐
│            StateNotifierProvider<T>               │
│   StateNotifier<AsyncValue<Model>>               │
│                                                   │
│   Methods:                                        │
│   ├── build()         → emits AsyncValue.loading │
│   ├── refresh()       → re-fetches from API     │
│   ├── mutate()        → optimistic + confirm    │
│   └── dispose()       → cancels pending work    │
└──────────────────┬──────────────────────────────┘
                   │ calls Repository
┌──────────────────▼──────────────────────────────┐
│               Repository                          │
│   Handles: API calls, cache logic, offline queue │
└─────────────────────────────────────────────────┘
```

**All providers MUST use `StateNotifier<AsyncValue<T>>`** — no exceptions. This guarantees every consumer has access to loading/data/error states uniformly.

---

## 3. Screen-by-Screen State Coverage Matrix

### 3.1 Current Coverage (18 Screens Audited)

| # | Screen | Loading | Empty | Error | Offline | Animations | Semantics |
|---|--------|---------|-------|-------|---------|------------|-----------|
| 1 | LoginScreen | ✅ Spinner | N/A | ✅ SnackBar | ❌ | ✅ AnimatedContainer | ❌ |
| 2 | OtpScreen | ✅ Spinner | N/A | ✅ SnackBar | ❌ | ❌ | ❌ |
| 3 | HomeScreen | ✅ Shimmer | ❌ | ✅ | ❌ | ✅ AnimatedSwitcher | ❌ |
| 4 | OurContestsScreen | ✅ Shimmer | ✅ | ✅ | ❌ | ❌ | ❌ |
| 5 | ContestRunningScreen | ✅ Spinner | ✅ | ✅ | ❌ | ❌ | ❌ |
| 6 | CompletedContestScreen | ✅ Spinner | N/A | ✅ | ❌ | ✅ FadeTransition | ❌ |
| 7 | WalletScreen | ✅ Shimmer | ✅ | ✅ | ❌ | ❌ | ❌ |
| 8 | RewardsCatalogScreen | ✅ Shimmer | ✅ | ✅ | ❌ | ❌ | ❌ |
| 9 | LeaderboardScreen | ✅ Shimmer | ❌ | ✅ | ❌ | ❌ | ❌ |
| 10 | KycDetailsScreen | ✅ Spinner | N/A | ✅ | ❌ | ❌ | ❌ |
| 11 | FeedScreen | ✅ Shimmer | ✅ | ✅ | ❌ | ❌ | ❌ |
| 12 | ChatListScreen | ✅ Shimmer | ✅ | ✅ | ❌ | ❌ | ❌ |
| 13 | NotificationInboxScreen | ✅ Shimmer | ✅ | ✅ | ❌ | ✅ AnimatedContainer | ❌ |
| 14 | SpinScreen | ✅ Spinner | N/A | ✅ | ❌ | ✅ AnimationController x2 | ❌ |
| 15 | VoteScreen | ✅ Spinner | ✅ | ✅ | ❌ | ✅ AnimatedOpacity | ❌ |
| 16 | HomeGalleryScreen | ✅ Shimmer | ✅ | ✅ | ❌ | ❌ | ❌ |
| 17 | InviteScreen | ✅ Shimmer | ✅ | ✅ | ❌ | ✅ AnimatedCrossFade | ❌ |
| 18 | EarnPointsScreen | ✅ Shimmer | N/A | ✅ | ❌ | ❌ | ❌ |

### 3.2 Production Requirements (Every Screen MUST Have)

```
┌─────────────────┬─────────────────────────────────────┐
│ State           │ Requirement                          │
├─────────────────┼─────────────────────────────────────┤
│ Loading         │ Shimmer/skeleton for lists.          │
│                 │ Spinner for single operations.       │
│                 │ Skeleton size matches real layout.   │
├─────────────────┼─────────────────────────────────────┤
│ Empty           │ Icon + descriptive message +         │
│                 │ CTA button (refresh/browse/create).  │
│                 │ Never show blank screen.             │
├─────────────────┼─────────────────────────────────────┤
│ Error           │ Friendly message (not raw error).    │
│                 │ RETRY button or auto-retry option.   │
│                 │ Logged to Sentry + structured log.   │
├─────────────────┼─────────────────────────────────────┤
│ Offline         │ Show cached data with stale banner. │
│                 │ If no cache: OfflinePlaceholder.     │
│                 │ Retry when connectivity returns.     │
├─────────────────┼─────────────────────────────────────┤
│ Semantics       │ Semantics labels on all icons.      │
│                 │ MergeSemantics for grouped elements. │
│                 │ Label text for screen readers.       │
└─────────────────┴─────────────────────────────────────┘
```

### 3.3 Missing States Per Screen

| Screen | Loading | Empty | Error | Offline | Semantics |
|--------|---------|-------|-------|---------|-----------|
| HomeScreen | — | **MISSING** | — | **MISSING** | **MISSING** |
| LeaderboardScreen | — | **MISSING** | — | **MISSING** | **MISSING** |
| LoginScreen | — | — | — | **MISSING** | **MISSING** |
| OtpScreen | — | — | — | **MISSING** | **MISSING** |
| All 18 screens | — | — | — | **ALL MISSING** | **ALL MISSING** |

---

## 4. Navigation & Routing Architecture

### 4.1 Current Routing (GoRouter — 70+ Routes)

**Works:** Auth redirect guard, 5-tab dashboard layout, path parameters, deep link URI parsing.

**Gaps:**

| Gap | Impact | Fix |
|-----|--------|-----|
| No route transitions | All routes pop in without animation | Add `CustomTransitionPage` for hero-style navigation |
| No error route | Unmatched routes show blank screen | Add `errorBuilder` with 404 screen |
| No route guards per-feature | Auth guard only checks login, not feature access | Add `redirect` function per route group |
| Deep links not registered natively | Android/iOS intent filters missing | Add `app_links` package + native config |
| No named routes | All routes use path strings | Use `GoRouterState.of(context).location` patterns |

### 4.2 Production Routing Architecture

```dart
GoRouter(
  initialLocation: '/',
  errorBuilder: (context, state) => NotFoundScreen(state.uri),
  routes: [
    // Auth group (no auth required)
    GoRoute(path: '/', ...),
    GoRoute(path: '/language', ...),
    GoRoute(path: '/login', ...),
    GoRoute(path: '/otp', ...),

    // App shell (auth required)
    ShellRoute(
      builder: (context, state, child) => DashboardLayout(child: child),
      routes: [
        GoRoute(path: '/home', ...),
        GoRoute(path: '/feed', ...),
        // ... tab routes
      ],
    ),

    // Full-screen routes (auth required, no shell)
    GoRoute(path: '/contest/:id', ...),

    // Admin routes (auth + admin role required)
    GoRoute(path: '/admin', ...),
  ],
)
```

### 4.3 Deep Link Architecture

```
┌─────────────────────────────────────────────┐
│          Incoming URL / Referral             │
│     dreamhome11.com/contest/abc123          │
└────────────────────┬────────────────────────┘
                     │
          ┌──────────▼──────────┐
          │  app_links Package  │  ← Add this
          │  (Android/iOS)      │
          └──────────┬──────────┘
                     │ Stream<Uri>
          ┌──────────▼──────────┐
          │  DeepLinkHelper      │  ← Already exists
          │  Parse → GoRouter   │
          └──────────┬──────────┘
                     │
          ┌──────────▼──────────┐
          │  GoRouter           │
          │  → /contest/abc123  │
          │  → Auth check       │
          │  → Navigate         │
          └─────────────────────┘
```

**Required native config:**
- Android: Intent filters in `AndroidManifest.xml` for `dreamhome11.com`
- iOS: Associated Domains in `Info.plist` + `apple-app-site-association` file

---

## 5. State Management Architecture

### 5.1 Provider Categories

| Category | Type | Usage | Count |
|----------|------|-------|-------|
| **API Client** | `Provider<Dio>` | Singleton HTTP client | 1 |
| **Feature State** | `StateNotifierProvider` | Complex async state (auth, contests, wallet) | ~30 |
| **Async Data** | `FutureProvider` | One-shot fetch (balance, FCM token, unread count) | ~10 |
| **Real-time** | `StreamProvider` | Connectivity, FPS, memory, scroll metrics | ~10 |
| **Singleton** | `Provider` | Services (Sentry, FCM, performance monitors) | ~15 |
| **Toggle** | `StateProvider` | Debug overlay, feature flags | ~5 |

### 5.2 StateNotifier Pattern (Production Standard)

```dart
// DO: Standard pattern for all feature providers
class ContestListNotifier extends StateNotifier<AsyncValue<List<ContestModel>>> {
  ContestListNotifier(this._repository) : super(const AsyncValue.loading()) {
    build();
  }

  final ContestRepository _repository;

  Future<void> build() async {
    state = const AsyncValue.loading();
    try {
      final contests = await _repository.fetchAll();
      if (contests.isEmpty) {
        state = AsyncValue.data([]);
      } else {
        state = AsyncValue.data(contests);
      }
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> refresh() => build();
}

// DON'T: Mixed patterns with custom state classes, inconsistent error handling
```

### 5.3 Empty State Handling Pattern

```dart
// All screens MUST use this pattern when watching AsyncValue lists:
ref.watch(contestListProvider).when(
  loading: () => const ShimmerList(),
  error: (e, st) => ErrorState(
    message: 'Unable to load contests',
    onRetry: () => ref.read(contestListProvider.notifier).refresh(),
  ),
  data: (contests) => contests.isEmpty
      ? EmptyState(
          icon: Icons.sports_esports_outlined,
          title: 'No contests yet',
          action: EmptyAction(label: 'Browse Contests', onTap: () {}),
        )
      : ContestList(contests: contests),
);
```

---

## 6. Widget Architecture

### 6.1 Shared Widget Library (Current: 4 core widgets)

| Widget | Purpose | Status |
|--------|---------|--------|
| `OfflineBanner` | Top-of-app offline indicator | ✅ Done |
| `OfflinePlaceholder` | Full-screen offline state | ✅ Done |
| `RetryWidget` / `RetryWrapper` | Error + retry button | ✅ Done |
| `ErrorBoundary` / `ErrorBoundaryWrapper` | Flutter error catch + fallback | ✅ Done |

### 6.2 Production Widget Library Specification

**Priority P0 (Critical — must build before launch):**

| Widget | File | Purpose |
|--------|------|---------|
| `AsyncScreen` | `shared/widgets/async/async_screen.dart` | Scaffold that auto-handles loading/error/data/empty states via `AsyncValue`. Replaces per-screen boilerplate. |
| `ShimmerList` | `shared/widgets/async/shimmer_list.dart` | Generic shimmer placeholder for lists (configurable item count, aspect ratio) |
| `ShimmerGrid` | `shared/widgets/async/shimmer_grid.dart` | Grid shimmer for 2-column layouts |
| `EmptyState` | `shared/widgets/async/empty_state.dart` | Configurable: icon, title, subtitle, action button |
| `ErrorState` | `shared/widgets/async/error_state.dart` | Configurable: message, retry callback, optional stack trace |
| `OfflineAwareWidget` | `shared/widgets/async/offline_aware.dart` | Wraps content: shows cached data + stale banner OR OfflinePlaceholder |
| `SemanticIcon` | `shared/widgets/accessibility/semantic_icon.dart` | Icon wrapper that enforces `semanticsLabel` |
| `AccessibleScaffold` | `shared/widgets/accessibility/accessible_scaffold.dart` | Scaffold with built-in focus management, skip-to-content |

**Priority P1 (Should build):**

| Widget | Purpose |
|--------|---------|
| `AppScaffold` | Standard page layout (app bar, body, safe area, offline aware) |
| `CachedImage` | Wraps `cached_network_image` with loading/error/shimmer placeholders |
| `AvatarWidget` | User avatar with initials fallback, tier ring |
| `PointsBadge` | Points display with icon + animated count |
| `StatusDot` | Online/offline status indicator |
| `TierBadge` | User tier badge (Bronze/Silver/Gold/Platinum) |
| `AnimatedCounter` | Animated number transitions for points/balance |
| `ToastFeedback` | Reusable success/error toast |

### 6.3 Current Shimmer Pattern (Ad-hoc)

Each screen has its own shimmer implementation. 11 distinct shimmer implementations were found. **Standardize into reusable widgets.**

---

## 7. Core Infrastructure Review

### 7.1 Image Caching Pipeline ✅ (Production-Ready)

```
CDN URL ──► CdnAsset (DPR-aware, format, dimensions)
    │
    ▼
cached_network_image ──► flutter_cache_manager
    │                           │
    ▼                           ▼
Memory cache (100 MB)     Disk cache (7-day TTL, 500 items)
    │
    ▼
ImagePreloader (startup) ──► 12 key assets pre-cached
```

### 7.2 Offline Queue ✅ (Production-Ready)

```
Request fails (offline)
    │
    ▼
OfflineRequestQueue.enqueue(request)
    │
    ▼
ConnectivityService detects reconnection
    │
    ▼
Queue replays (3 retries max, 5s delay between)
    │
    ├── Success → resolve original future
    └── Failed  → mark as FAILED, alert via Sentry
```

### 7.3 Startup Sequence ✅ (Production-Ready)

```
Phase 0: WidgetsFlutterBinding.ensureInitialized() + deep link config
Phase 1: Firebase.initializeApp()                         (critical)
Phase 2: Deferred init registration                        (required)
Phase 3: Idle init (image preloader, memory profiler)      (background)
         │
         ├── ConfigGate (maintenance check)
         ├── DeviceSecurity (root detection)
         └── DreamHomeApp (MaterialApp.router)
```

### 7.4 Sentry Error Tracking ✅ (Production-Ready)

| Feature | Status |
|---------|--------|
| PII sanitization (email, IP) | ✅ |
| Exception filtering (AbortProgressResponseException, ConnectionRefusedError, TimeoutException, 429) | ✅ |
| HTTP breadcrumbs via Dio interceptor | ✅ |
| Screenshot capture | ✅ |
| View hierarchy capture | ✅ |
| 5xx + network error capture | ✅ |

**Missing:** `runZonedGuarded` for global async error catch-all.

### 7.5 Security ✅ (Production-Ready)

| Feature | Status |
|---------|--------|
| Root/jailbreak detection (native method channel) | ✅ |
| Screen protect (screenshot prevention) | ✅ |
| App background blur overlay | ✅ |
| SSL pinning (SHA-256 SPKI, release builds only) | ✅ |
| JWT in FlutterSecureStorage | ✅ |

---

## 8. Critical Gaps & Remediation Plan

### 8.1 P0 — Localization (Zero implementation)

**Current:** `LanguageScreen` stores `en`/`hi` preference in SharedPreferences. All strings hardcoded in English. No `flutter_localizations`, no `intl`, no `.arb` files.

**Remediation:**

```
lib/core/localization/
├── l10n/
│   ├── app_en.arb           # English strings (~500 entries)
│   ├── app_hi.arb           # Hindi strings (~500 entries)
│   └── ...
├── app_localizations.dart   # Generated delegates
├── locale_provider.dart     # Riverpod provider for locale
└── locale_service.dart      # Persistence + switching
```

**Implementation steps:**
1. Add `flutter_localizations` (SDK) + `intl` to pubspec.yaml
2. Create `.arb` files for all strings (start with en + hi)
3. Run `flutter gen-l10n` to generate delegates
4. Create `LocaleProvider` Riverpod notifier
5. Wrap all string literals with `AppLocalizations.of(context)!.xxx`
6. Wire locale switching from `LanguageScreen` to provider

**Effort:** ~500 string extractions, 2 `.arb` files (~500 entries each)
**Priority:** Must complete before Play Store launch.

### 8.2 P0 — Accessibility (Zero implementation)

**Current:** Zero `Semantics` widgets across 210+ Dart files. No screen reader support.

**Remediation:**

```
lib/core/accessibility/
├── semantic_helpers.dart    # Label builders, hint generators
├── focus_manager.dart       # Keyboard/focus navigation
├── accessibility_provider.dart  # Detect bold text, reduce motion
└── accessible_theme.dart    # Minimum touch targets, contrast ratios
```

**Minimum production requirements:**
- All `IconButton` → add `semanticsLabel`
- All images → add `semanticsLabel` (if informative) or `ExcludeSemantics` (if decorative)
- All form fields → add `Semantics` with label + hint + error
- All lists → `MergeSemantics` for list items
- `MediaQueryData.accessibilityFeatures` → respect reduce motion, bold text
- Minimum tap target: 48x48dp on all interactive elements

**Priority:** Legal/compliance requirement for many markets. Required for App Store accessibility guidelines.

### 8.3 P0 — Permissions (Zero implementation)

**Current:** `image_picker` called without runtime permission check. No `permission_handler` package.

**Remediation:**

```dart
// Centralized permission service
class PermissionService {
  Future<bool> requestCamera() async { ... }
  Future<bool> requestStorage() async { ... }
  Future<bool> requestNotifications() async { ... }

  Future<bool> requestKycPermissions() async {
    // Camera + storage for document upload
    final camera = await requestCamera();
    final storage = await requestStorage();
    return camera && storage;
  }
}
```

**Minimum permissions to handle:**
- Camera (KYC document photo capture)
- Storage (KYC image picker gallery access)
- Notifications (FCM prompt)
- Phone state (device identification)

**Priority:** Will crash on Android 13+ (API 33) without runtime permission requests.

### 8.4 P1 — Feature Tests (Zero coverage)

**Current:** 17 test files cover core infrastructure only. Zero feature-level tests.

**Remediation:**

```
test/
├── core/                         # Existing (keep)
├── features/
│   ├── auth/
│   │   ├── auth_notifier_test.dart
│   │   ├── login_screen_test.dart
│   │   └── otp_screen_test.dart
│   ├── contests/
│   │   ├── contest_list_notifier_test.dart
│   │   ├── contest_join_test.dart
│   │   └── contest_running_screen_test.dart
│   ├── wallet/
│   ├── notifications/
│   ├── feed/
│   ├── chat/
│   ├── polls/
│   └── achievements/
├── shared/
│   ├── async_widgets_test.dart
│   └── semantic_helpers_test.dart
└── integration/                  # Extended
    └── auth_flow_test.dart
```

**Required packages:** `mocktail` or `mockito`, `integration_test`

### 8.5 P1 — Offline Awareness (Zero screen-level)

**Current:** 0/18 screens check connectivity. Only app-level `OfflineBanner` exists.

**Remediation:** Every screen must:
1. Watch `connectivityProvider` 
2. If offline + has cached data → show stale data with `OfflineBanner`
3. If offline + no cached data → show `OfflinePlaceholder`
4. Auto-retry when connectivity restores

### 8.6 P2 — Additional Gaps

| Gap | Remediation |
|-----|-------------|
| No `runZonedGuarded` | Add global error zone in `main()` to catch unhandled async errors |
| No structured logging | Add `logging` package, create `LogService`, replace `debugPrint` calls |
| No `device_info_plus` | Add for device fingerprinting (anti-fraud) |
| No native splash | Add `flutter_native_splash` package, configure assets |
| No `app_links` package | Replace custom MethodChannel with `app_links` for reliable deep linking |
| No code generation | Add `build_runner` + `freezed` + `json_serializable` for model generation |
| No transition animations | Add `CustomTransitionPage` route transitions in GoRouter |
| No 404 error route | Add `errorBuilder` to GoRouter |

---

## 9. Production-Ready Widget Library Specification

### 9.1 `AsyncScreen` (Core Abstraction)

```dart
class AsyncScreen<T> extends StatelessWidget {
  final AsyncValue<T> value;
  final Widget Function(T data) data;
  final Widget Function()? loading;       // Default: ShimmerList
  final Widget Function()? empty;          // Default: EmptyState
  final Widget Function(Object e)? error;  // Default: ErrorState
  final VoidCallback? onRetry;
  final bool Function(T data)? isEmpty;   // Custom emptiness check
}
```

**Usage in every screen:**
```dart
AsyncScreen(
  value: ref.watch(contestListProvider),
  onRetry: () => ref.read(contestListProvider.notifier).refresh(),
  isEmpty: (list) => list.isEmpty,
  data: (contests) => ContestListView(contests: contests),
)
```

### 9.2 State Visual Specification

| State | Visual | Animation | Accessibility |
|-------|--------|-----------|---------------|
| **Loading** | Shimmer skeleton (matches real layout dimensions) | Pulsing opacity 0.3→1.0 | `Semantics(label: 'Loading...', liveRegion: true)` |
| **Empty** | Centered column: 48dp icon + 20dp title + 14dp subtitle + CTA | Fade in (300ms) | `Semantics(label: 'No items found. $ctaLabel')` |
| **Error** | Centered column: 48dp error icon + 18dp message + Retry button | Shake animation on icon | `Semantics(label: 'Error: $message. Tap to retry.')` |
| **Offline (cached)** | Normal data + yellow banner at top (32dp) | Slide down banner | Banner: `Semantics(label: 'You are offline. Showing cached data.')` |
| **Offline (no cache)** | `OfflinePlaceholder`: 64dp icon + 22dp title + 14dp message + Retry | Fade in (300ms) | `Semantics(label: 'No internet connection.')` |

### 9.3 Theme Tokens (Current — Production-Ready)

| Token | Value | Usage |
|-------|-------|-------|
| `primaryRed` | `#D22C2C` | Primary buttons, active states, brand elements |
| `secondarySlate` | `#1F2937` | Card backgrounds, surface elements |
| `darkSlate` | `#121826` | App background |
| `emeraldGreen` | `#10B981` | Success states, positive amounts |
| `goldYellow` | `#F59E0B` | Premium features, tier indicators |
| `primaryGradient` | Linear red gradient | Hero sections, decorative elements |
| `darkCardGradient` | Linear slate gradient | Card overlays |
| `goldGradient` | Linear gold gradient | Premium badges |

**Font:** Outfit (Google Fonts) — all weights 300–700. Scales via `textScaleFactor`.

---

## 10. Testing Architecture

### 10.1 Test Pyramid

```
           ╱─────╲
          ╱  E2E  ╲         1-2 critical user flows
         ╱─────────╲
        ╱  Feature  ╲        Every screen + provider
       ╱  (widget)   ╲      (18 screens × 3 states = 54 tests minimum)
      ╱───────────────╲
     ╱    Unit Tests    ╲    Every notifier, repository, model
    ╱─────────────────────╲  (30 providers × 2 tests = 60)
   ╱   Core Infrastructure  ╲  (existing 17 test files)
  ╱───────────────────────────╲
```

### 10.2 Recommended Test Package Additions

| Package | Purpose |
|---------|---------|
| `mocktail` | Mocking for Riverpod notifiers and repositories |
| `integration_test` | Full-flow user journey tests |
| `golden_tests` | Visual regression (optional, for launch) |

### 10.3 Minimum Test Plan

| Layer | Count | Examples |
|-------|-------|----------|
| Unit: Notifiers | 30 | authNotifier, contestListNotifier, walletNotifier |
| Unit: Repositories | 15 | contestRepository, paymentRepository, kycRepository |
| Unit: Models | 10 | ContestModel.fromJson, WalletSummary.fromJson |
| Widget: Screens | 18 | Each screen: loading → data, error → retry, empty → CTA |
| Widget: Shared | 5 | AsyncScreen, ShimmerList, EmptyState, ErrorState, OfflineAwareWidget |
| Integration | 3 | Auth flow (splash → login → OTP → home), Contest join, KYC submission |
| **Total** | **81 tests** | |

---

## 11. Accessibility Specification

### 11.1 Minimum Compliance (WCAG 2.1 Level AA)

| Requirement | Implementation |
|-------------|---------------|
| **Screen reader labels** | All interactive elements: `Semantics(button: true, label: 'Close')` |
| **Touch targets** | Minimum 48×48dp for all tappable elements |
| **Color contrast** | Text on backgrounds: 4.5:1 ratio (current dark theme passes most) |
| **Reduce motion** | `MediaQuery.accessibilityFeatures.reduceMotion` → disable animations |
| **Bold text** | `MediaQuery.accessibilityFeatures.boldText` → adjust text scale |
| **Focus order** | Logical tab order for form fields |
| **Error announcements** | Live regions for form validation errors |

### 11.2 Accessibility Audit Results

| Check | Status | Details |
|-------|--------|---------|
| `Semantics` widgets | ❌ 0/210+ files | Complete absence |
| `MergeSemantics` | ❌ Not used | Complex widgets read as multiple elements |
| `ExcludeSemantics` | ❌ Not used | Decorative icons not excluded |
| `semanticsLabel` on IconButton | ❌ Not used | All icon buttons invisible to TalkBack/VoiceOver |
| `MediaQuery.accessibilityFeatures` | ❌ Not checked | Bold text, reduce motion ignored |
| Touch targets >= 48dp | ⚠️ Unknown | Not measured — likely many under |
| Color contrast | ✅ Likely passes | Dark theme provides high contrast naturally |

---

## 12. Localization Architecture

### 12.1 String Extraction Pattern

```dart
// CURRENT (hardcoded English):
Text('Join Contest')

// PRODUCTION (localized):
Text(AppLocalizations.of(context)!.joinContest)
```

### 12.2 ARB File Structure

```json
// app_en.arb
{
  "@@locale": "en",
  "appName": "Dream Home 11",
  "joinContest": "Join Contest",
  "joinContestHint": "Tap to join this prediction contest",
  "walletBalance": "Wallet Balance",
  "noContests": "No contests available",
  "noContestsHint": "Check back later for new contests",
  "@joinContest": {
    "description": "Button label for joining a contest"
  }
}

// app_hi.arb
{
  "@@locale": "hi",
  "appName": "ड्रीम होम 11",
  "joinContest": "कॉन्टेस्ट में शामिल हों",
  "walletBalance": "वॉलेट बैलेंस",
  "noContests": "कोई कॉन्टेस्ट उपलब्ध नहीं",
}
```

### 12.3 Provider Integration

```dart
@riverpod
class LocaleNotifier extends _$LocaleNotifier {
  @override
  Locale build() => const Locale('en');

  void setLocale(Locale locale) {
    state = locale;
    // Persist to SharedPreferences
  }
}
```

---

## 13. Performance Budget & Benchmarks

### 13.1 App Startup

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Time to interactive | < 3s | Unknown | ⚠️ Measure |
| Phase 0-1 (Firebase init) | < 1s | ~500ms | ✅ |
| Phase 2 (deferred registration) | < 500ms | ~200ms | ✅ |
| Phase 3 (idle init) | < 2s | ~1s | ✅ |
| Native splash seen | N/A | White flash | ❌ |

### 13.2 Runtime Performance

| Metric | Target | Status |
|--------|--------|--------|
| Frame build time | < 16ms (60fps) | ⚠️ Monitor via `PerformanceMonitor` |
| Jank rate | < 5% of frames | ⚠️ Monitor via `PerformanceMonitor` |
| Memory usage | < 200MB | ⚠️ Monitor via `MemoryProfiler` |
| Image cache | < 100MB | ✅ Configured |
| API response time | < 2s | ⚠️ Backend-dependent |

### 13.3 Build Size (Current)

| Platform | Size | Target |
|----------|------|--------|
| Android APK | Unknown | < 30MB |
| Android AAB | Unknown | < 20MB |
| iOS IPA | Unknown | < 50MB |

---

## 14. Appendix: Complete Provider Inventory

| Feature | Provider | Type | Has Loading? | Has Error? | Has Empty? |
|---------|----------|------|-------------|------------|------------|
| Auth | `authProvider` | StateNotifier | ✅ | ✅ | N/A |
| Config | `configNotifierProvider` | StateNotifier | ✅ | ✅ | N/A |
| User Profile | `userProfileProvider` | StateNotifier | ✅ | ✅ | N/A |
| User Stats | `userStatsProvider` | StateNotifier | ✅ | ✅ | N/A |
| Contest List | `contestListProvider` | StateNotifier | ✅ | ✅ | ❌ |
| Notifications | `notificationsProvider` | StateNotifier | ✅ | ✅ | ✅ |
| Wallet | `balanceSummaryProvider` | FutureProvider | ✅ | ✅ | N/A |
| Transactions | `transactionHistoryProvider` | FutureProvider | ✅ | ✅ | ✅ |
| FCM Token | `fcmTokenProvider` | FutureProvider | ✅ | ✅ | N/A |
| Referral | `referralProvider` | StateNotifier | ✅ | ✅ | ✅ |
| Leaderboard | `leaderboardProvider` | StateNotifier | ✅ | ✅ | ❌ |
| Winners | `winnerProvider` | StateNotifier | ✅ | ✅ | ✅ |
| Rewards | `rewardProvider` | StateNotifier | ✅ | ✅ | ✅ |
| Spin | `spinProvider` | StateNotifier | ✅ | ✅ | N/A |
| Polls | `pollsProvider` | StateNotifier | ✅ | ✅ | ✅ |
| Achievements | `achievementsProvider` | StateNotifier | ✅ | ✅ | ✅ |
| KYC | `kycProvider` | StateNotifier | ✅ | ✅ | N/A |
| Feed | `feedProvider` | StateNotifier | ✅ | ✅ | ✅ |
| Chat | `chatProvider` | StateNotifier | ✅ | ✅ | ✅ |
| Chat List | `chatHistoryProvider` | StateNotifier | ✅ | ✅ | ✅ |
| Streak | `streakProvider` | StateNotifier | ✅ | ✅ | N/A |
| Multiplier | `multiplierProvider` | StateNotifier | ✅ | ✅ | N/A |
| Daily Actions | `dailyActionsProvider` | StateNotifier | ✅ | ✅ | N/A |
| Prize Homes | `prizeHomeProvider` | StateNotifier | ✅ | ✅ | ✅ |
| Compensation | `compensationProvider` | StateNotifier | ✅ | ✅ | ✅ |
| Banners | `bannerProvider` | StateNotifier | ✅ | ✅ | ✅ |
| Bank Details | `bankDetailsProvider` | StateNotifier | ✅ | ✅ | N/A |
| Payment Methods | `paymentMethodsProvider` | StateNotifier | ✅ | ✅ | ✅ |
| Shares | `shareProvider` | StateNotifier | ✅ | ✅ | ✅ |

**Key finding:** 2 providers lack empty state handling (contest list, leaderboard). These show blank screens when data is empty.

---

## 15. Appendix: Screen State Requirements Checklist

Use this checklist for every screen during production hardening.

```
Screen: _______________________

[ ] Loading state
    [ ] Shimmer/skeleton matches real layout
    [ ] Spinner for operations (submit, delete)
    [ ] No jank during loading transition

[ ] Data state
    [ ] Content renders correctly
    [ ] Pull-to-refresh works (where applicable)
    [ ] Pagination works (where applicable)

[ ] Empty state
    [ ] Icon (48dp, muted color)
    [ ] Title (16-20dp, descriptive)
    [ ] Subtitle (14dp, helpful)
    [ ] CTA button (refresh/browse/create)
    [ ] Not a blank screen

[ ] Error state
    [ ] User-friendly message (not raw error)
    [ ] Retry button
    [ ] Error logged to Sentry
    [ ] Error logged to structured log

[ ] Offline state
    [ ] Shows cached data if available
    [ ] Shows stale banner if using cached data
    [ ] Shows OfflinePlaceholder if no cache
    [ ] Auto-retries when connectivity returns

[ ] Accessibility
    [ ] Semantics label on all IconButtons
    [ ] Semantics label on all informative images
    [ ] ExcludeSemantics on decorative elements
    [ ] MergeSemantics on grouped list items
    [ ] Touch targets >= 48dp
    [ ] Respects reduce motion setting

[ ] Localization
    [ ] All strings use AppLocalizations
    [ ] Date/number formats localized
    [ ] RTL layout supported

[ ] Performance
    [ ] No unnecessary rebuilds
    [ ] List items are const where possible
    [ ] Images use cached_network_image
    [ ] No layout overflow in any state
```

---

*End of Flutter Architecture Specification*
