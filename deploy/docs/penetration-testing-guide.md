# Dream Home 11 — Penetration Testing Guide

> Version: 1.0.0
> Last Updated: 2026-07-03

## Table of Contents

1. [Pre-Engagement Checklist](#1-pre-engagement-checklist)
2. [OWASP Top 10 Testing Procedures](#2-owasp-top-10-testing-procedures)
3. [Authentication Testing](#3-authentication-testing)
4. [Authorization Testing](#4-authorization-testing)
5. [Input Validation Testing](#5-input-validation-testing)
6. [API-Specific Testing](#6-api-specific-testing)
7. [Test Case Templates](#7-test-case-templates)
8. [Reporting Template](#8-reporting-template)

---

## 1. Pre-Engagement Checklist

### 1.1 Scope Definition

| Item | Details |
|------|---------|
| Target Application | Dream Home 11 — Fantasy Sports Platform |
| Target Environments | Staging (`https://stg.dreamhome11.com`), Production (`https://api.dreamhome11.com`) |
| API Base Path | `/api/v1/` |
| In Scope | All endpoints under `api.dreamhome11.com`, CDN (`cdn.dreamhome11.com`), WebSocket (`wss://api.dreamhome11.com`) |
| Out of Scope | Third-party services (Firebase, Razorpay, Sentry), physical infrastructure, social engineering |
| Testing Methodology | OWASP Web Security Testing Guide v4.2 |
| Severity Scale | Critical / High / Medium / Low / Informational |

### 1.2 Pre-Requisites

- [ ] Signed NDA and penetration testing agreement
- [ ] Obtained test accounts (user, moderator, admin roles)
- [ ] Obtained API keys for webhook testing
- [ ] Confirmed testing window with DevOps team
- [ ] Set up monitoring alert bypass (or notified on-call)
- [ ] Reviewed application architecture and data flow
- [ ] Confirmed WAF/DDoS protections are in detection-only mode
- [ ] Established rollback / emergency stop procedure
- [ ] Prepared test data (avoid PII, use synthetic identities)

### 1.3 Tools Required

| Tool | Purpose |
|------|---------|
| Burp Suite Professional | Intercepting proxy, automated scanning |
| OWASP ZAP | Open-source web app scanner |
| Postman / Insomnia | API testing and scripting |
| sqlmap | SQL injection detection |
| jwt_tool | JWT security testing |
| Nuclei | Template-based vulnerability scanner |
| curl / httpie | Manual endpoint testing |
| nmap | Network-level reconnaissance |
| Wireshark | Network traffic analysis |

### 1.4 Testing Accounts

| Role | Credential | Notes |
|------|------------|-------|
| Regular User | `user+test@dreamhome11.com` / pre-generated JWT | Limited to own resources |
| Moderator | `mod+test@dreamhome11.com` / pre-generated JWT | Can moderate contests |
| Admin | `admin+test@dreamhome11.com` / pre-generated JWT | Full system access |
| API Client | API key from `API_KEYS` env | Service-to-service auth |

---

## 2. OWASP Top 10 Testing Procedures

### 2.1 A01: Broken Access Control

#### Test Cases

| ID | Test | Expected Result | Severity |
|----|------|----------------|----------|
| BAC-01 | Access admin endpoint with user JWT | 403 Forbidden | High |
| BAC-02 | Access admin endpoint without JWT | 401 Unauthorized | High |
| BAC-03 | Access another user's resource via IDOR (change `userId` in path/body) | 403 or 404 | Critical |
| BAC-04 | Privilege escalation by modifying role in JWT | Token rejected or role ignored | High |
| BAC-05 | Force Browsing — guess endpoint patterns (e.g., `/api/v1/admin/`) | 401/403 | Medium |
| BAC-06 | HTTP method override via `X-HTTP-Method-Override` header | Rejected or ignored | Medium |

#### Procedure

```bash
# Test IDOR — fetch another user's profile
curl -H "Authorization: Bearer $USER_JWT" \
  "$BASE_URL/api/v1/users/another-user-id/profile"

# Test admin access with user role
curl -H "Authorization: Bearer $USER_JWT" \
  "$BASE_URL/api/v1/admin/users"

# Test forced browsing
curl -H "Authorization: Bearer $USER_JWT" \
  "$BASE_URL/api/v1/admin/compensations"
```

### 2.2 A02: Cryptographic Failures

#### Test Cases

| ID | Test | Expected Result | Severity |
|----|------|----------------|----------|
| CRY-01 | Inspect JWT algorithm — is it set to `none`? | Rejected | Critical |
| CRY-02 | Decode JWT payload — is sensitive data exposed? | No PII in payload | High |
| CRY-03 | Check JWT expiry — can old tokens be reused? | Expired → 401 | High |
| CRY-04 | Inspect TLS certificate — is it valid and up-to-date? | Valid, SHA-256 | Medium |
| CRY-05 | Check password/PIN storage — are they hashed? | N/A (phone auth) | Info |

#### Procedure

```bash
# Decode JWT payload
echo "$JWT" | cut -d. -f2 | base64 -d 2>/dev/null | jq . || true

# Test JWT with alg:none
jwt_tool "$USER_JWT" -X a

# Check TLS certificate
echo | openssl s_client -connect api.dreamhome11.com:443 2>/dev/null | openssl x509 -text | grep -E "Subject:|Issuer:|Not Before|Not After|Signature Algorithm"
```

### 2.3 A03: Injection

#### Test Cases

| ID | Test | Expected Result | Severity |
|----|------|----------------|----------|
| INJ-01 | SQL injection in query params (`?id=1' OR '1'='1`) | 400 or safe result | Critical |
| INJ-02 | SQL injection in POST body (`{"name": "'; DROP TABLE users; --"}`) | 400 or safe result | Critical |
| INJ-03 | NoSQL operator injection (`{"$ne": ""}`) | 400 Bad Request | Critical |
| INJ-04 | XSS in POST body (`<script>alert(1)</script>`) | Stripped / escaped | High |
| INJ-05 | XSS in query params | Stripped / escaped | High |
| INJ-06 | Template injection (`{{7*7}}`) | Not evaluated | Medium |
| INJ-07 | LDAP injection attempts | Rejected | Low |
| INJ-08 | XML/XXE injection | Rejected | Medium |

#### Procedure

```bash
# SQL injection attempt
curl -X POST -H "Authorization: Bearer $USER_JWT" \
  -H "Content-Type: application/json" \
  -d '{"name": "test\"; DROP TABLE users; --"}' \
  "$BASE_URL/api/v1/contests"

# NoSQL injection attempt
curl -X POST -H "Content-Type: application/json" \
  -d '{"username": {"$ne": ""}, "password": {"$ne": ""}}' \
  "$BASE_URL/api/v1/auth/verify-otp"

# XSS attempt
curl -X POST -H "Authorization: Bearer $USER_JWT" \
  -H "Content-Type: application/json" \
  -d '{"name": "<script>document.cookie</script>"}' \
  "$BASE_URL/api/v1/users/profile"
```

### 2.4 A04: Insecure Design

#### Test Cases

| ID | Test | Expected Result | Severity |
|----|------|----------------|----------|
| DES-01 | Rate limit bypass via IP rotation (X-Forwarded-For) | Blocked after limit | High |
| DES-02 | Concurrent request flooding to race conditions | Atomic operations | High |
| DES-03 | Mass assignment on user profile update | Whitelist enforced | High |
| DES-04 | Negative numbers in financial operations | Rejected | High |

### 2.5 A05: Security Misconfiguration

#### Test Cases

| ID | Test | Expected Result | Severity |
|----|------|----------------|----------|
| MIS-01 | Check for default credentials | Not present | Critical |
| MIS-02 | Check for stack traces in error responses | No stack traces | High |
| MIS-03 | Check CORS — is `Access-Control-Allow-Origin: *` set? | Specific origins only | High |
| MIS-04 | Check for debug endpoints enabled in production | Disabled | High |
| MIS-05 | Check directory listing enabled | Disabled | Medium |

### 2.6 A06: Vulnerable and Outdated Components

#### Test Cases

| ID | Test | Expected Result | Severity |
|----|------|----------------|----------|
| DEP-01 | Run `npm audit` — any critical vulnerabilities? | None | High |
| DEP-02 | Check Node.js version against EOL list | Active LTS | High |
| DEP-03 | Check for unused dependencies | Minimal | Low |

### 2.7 A07: Identification and Authentication Failures

#### Test Cases

| ID | Test | Expected Result | Severity |
|----|------|----------------|----------|
| ATH-01 | JWT token replay across sessions | Rejected | High |
| ATH-02 | Brute force OTP verification | Rate limited | Critical |
| ATH-03 | Session fixation via token injection | Not possible | High |
| ATH-04 | Token theft via man-in-the-middle | TLS prevents | High |

### 2.8 A08: Software and Data Integrity Failures

#### Test Cases

| ID | Test | Expected Result | Severity |
|----|------|----------------|----------|
| INT-01 | Dependency chain attacks (`npm audit`) | Clean | High |
| INT-02 | CI/CD pipeline integrity checks | Required | High |
| INT-03 | Webhook payload signature verification | Verified | Critical |

### 2.9 A09: Security Logging and Monitoring Failures

#### Test Cases

| ID | Test | Expected Result | Severity |
|----|------|----------------|----------|
| LOG-01 | Trigger login failure — is it logged? | Audit entry created | Medium |
| LOG-02 | Trigger admin action — is it logged? | Audit entry created | Medium |
| LOG-03 | Check audit log for sensitive data | PII masked | High |
| LOG-04 | Trigger 429 — is rate limit violation logged? | Logged for auth users | Medium |

### 2.10 A10: Server-Side Request Forgery (SSRF)

#### Test Cases

| ID | Test | Expected Result | Severity |
|----|------|----------------|----------|
| SSRF-01 | Provide internal IP in a URL field | Rejected | High |
| SSRF-02 | Provide `169.254.169.254` (metadata endpoint) | Rejected | Critical |
| SSRF-03 | Provide `file:///etc/passwd` | Rejected | High |

---

## 3. Authentication Testing

### 3.1 JWT Token Security

| Test | Method | Expected |
|------|--------|----------|
| Token with `alg: none` | Modify JWT header | 401 |
| Token signed with weak secret (e.g., `secret`) | Brute-force signing key | 401 |
| Token with extended expiry | Modify `exp` claim | 401 |
| Token with missing `sub` | Remove sub claim | 401 |
| Token with wrong issuer | Modify `iss` claim | 401 |
| Refresh token replay | Reuse old refresh token | N/A (no refresh) |

```bash
# Test alg:none
HEADER=$(echo -n '{"alg":"none","typ":"JWT"}' | base64 | tr -d '=' | tr '/+' '_-')
PAYLOAD=$(echo -n '{"sub":"user-1","phoneNumber":"+919999999999"}' | base64 | tr -d '=')
TOKEN="$HEADER.$PAYLOAD."
curl -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/v1/users/dashboard"
```

### 3.2 API Key Security

| Test | Method | Expected |
|------|--------|----------|
| Missing API key header | Call webhook without key | 401 |
| Invalid API key | Call with wrong key | 401 |
| Revoked API key | Call with previously valid key | 401 |
| API key in URL (instead of header) | Pass key as query param | 401 |
| API key brute force | Sequential key guessing | Rate limited |

### 3.3 Session Management

| Test | Method | Expected |
|------|--------|----------|
| Concurrent sessions | Login from two devices | Both valid |
| Session after account deactivation | Deactivate, then use token | 401 |
| Token expiration enforcement | Use token after expiry | 401 |

---

## 4. Authorization Testing

### 4.1 Vertical Privilege Escalation

```bash
# Test each role against admin endpoints
for ROLE_JWT in "$USER_JWT" "$MOD_JWT" "$ADMIN_JWT"; do
  curl -H "Authorization: Bearer $ROLE_JWT" "$BASE_URL/api/v1/admin/compensations"
done
```

### 4.2 Horizontal Privilege Escalation (IDOR)

```bash
# Iterate user IDs to find accessible resources
for USER_ID in user-001 user-002 user-003; do
  curl -H "Authorization: Bearer $USER_JWT" \
    "$BASE_URL/api/v1/users/$USER_ID/wallet"
done
```

### 4.3 Mass Assignment

Test that only whitelisted fields can be modified:

```bash
curl -X PATCH -H "Authorization: Bearer $USER_JWT" \
  -H "Content-Type: application/json" \
  -d '{"role": "admin", "walletBalanceInr": 999999}' \
  "$BASE_URL/api/v1/users/profile"
```

Expected: `role` change rejected, `walletBalanceInr` rejected, only allowed fields updated.

---

## 5. Input Validation Testing

### 5.1 Request Size Limits

| Endpoint Group | Max Size | Test Payload Size | Expected |
|----------------|----------|-------------------|----------|
| Auth | 10 KB | 11 KB | 413 |
| API (general) | 1 MB | 1.1 MB | 413 |
| KYC uploads | 10 MB | 11 MB | 413 |
| Feed | 5 MB | 6 MB | 413 |

### 5.2 Content-Type Validation

| Test | Method | Expected |
|------|--------|----------|
| Missing Content-Type | POST without header | 400/415 |
| Wrong Content-Type | POST with `text/xml` | 400/415 |
| Duplicate Content-Type | Multiple Content-Type headers | 400 |
| Charset injection | `Content-Type: application/json; charset=utf-7` | 400 or handled |

### 5.3 Unicode / Encoding Attacks

| Test | Payload | Expected |
|------|---------|----------|
| UTF-7 XSS | `+ADw-script+AD4-` | Sanitized |
| UTF-16 overflow | Very long UTF-16 string | Truncated |
| Homoglyph username | Cyrillic 'а' in 'admin' | Normalized |
| Right-to-left override | `name=\u202E` | Sanitized |
| Zero-width characters | Zero-width space in token | Stripped |

---

## 6. API-Specific Testing

### 6.1 Rate Limit Testing

```bash
# Trigger IP-based rate limit
for i in $(seq 1 40); do
  curl -s -o /dev/null -w "%{http_code} " "$BASE_URL/api/v1/contests"
done

# Test rate limit headers are present
curl -sI "$BASE_URL/api/v1/contests" | grep -i "^x-ratelimit"
```

**Expected:** After 30 requests, subsequent requests return 429 with `Retry-After` header.

### 6.2 GraphQL Testing (if applicable)

| Test | Expected |
|------|----------|
| Introspection query | Blocked |
| Depth limit (nested queries) | Rejected beyond limit |
| Batching attack | Rate limited |
| Field suggestion | Disabled in production |

### 6.3 WebSocket Security

| Test | Expected |
|------|----------|
| Unauthenticated connection | 401 |
| Message injection | Validation |
| Reconnection with expired token | 401 |

### 6.4 Cache Poisoning

```bash
# Check that authenticated responses are not cached
curl -sI -H "Authorization: Bearer $USER_JWT" \
  "$BASE_URL/api/v1/users/dashboard" | grep -i "^cache-control"
```

**Expected:** `Cache-Control: no-store` or `private`.

### 6.5 API Versioning & Deprecation

| Test | Expected |
|------|----------|
| Call deprecated endpoint | Warning header or 410 |
| Call unknown version (`/api/v99/`) | 404 |
| Call without version (`/api/contests`) | Redirect or 404 |

---

## 7. Test Case Templates

### 7.1 Test Case Template

```markdown
## TC-{ID}: {Test Title}

**Category:** {Auth / Injection / Crypto / Config / Logic}
**Severity:** {Critical / High / Medium / Low}
**Requires Auth:** {Yes / No}
**Role Required:** {None / User / Moderator / Admin}

### Description
{What the test verifies}

### Preconditions
1. {Step 1}
2. {Step 2}

### Test Steps
1. {Step 1}
2. {Step 2}
3. {Step 3}

### Expected Result
{What should happen}

### Actual Result
{What happened}

### Evidence
- Request: `{curl command or request details}`
- Response: `{HTTP status + body snippet}`
- Screenshot: {link}

### Status
{Pass / Fail / Not Applicable}

### Notes
{Additional context}
```

### 7.2 Sample: Rate Limit Bypass Test

```markdown
## TC-RL-001: IP-Based Rate Limit Bypass via X-Forwarded-For

**Category:** Rate Limiting
**Severity:** High
**Requires Auth:** No
**Role Required:** None

### Description
Verify that rate limiting cannot be bypassed by injecting arbitrary IPs via the X-Forwarded-For header.

### Preconditions
1. Target environment is accessible
2. Rate limit is set to 30 req/min per IP

### Test Steps
1. Send 31 requests with a spoofed X-Forwarded-For header
2. Observe if 429 is returned

### Expected Result
After 30 requests, 429 Too Many Requests is returned regardless of X-Forwarded-For value.

### Status
{Pass / Fail}
```

### 7.3 Sample: IDOR Test

```markdown
## TC-IDOR-001: Horizontal Privilege Escalation via User ID

**Category:** Broken Access Control
**Severity:** Critical
**Requires Auth:** Yes
**Role Required:** User

### Description
Verify that a user cannot access another user's wallet information by modifying the user ID parameter.

### Preconditions
1. Two user accounts (User A and User B)
2. Valid JWT for User A

### Test Steps
1. Get User A's JWT
2. Fetch User B's wallet endpoint using User A's JWT
3. Observe response status code

### Expected Result
403 Forbidden or 404 Not Found — User A should not be able to access User B's wallet.

### Status
{Pass / Fail}
```

---

## 8. Reporting Template

### 8.1 Executive Summary

```markdown
# Penetration Test Report: Dream Home 11

**Date:** {Date Range}
**Tester:** {Name / Team}
**Target:** {URLs}

## Executive Summary

{2-3 paragraph summary of findings, overall security posture, and risk level}

## Key Findings

| ID | Vulnerability | Severity | Status |
|----|--------------|----------|--------|
| {ID} | {Title} | {Critical/High/Medium/Low} | {Open/Fixed/NA} |
| {ID} | {Title} | {Critical/High/Medium/Low} | {Open/Fixed/NA} |

## Risk Statistics

| Severity | Count |
|----------|-------|
| Critical | {N} |
| High | {N} |
| Medium | {N} |
| Low | {N} |
| Informational | {N} |
| **Total** | **{N}** |

---

## Detailed Findings

{Detailed findings using the TC template from section 7.1}
```

### 8.2 Finding Severity Definitions

| Severity | Definition | Response Time |
|----------|------------|---------------|
| **Critical** | Direct compromise of system, data breach, or RCE | Within 24 hours |
| **High** | Significant security control bypass, auth bypass | Within 72 hours |
| **Medium** | Limited impact, requires chaining with other bugs | Within 2 weeks |
| **Low** | Minor info disclosure, best practice violations | Within 1 month |
| **Informational** | Observations, recommendations | Next sprint |

### 8.3 Remediation Tracking

| ID | Finding | Severity | Reported | Target Fix | Fixed | Verified | Notes |
|----|---------|----------|----------|------------|-------|----------|-------|
| | | | | | | | |

---

## Appendices

### A. Tools Used
- Burp Suite Professional v2025.x
- OWASP ZAP v2.15
- jwt_tool v2.2
- Nuclei v3.x
- Custom automation scripts

### B. Test Environment Details
- Application version: {git commit hash}
- Testing date: {date}
- Environment: {Staging / Production}

### C. References
- OWASP Web Security Testing Guide: https://owasp.org/www-project-web-security-testing-guide/
- OWASP API Security Top 10: https://owasp.org/www-project-api-security/
- CWE Top 25: https://cwe.mitre.org/top25/
- NIST SP 800-115: Technical Guide to Information Security Testing
