# Dream Home 11 — Architecture Document

## System Overview

Dream Home 11 is a fantasy home contest platform. Users join contests by predicting real estate outcomes, earn points, climb leaderboards, and win prizes including actual homes. The platform follows a mobile-first architecture with a Flutter frontend, NestJS API backend, PostgreSQL database, and Redis caching layer.

```
┌─────────────────────────────────────────────────────────────┐
│                        Users                                │
│                (iOS & Android Apps)                         │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS / WSS
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Nginx Reverse Proxy                       │
│           SSL Termination · Rate Limiting · WebSocket Proxy │
│              Static Asset Serving · API Routing             │
└──────┬──────────────────────┬──────────────────────┬────────┘
       │                      │                      │
       ▼                      ▼                      ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────────┐
│  App Server  │    │  App Server  │    │   App Server     │
│  (NestJS)    │    │  (NestJS)    │    │   (NestJS)       │
│  :3000       │    │  :3000       │    │   :3000          │
└──────┬───────┘    └──────┬───────┘    └───────┬──────────┘
       │                   │                     │
       └───────────────────┼─────────────────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
     ┌────────────────┐       ┌──────────────────┐
     │   PgBouncer    │       │      Redis       │
     │  Connection    │       │   Cache + Pub/Sub │
     │   Pooling      │       │  Session + Throttle│
     │   :5432        │       │   :6379           │
     └───────┬────────┘       └──────────────────┘
             │
             ▼
     ┌────────────────┐
     │   PostgreSQL   │
     │  Primary DB    │
     │   :5432        │
     └────────────────┘
```

---

## Component Architecture

### 1. Flutter Mobile App (`lib/`)

- **Platform**: iOS and Android via Flutter 3.x
- **State Management**: Riverpod for reactive state
- **Routing**: GoRouter with auth guards
- **Network**: Dio HTTP client with interceptors (SSL pinning, auth, caching)
- **Auth**: Firebase Phone Auth + JWT token storage in `flutter_secure_storage`
- **Real-time**: Socket.io client for contest feeds and chat
- **Push**: Firebase Cloud Messaging (FCM)
- **Architecture**: Feature-first folder structure

```
lib/
├── core/               # Shared utilities
│   ├── network/        # Dio client, interceptors, SSL pinning
│   ├── router/         # GoRouter configuration
│   ├── theme/          # Design tokens, typography
│   └── utils/          # Formatters, validators
├── features/           # Feature modules
│   ├── auth/           # Login, OTP, language select
│   ├── dashboard/      # Home dashboard, drawer
│   ├── contests/       # Contest list, join, running, completed
│   ├── wallet/         # Wallet, deposits, KYC
│   ├── rewards/        # Catalog, redemption, prize homes
│   └── community/      # Feed, spin wheel, chat
└── main.dart           # Application entry point
```

### 2. NestJS API Server (`backend/src/`)

- **Runtime**: Node.js 20 LTS
- **Framework**: NestJS 11 with Express platform
- **Language**: TypeScript (strict mode)
- **Database ORM**: TypeORM with PostgreSQL
- **Validation**: class-validator + class-transformer
- **Auth**: JWT (via `@nestjs/jwt`) + Firebase Admin SDK
- **Real-time**: Socket.io (via `@nestjs/platform-socket.io`)
- **Caching**: ioredis client
- **Scheduling**: `@nestjs/schedule` for CRON jobs
- **Rate Limiting**: `@nestjs/throttler` with Redis storage
- **Logging**: Pino for structured JSON logging
- **Monitoring**: Prometheus client (`prom-client`) + Sentry

### 3. PostgreSQL Database

- **Version**: PostgreSQL 16
- **Connection Pooling**: PgBouncer (transaction mode)
- **Key Tables**: `users`, `contests`, `contest_members`, `point_logs`, `transactions`, `payments`, `kyc`, `rewards`, `feed_posts`, `chat_messages`, `notifications`, `withdrawals`, etc.
- **Migrations**: TypeORM migration system
- **Backup**: Automated pg_dump to S3 with lifecycle policies

### 4. Redis Cache

- **Version**: Redis 7
- **Use Cases**:
  - Session & rate limit storage (TTL-based keys)
  - Leaderboard sorted sets (`zadd`, `zrevrank`)
  - User profile cache (5-minute TTL)
  - Daily action counters (`user:actions:<userId>:<date>`)
  - Socket.io pub/sub for WebSocket broadcasting
  - Throttle counter storage

### 5. Nginx Reverse Proxy

- **SSL Termination**: Let's Encrypt via Certbot (auto-renewal)
- **Rate Limiting**: Per-IP and per-route limits at proxy level
- **WebSocket Proxy**: Upgrades and forwards Socket.io connections
- **Static Assets**: Serves uploaded files from `/uploads/` path
- **Security Headers**: HSTS, X-Frame-Options, X-Content-Type-Options

### 6. PgBouncer

- **Mode**: Transaction pooling
- **Purpose**: Manages PostgreSQL connection pool efficiently
- **Default pool**: 25 server connections
- **Max client connections**: 100

---

## Data Flow

### Authentication Flow

```
┌──────┐     ┌────────────┐     ┌──────────┐     ┌───────────┐
│ App  │────►│ Firebase   │────►│ Backend  │────►│  Database │
│      │     │ Auth SDK   │     │ Auth Svc │     │           │
└──────┘     └────────────┘     └──────────┘     └───────────┘
    │              │                │
    │  1. Phone    │                │
    │  + OTP       │                │
    │─────────────►│                │
    │              │                │
    │  2. ID Token │                │
    │◄─────────────│                │
    │              │                │
    │  3. POST /auth/verify-otp    │
    │  { idToken }────────────────►│
    │              │   4. Verify   │
    │              │   Firebase    │
    │              │   ID Token    │
    │              │◄─────────────►│
    │              │                │
    │              │   5. Upsert   │
    │              │   User        │
    │              │──────────────►│
    │              │                │
    │  6. JWT      │                │
    │◄─────────────│◄──────────────│
    │              │                │
    │  7. Store JWT in secure storage
    │
```

### Contest Join Flow

```
┌──────┐          ┌─────────┐      ┌────────┐      ┌──────────┐      ┌───────────┐
│ App  │          │ Nginx   │      │Contest │      │  Wallet/ │      │ Point Log │
│      │          │         │      │Service │      │  Tx Svc  │      │           │
└──┬───┘          └────┬────┘      └───┬────┘      └────┬─────┘      └─────┬─────┘
   │                   │               │                │                 │
   │ POST /contests/id/join            │                │                 │
   │ { idempotencyKey }                │                │                 │
   │──────────────────────────────────►│                │                 │
   │                   │               │                │                 │
   │                   │    1. Validate JWT + contest   │                 │
   │                   │    2. Check contest exists     │                 │
   │                   │    3. Check slots available    │                 │
   │                   │               │                │                 │
   │                   │    4. BEGIN TRANSACTION        │                 │
   │                   │               │                │                 │
   │                   │    5. Lock wallet row          │                 │
   │                   │    (SELECT FOR UPDATE)         │                 │
   │                   │───────────────────────────────►│                 │
   │                   │               │                │                 │
   │                   │    6. Check balance >= fee     │                 │
   │                   │    7. Deduct wallet            │                 │
   │                   │◄───────────────────────────────│                 │
   │                   │               │                │                 │
   │                   │    8. Insert contest_member    │                 │
   │                   │───────────────►                │                 │
   │                   │               │                │                 │
   │                   │    9. Log point deduction      │                 │
   │                   │───────────────────────────────────────────────►  │
   │                   │               │                │                 │
   │                   │  10. COMMIT                    │                 │
   │                   │               │                │                 │
   │                   │  11. Emit WebSocket event      │                 │
   │                   │  (point update to members)     │                 │
   │                   │               │                │                 │
   │ 201 { success }   │               │                │                 │
   │◄──────────────────│◄──────────────│◄───────────────│◄────────────────│
```

### Payment Flow

```
┌──────┐     ┌──────────┐     ┌───────────┐     ┌──────────┐     ┌──────────┐
│ App  │     │ Razorpay │     │ Backend   │     │ Database │     │   Redis  │
│      │     │          │     │ Payments  │     │          │     │          │
└──┬───┘     └────┬─────┘     └─────┬─────┘     └────┬─────┘     └────┬─────┘
   │              │                 │                 │               │
   │ POST /payments/order           │                 │               │
   │ { amount }────────────────────►│                 │               │
   │              │                 │                 │               │
   │              │   1. Create     │                 │               │
   │              │   Razorpay     │                 │               │
   │              │   Order────────►                 │               │
   │              │◄───────────────│                 │               │
   │              │                 │                 │               │
   │ { orderId }◄──────────────────│                 │               │
   │              │                 │                 │               │
   │ 2. Open      │                 │                 │               │
   │ Payment      │                 │                 │               │
   │ Sheet        │                 │                 │               │
   │─────────────►│                 │                 │               │
   │              │                 │                 │               │
   │ 3. User      │                 │                 │               │
   │ Completes    │                 │                 │               │
   │ Payment      │                 │                 │               │
   │◄─────────────│                 │                 │               │
   │              │                 │                 │               │
   │ 4. Webhook   │                 │                 │               │
   │ (Server-side)│                 │                 │               │
   │              │ POST /payments/webhook            │               │
   │              │ {orderId,paymentId,signature}────►│               │
   │              │                 │                 │               │
   │              │                 │ 5. Verify       │               │
   │              │                 │ SHA256 sig      │               │
   │              │                 │ 6. BEGIN TX     │               │
   │              │                 │ 7. Update payment│              │
   │              │                 │    status────────►              │
   │              │                 │ 8. Add cash      │               │
   │              │                 │    to wallet─────►              │
   │              │                 │ 9. Award bonus   │               │
   │              │                 │    points────────►              │
   │              │                 │ 10. COMMIT       │               │
   │              │                 │                 │               │
   │              │                 │ 11. Invalidate   │               │
   │              │                 │    user cache────►──────────────►│
   │              │                 │                 │               │
   │ 5. Poll /payments/history     │                 │               │
   │ or receive push notification◄─│◄────────────────│◄──────────────│
```

### WebSocket Flow (Contest Live Feed)

```
┌──────┐      ┌─────────┐      ┌──────────┐     ┌─────────┐     ┌──────────┐
│ App  │      │  Nginx  │      │ Socket.io│     │  Redis  │     │  Other   │
│(WS)  │      │  Proxy  │      │  Gateway │     │  Pub/Sub│     │ Clients  │
└──┬───┘      └────┬────┘      └────┬─────┘     └────┬────┘     └────┬─────┘
   │               │                │                 │              │
   │ 1. Connect    │                │                 │              │
   │ /socket.io/?token=jwt         │                 │              │
   │──────────────►│                │                 │              │
   │               │ 2. Upgrade    │                 │              │
   │               │──────────────►│                 │              │
   │               │                │                 │              │
   │               │  3. Auth JWT  │                 │              │
   │               │  4. Join room: contest-{id}     │              │
   │               │                │                 │              │
   │ 5. Subscribe  │                │                 │              │
   │ to contest    │                │                 │              │
   │──────────────►│───────────────►│                 │              │
   │               │                │                 │              │
   │               │                │ 6. SUBSCRIBE    │              │
   │               │                │ contest:{id}   │              │
   │               │                │────────────────►              │
   │               │                │                 │              │
   │               │                │ 7. New point    │              │
   │               │                │ update event    │              │
   │               │                │(from contest join, etc.)      │
   │               │                │◄────────────────│◄─────────────│
   │               │                │                 │              │
   │               │ 8. Broadcast  │                 │              │
   │               │  to room      │                 │              │
   │◄──────────────│◄──────────────│                 │              │
   │               │                │                 │              │
```

---

## Deployment Architecture

### Development

```
┌──────────────────────────────────┐
│         Docker Compose            │
│  ┌──────┐  ┌──────┐  ┌────────┐ │
│  │  DB  │  │ Redis│  │  App   │ │
│  │:5432 │  │:6379 │  │:3000   │ │
│  └──────┘  └──────┘  └────────┘ │
│    Single host, single replica   │
└──────────────────────────────────┘
```

### Staging

```
┌──────────────────────────────────┐
│   Docker Compose or K8s (1 node) │
│  ┌──────┐  ┌──────┐  ┌────────┐ │
│  │Pgboun │  │ Redis│  │  App x1│ │
│  │:5432  │  │:6379 │  │:3000   │ │
│  ├──────┤  └──────┘  └────────┘ │
│  │  DB  │  ┌──────┐             │
│  │:5432 │  │Nginx │             │
│  └──────┘  │:443  │             │
│            └──────┘             │
└──────────────────────────────────┘
```

### Production

```
┌────────────────────────────────────────────────────────────────┐
│                     Load Balancer (ALB/NGINX)                  │
│              SSL Termination + WebSocket Proxy                 │
└─────────┬──────────┬───────────┬────────────┬─────────────────┘
          │          │           │            │
    ┌─────▼──┐  ┌────▼───┐  ┌───▼────┐  ┌───▼────┐
    │ App x3 │  │ App x3 │  │ App x3 │  │ App x3 │
    │ :3000  │  │ :3000  │  │ :3000  │  │ :3000  │
    └────┬───┘  └────┬───┘  └───┬────┘  └───┬────┘
         │           │          │           │
         └───────────┴──────────┴───────────┘
                     │
            ┌────────▼────────┐
            │   PgBouncer     │
            │  (HA Pair)      │
            └────────┬────────┘
                     │
            ┌────────▼────────┐
            │   PostgreSQL    │
            │  (RDS Multi-AZ) │
            └────────┬────────┘
                     │
            ┌────────▼────────┐
            │   Read Replica  │
            │  (reporting)    │
            └─────────────────┘

    ┌──────────────────┐     ┌──────────────────┐
    │  Redis (ElastiCache) │  │  Redis (ElastiCache) │
    │  Primary :6379   │     │  Replica :6379   │
    │  (leaderboards)  │     │  (session/cache) │
    └──────────────────┘     └──────────────────┘

    ┌──────────────────┐     ┌──────────────────┐
    │  S3 (static +    │     │  CloudFront CDN  │
    │  uploads)        │     │  (assets, images) │
    └──────────────────┘     └──────────────────┘

    ┌──────────────────┐     ┌──────────────────┐
    │  Fluentd / Loki  │     │  Sentry          │
    │  (log agg)       │     │  (errors)        │
    └──────────────────┘     └──────────────────┘
```

---

## Security Architecture

### Authentication

- **Firebase Phone Auth**: First factor — verifies phone number via OTP
- **JWT Tokens**: Second factor — signed by `JWT_SECRET`, 7-day expiry
- **Token Storage**: `flutter_secure_storage` on mobile (Keychain/Keystore encrypted)
- **Token Refresh**: Via refresh token rotation

### Authorization

- **JWT Auth Guard**: Validates token on every protected route
- **Roles Guard**: `ADMIN` role check for admin endpoints
- **Resource-based**: User can only access their own data (userId scoping)

### Rate Limiting

- **Global**: 30 req/min per user (production)
- **Per-endpoint**: Stricter limits on sensitive routes (auth: 5/min, payments: 10/min)
- **Storage**: Redis-backed for distributed rate counting
- **Nginx Layer**: Additional per-IP rate limiting for DDoS protection

### Data Protection

- **SQL Injection**: TypeORM parameterized queries + input sanitization
- **XSS**: Helmet headers, input sanitization via SanitizePipe
- **CSRF**: SameSite cookies, token-based auth (not cookie-based)
- **SSL/TLS**: Let's Encrypt certificates, auto-renewal via Certbot
- **Request Validation**: class-validator DTOs with whitelist mode
- **File Upload**: Magic byte validation, MIME type check, size limits (5MB)

### Additional Protections

- **Helmet**: Security headers (CSP disabled deliberately, HSTS enabled)
- **CORS**: Restricted origins in production
- **Trust Proxy**: Behind nginx/load balancer
- **Payment Idempotency**: Prevents double-charge on retries
- **DB Locking**: `SELECT FOR UPDATE` on wallet operations

---

## Scaling Strategy

| Component | Approach | Trigger |
|-----------|----------|---------|
| **App Servers** | Horizontal scaling (add replicas) | CPU > 70%, request latency > 500ms |
| **PostgreSQL** | Vertical scaling + read replicas | Connection pool > 80%, query queue > 100 |
| **Redis** | Cluster mode (sharding) | Memory > 75%, OOM threshold |
| **PgBouncer** | Multiple instances behind internal LB | Connection count > 500 |
| **Nginx** | Horizontal behind ALB | Connection count > 5000 |
| **CDN** | CloudFront for static assets | Configured once |
| **Logging** | Fluentd → S3/Loki | Scales with log volume |

### Estimated Capacity per App Instance

| Resource | Limit |
|----------|-------|
| Concurrent requests | ~500 per replica |
| Memory | 256MB-512MB |
| CPU | 0.5-1 core |
| WebSocket connections | ~1000 per replica |
| DB connections | 25 per replica (via PgBouncer) |

---

## Directory Structure

```
dream-home-11/
├── lib/                          # Flutter mobile application
│   ├── core/                     # Core utilities
│   │   ├── network/              # API client, interceptors, SSL pinning
│   │   ├── router/               # GoRouter route definitions
│   │   ├── theme/                # Design tokens, colors, text styles
│   │   └── utils/                # Formatters, validators, helpers
│   └── features/                 # Feature modules
│       ├── auth/                 # Login, OTP, language selection
│       ├── dashboard/            # Home dashboard, navigation drawer
│       ├── contests/             # Contest list, join, running, completed
│       ├── wallet/               # Wallet, deposits, withdrawals, KYC
│       ├── rewards/              # Rewards catalog, prize homes, redemptions
│       └── community/            # Feed, spin wheel, chat, polls
├── backend/                      # NestJS API server
│   ├── src/                      # Source code
│   │   ├── auth/                 # Authentication module
│   │   ├── users/                # User management
│   │   ├── contests/             # Contest engine
│   │   ├── payments/             # Payment processing
│   │   ├── kyc/                  # KYC verification
│   │   ├── rewards/              # Rewards catalog
│   │   ├── feed/                 # Community feed
│   │   ├── leaderboard/          # Redis-backed leaderboards
│   │   ├── chat/                 # Real-time messaging
│   │   ├── gamification/         # Spin wheel, polls
│   │   ├── admin/                # Admin panel API
│   │   ├── health/               # Health check endpoints
│   │   ├── common/               # Shared pipes, guards, interceptors
│   │   ├── config/               # System configuration
│   │   ├── database/             # Database config + migrations
│   │   ├── migrations/           # TypeORM migration files
│   │   ├── notifications/        # FCM, reminders
│   │   ├── points/               # Points engine, streaks
│   │   ├── transactions/         # Double-entry transactions
│   │   ├── withdrawals/          # Withdrawal processing
│   │   ├── referrals/            # Referral tracking
│   │   └── support/              # Support tickets
│   ├── scripts/                  # Database backup/restore scripts
│   ├── test/                     # E2E tests
│   └── uploads/                  # File uploads directory
├── deploy/                       # Infrastructure
│   ├── docs/                     # Deployment documentation
│   ├── k8s/                      # Kubernetes manifests
│   ├── nginx/                    # Nginx config + SSL
│   ├── fluentd/                  # Log aggregation config
│   └── terraform/                # Infrastructure as code
└── backend/deploy/               # Backend-specific Docker/deploy configs
```
