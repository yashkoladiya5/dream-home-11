# Dream Home 11 — Security Documentation

## Authentication

- **Method**: JWT-based authentication via Firebase Phone Auth
- **Token Flow**: Phone number OTP → Firebase verification → Custom JWT issued by API
- **Token Expiry**: Configurable via `JWT_EXPIRATION` env (default: 7 days)
- **Storage**: Tokens stored in device secure storage (FlutterSecureStorage on mobile)
- **Refresh**: Token rotation on re-authentication; no refresh token pattern (re-login required)
- **Firebase**: Admin SDK validates OTP server-side; no client-side token trust

### Guards & Decorators

| Guard | Endpoints | Description |
|-------|-----------|-------------|
| `JwtAuthGuard` | Protected user endpoints | Validates Bearer JWT, loads user from DB, checks active status |
| `RolesGuard` | Admin endpoints | Checks `@Roles(UserRole.ADMIN)` metadata, enforces role hierarchy |
| `ApiKeyGuard` | Webhooks / admin callbacks | Validates `X-API-Key` header against hashed keys from `API_KEYS` env |
| `ThrottlerBehindProxyGuard` | All (global) | Per-IP rate limiting via `@nestjs/throttler` with Redis storage |
| `UserRateLimitGuard` | Per-endpoint (decorator) | Per-user rate limiting per endpoint group via `@UserRateLimit()` |

### Decorators

- `@GetUser()` — Injects authenticated `User` entity into handler
- `@Roles(UserRole.ADMIN)` — Restricts endpoint to admin/moderator roles
- `@UserRateLimit(group, limit?, ttl?)` — Per-user rate limiting per endpoint group
- `@ApiKeyAuth()` — Marks endpoint as accessible via API key (used for webhooks)

---

## Authorization

- **Role-based**: Three-tier role system — `user`, `moderator`, `admin`
- **Enforcement**: `RolesGuard` reads metadata set by `@Roles()` decorator
- **API Key Auth**: `ApiKeyGuard` for service-to-service communication (Razorpay webhooks, etc.)
- **Key Rotation**: Multiple API keys can be active simultaneously; keys are SHA-256 hashed for comparison
- **Scope**: Admin endpoints under `/api/v1/admin/*` require JWT + admin role

---

## Data Protection

### At Rest

| Data Layer | Protection |
|------------|------------|
| PostgreSQL | Encrypted at rest (AWS RDS encryption) |
| Device storage | FlutterSecureStorage (AES-256 on iOS/Android) |
| Redis | Optional encryption (AWS ElastiCache encryption in-transit and at-rest) |
| PII (Aadhaar/PAN) | Encrypted at column level using application-layer encryption |
| API Keys | Stored as SHA-256 hashes in env/secrets manager |

### In Transit

- TLS 1.2+ enforced across all external communications
- HSTS header: `max-age=63072000; includeSubDomains; preload` (2 years)
- API exposed only through HTTPS (HTTP → HTTPS redirect at ALB/CDN)
- Internal service communication over VPC (no public routing)

### PII Masking

- Aadhaar/PAN numbers masked in audit logs (`XXXX-XXXX-1234`)
- Authorization tokens redacted from all logs via Pino `redact` configuration
- Sentry PII sanitization strips `authorization`, `cookie`, `x-api-key` headers
- Request/response logging excludes sensitive fields

---

## Rate Limiting

### Per-IP (Global)

- **Backend**: `@nestjs/throttler` with Redis distributed storage
- **Default limit**: 30 requests/minute (production), 100K (development)
- **Proxy-aware**: `ThrottlerBehindProxyGuard` reads first IP from `X-Forwarded-For`
- **Block duration**: 60 seconds after limit exceeded

### Per-User (Endpoint Groups)

Applied via `@UserRateLimit()` decorator on specific endpoints:

| Group | Default Limit | Window | Env Override |
|-------|---------------|--------|--------------|
| `auth` | 5 req/min | 60s | `RATE_LIMIT_AUTH` |
| `contest-join` | 10 req/min | 60s | `RATE_LIMIT_CONTEST_JOIN` |
| `wallet` | 10 req/min | 60s | `RATE_LIMIT_WALLET` |
| `kyc` | 5 req/min | 60s | `RATE_LIMIT_KYC` |
| `api` | 60 req/min | 60s | `RATE_LIMIT_API` |

- Uses Redis sorted sets with key pattern: `ratelimit:user:{userId}:{group}`
- Falls back to IP-based if user is not authenticated
- Logs violations to `AuditLogService` for forensic analysis
- Returns `Retry-After` header with 429 response

### Per-API-Key

- Separate rate limit for API key authenticated endpoints
- Default: 100 req/min (configurable via `RATE_LIMIT_API_KEY`)
- Key: `ratelimit:apikey:{key_hash_prefix}`

---

## Input Validation

### Whitelist Validation

- Global `ValidationPipe` with `whitelist: true`, `transform: true`, `forbidNonWhitelisted: true`
- DTOs decorated with `class-validator` decorators (`@IsString()`, `@IsNumber()`, etc.)
- Error messages disabled in production
- Consistent error format with field-level validation messages

### XSS Sanitization

- `SanitizePipe` applied globally after validation:
  - Strips `<script>`, `<iframe>`, `<object>`, `<embed>` tags
  - Removes `on*` event handlers and `javascript:` URIs
  - Removes all remaining HTML tags from text fields
  - Strips null bytes (`\0`)
  - Removes control characters except `\n`, `\t`, `\r`
  - Normalizes Unicode (NFC) to prevent homograph attacks
  - Enforces max string length (configurable via `MAX_STRING_LENGTH`)

### SQL Injection Prevention

- All database queries use TypeORM parameterized queries
- No raw SQL concatenation anywhere in the codebase
- TypeORM `where` clauses use object syntax, not raw strings

### Operator Injection Prevention

- `$`-prefixed keys (MongoDB operators like `$ne`, `$gt`, `$where`) rejected with `400 Bad Request`
- Applied in `SanitizePipe` for all object inputs

### Size Limits

Middleware enforces request body size limits per endpoint group:

| Endpoint Group | Max Size | Env Override |
|----------------|----------|--------------|
| API (general) | 1 MB | `MAX_REQUEST_SIZE_API` |
| KYC uploads | 10 MB | `MAX_REQUEST_SIZE_KYC` |
| Feed/posts with images | 5 MB | `MAX_REQUEST_SIZE_FEED` |
| Auth endpoints | 10 KB | `MAX_REQUEST_SIZE_AUTH` |

- Uses `Content-Length` header for fast rejection before body parsing

### Data Normalization

- Emails: lowercased and trimmed
- Phone numbers: stripped of spaces, dashes, and parentheses
- All strings: trimmed of leading/trailing whitespace

---

## Security Headers

| Header | Value | Notes |
|--------|-------|-------|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | 2-year HSTS |
| `Content-Security-Policy` | Production-only: restricted script/style/img sources | Inline scripts restricted to CDN + self |
| `X-Content-Type-Options` | `nosniff` | Default helmet behavior |
| `X-Frame-Options` | `SAMEORIGIN` | Prevents clickjacking |
| `X-XSS-Protection` | `0` | Disabled (redundant with CSP) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Leaks minimal referrer info |
| `Cross-Origin-Opener-Policy` | `same-origin` | Isolates cross-origin windows |
| `Cross-Origin-Embedder-Policy` | `require-corp` | Requires explicit cross-origin resource sharing |
| `Cross-Origin-Resource-Policy` | `same-origin` | Overridden to `cross-origin` for `/uploads/` |
| `Permissions-Policy` | Restrict camera, microphone, geolocation | Applied at reverse proxy level |
| `Cache-Control` | `no-store` for authenticated responses | Applied at controller level |

---

## Audit Logging

### Events Logged

| Category | Events |
|----------|--------|
| Authentication | Login success, login failure, token refresh |
| Payments | Payment initiated, verified, failed, refunded |
| KYC | Submitted, approved, rejected, document uploaded |
| Admin | User updates, contest compensation, config changes, notifications |
| Withdrawals | Requested, approved, rejected, completed |
| Rate Limiting | Per-user rate limit violations |
| API Key Usage | Webhook calls, admin API access |

### Log Contents

Every audit log entry contains:
- `action` — Machine-readable action identifier
- `resource` / `resourceId` — Target of the operation
- `userId` — Actor (user, admin, or `system` for API key)
- `ipAddress` — Originating IP
- `metadata` — JSON blob with correlation ID, user agent, operation-specific details
- `createdAt` — Auto-generated timestamp

### Retention

- Default: **90 days** (configurable via `AUDIT_LOG_RETENTION_DAYS`)
- Cleanup: `AuditLogService.cleanupOldLogs()` can be scheduled via cron

---

## Incident Response

### Detection

- **Sentry**: Error tracking with real-time alerting on 5xx errors and unhandled exceptions
- **Rate Limit Alerts**: Spike in 429 responses triggers investigation
- **Audit Log Review**: Anomalous access patterns (e.g., repeated login failures)

### Response Steps

1. **Contain**: Rate-limit offending IP/user via environment config
2. **Investigate**: Review audit logs, Sentry traces, request logs
3. **Remediate**: Patch vulnerability, rotate affected keys/tokens
4. **Notify**: Inform affected users if PII was exposed
5. **Document**: Update runbook with lessons learned

### Contact

| Role | Contact |
|------|---------|
| Security Lead | security@dreamhome11.com |
| DevOps / On-Call | devops@dreamhome11.com |
| Data Protection Officer | dpo@dreamhome11.com |

---

## Compliance

### Age Verification
- All users must verify 18+ age via KYC before withdrawing winnings
- KYC verification required: Aadhaar + PAN card
- Minors automatically restricted from real-money contests

### Restricted States
- Geo-blocking for restricted Indian states (e.g., Assam, Odisha, Telangana, Nagaland, Sikkim)
- Checked at registration and before contest join
- IP-based geo-location + user-declared state

### KYC Requirements
| Tier | Requirement | Verification |
|------|-------------|--------------|
| Level 1 | Phone + Name | Auto from Firebase |
| Level 2 | Aadhaar | Doc verification |
| Level 3 | PAN | Doc verification |
| Level 4 | Bank/UPI | For withdrawals > ₹10,000 |

### Data Retention
- Active users: data retained for account lifetime
- Deactivated accounts: data retained for 180 days, then anonymized
- Audit logs: 90 days (configurable)
- KYC documents: deleted 90 days after verification (store only verification status)

---

## Environment Configuration

All security-sensitive configuration is passed via environment variables:

| Variable | Purpose |
|----------|---------|
| `JWT_SECRET` | JWT signing secret (min 256-bit) |
| `JWT_EXPIRATION` | Token lifetime (default: 7d) |
| `API_KEYS` | Comma-separated API keys (plain or SHA-256 hashed) |
| `CORS_ORIGINS` | Comma-separated allowed origins |
| `CDN_DOMAIN` | CDN domain for CSP allowlisting |
| `RATE_LIMIT_AUTH` | Auth endpoint rate limit |
| `RATE_LIMIT_API_KEY` | API key rate limit |
| `AUDIT_LOG_RETENTION_DAYS` | Audit log retention period |
| `MAX_REQUEST_SIZE_*` | Per-endpoint request size limits |
| `SENTRY_DSN` | Sentry error tracking endpoint |
| `NODE_ENV` | Environment flag (production/staging/development) |

API keys and secrets are stored in AWS Secrets Manager and injected at deployment time.

---

## Dependency Audit

- `helmet` — HTTP headers security middleware
- `@nestjs/throttler` — Rate limiting with Redis storage
- `compression` — Response compression (with `x-no-compression` bypass)
- `class-validator` / `class-transformer` — DTO validation and transformation
- `typeorm` — ORM with parameterized queries
- `@sentry/node` — Error tracking with PII sanitization
- `pino` — Logging with sensitive field redaction
- `crypto` (Node.js built-in) — Constant-time key comparison, SHA-256 hashing

---

## Security Checklist

- [x] JWT authentication with token expiry
- [x] Role-based access control (user, moderator, admin)
- [x] API key authentication for external services
- [x] Per-IP rate limiting with Redis storage
- [x] Per-user rate limiting per endpoint group
- [x] Global input validation (whitelist + transform)
- [x] XSS sanitization on all text inputs
- [x] SQL injection prevention (parameterized queries)
- [x] MongoDB operator injection prevention
- [x] Request body size limits per endpoint
- [x] CSP, HSTS, and other security headers
- [x] CORS with dynamic origin validation
- [x] Audit logging for all sensitive operations
- [x] AI logging retention and cleanup
- [x] Sentry error tracking with PII sanitization
- [x] Graceful shutdown with connection draining
- [x] Unicode normalization (NFC) for homograph prevention
- [x] Email and phone number normalization
- [x] API key rotation support
- [x] Request ID and Correlation ID for tracing
- [x] Consistent error responses (no stack traces in production)
- [x] Database connection pooling with error handling
