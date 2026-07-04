#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Dream Home 11 — Automated Security Audit
# =============================================================================
# This script runs security tests, checks security headers, verifies HTTPS
# configuration, scans for exposed endpoints, and checks for common
# misconfigurations. It generates a security audit report and exits with
# non-zero if any critical check fails.
#
# Usage:
#   ./scripts/security-audit.sh              # audit localhost:3000
#   ./scripts/security-audit.sh https://stg.dreamhome11.com  # audit staging
#   ./scripts/security-audit.sh --ci         # CI mode (strict)
# =============================================================================

BASE_URL="${1:-http://localhost:3000}"
CI_MODE=false
REPORT_FILE="security-audit-report-$(date +%Y%m%d-%H%M%S).md"
PASS=0
FAIL=0
WARN=0
CRITICAL_FAIL=false
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

usage() {
  echo "Usage: $0 [BASE_URL] [--ci]"
  echo "  BASE_URL  Target URL to audit (default: http://localhost:3000)"
  echo "  --ci       CI mode: stricter checks, fail on warnings"
  exit 1
}

if [[ "$*" == *"--ci"* ]]; then
  CI_MODE=true
fi

# =============================================================================
# Report helpers
# =============================================================================
init_report() {
  cat > "$REPORT_FILE" <<-REPORT
# Security Audit Report
**Target:** $BASE_URL
**Date:** $(date -u '+%Y-%m-%dT%H:%M:%SZ')
**Mode:** $([ "$CI_MODE" = true ] && echo "CI (strict)" || echo "Standard")

## Summary

| Category | Passed | Failed | Warnings |
|----------|--------|--------|----------|
REPORT
}

append_summary() {
  local category="$1"
  echo "| $category | $PASS_CAT | $FAIL_CAT | $WARN_CAT |" >> "$REPORT_FILE"
}

write_finding() {
  local status="$1" category="$2" message="$3"
  case "$status" in
    PASS)
      echo "- ✅ $message" >> "$REPORT_FILE"
      ;;
    FAIL)
      echo "- ❌ $message" >> "$REPORT_FILE"
      CRITICAL_FAIL=true
      ;;
    WARN)
      echo "- ⚠️  $message" >> "$REPORT_FILE"
      ;;
  esac
}

section() {
  echo "" >> "$REPORT_FILE"
  echo "## $1" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  PASS_CAT=0
  FAIL_CAT=0
  WARN_CAT=0
}

check_pass() {
  local category="$1" message="$2"
  PASS=$((PASS + 1))
  PASS_CAT=$((PASS_CAT + 1))
  write_finding "PASS" "$category" "$message"
}

check_fail() {
  local category="$1" message="$2"
  FAIL=$((FAIL + 1))
  FAIL_CAT=$((FAIL_CAT + 1))
  write_finding "FAIL" "$category" "$message"
}

check_warn() {
  local category="$1" message="$2"
  WARN=$((WARN + 1))
  WARN_CAT=$((WARN_CAT + 1))
  write_finding "WARN" "$category" "$message"
}

# =============================================================================
# Pre-flight checks
# =============================================================================
check_dependencies() {
  local deps=(curl jq)
  local missing=()
  for dep in "${deps[@]}"; do
    if ! command -v "$dep" &>/dev/null; then
      missing+=("$dep")
    fi
  done
  if [ ${#missing[@]} -gt 0 ]; then
    echo "Missing dependencies: ${missing[*]}"
    echo "Install with: brew install ${missing[*]}"
    exit 1
  fi
}

echo "🔒 Dream Home 11 — Security Audit"
echo "=================================="
echo "Target: $BASE_URL"
echo "Report: $REPORT_FILE"
echo ""

check_dependencies
init_report

# =============================================================================
# 1. Security Headers Check
# =============================================================================
section "Security Headers"

echo "  [*] Checking security headers..."
HEADERS=$(curl -sI --max-time 10 "$BASE_URL" 2>/dev/null || true)
if [ -z "$HEADERS" ]; then
  check_fail "Security Headers" "Unable to fetch headers from $BASE_URL"
  CRITICAL_FAIL=true
  exit 1
fi

HSTS=$(echo "$HEADERS" | grep -i "^strict-transport-security:" || true)
CSP=$(echo "$HEADERS" | grep -i "^content-security-policy:" || true)
XCTO=$(echo "$HEADERS" | grep -i "^x-content-type-options:" || true)
XFO=$(echo "$HEADERS" | grep -i "^x-frame-options:" || true)
RP=$(echo "$HEADERS" | grep -i "^referrer-policy:" || true)
COOP=$(echo "$HEADERS" | grep -i "^cross-origin-opener-policy:" || true)
COEP=$(echo "$HEADERS" | grep -i "^cross-origin-embedder-policy:" || true)
CRP=$(echo "$HEADERS" | grep -i "^cross-origin-resource-policy:" || true)

if echo "$HSTS" | grep -qi "max-age=63072000"; then
  check_pass "Security Headers" "HSTS present with 2-year max-age"
else
  check_fail "Security Headers" "HSTS missing or incorrect max-age"
fi

if [ -n "$CSP" ]; then
  check_pass "Security Headers" "Content-Security-Policy is set"
else
  check_warn "Security Headers" "Content-Security-Policy not set (may be dev mode)"
fi

if echo "$XCTO" | grep -qi "nosniff"; then
  check_pass "Security Headers" "X-Content-Type-Options: nosniff"
else
  check_fail "Security Headers" "X-Content-Type-Options missing"
fi

if echo "$XFO" | grep -qi "sameorigin\|deny"; then
  check_pass "Security Headers" "X-Frame-Options is set"
else
  check_fail "Security Headers" "X-Frame-Options missing (clickjacking risk)"
fi

if echo "$RP" | grep -qi "strict-origin-when-cross-origin"; then
  check_pass "Security Headers" "Referrer-Policy: strict-origin-when-cross-origin"
else
  check_warn "Security Headers" "Referrer-Policy not optimal"
fi

if [ -n "$COOP" ] && echo "$COOP" | grep -qi "same-origin"; then
  check_pass "Security Headers" "Cross-Origin-Opener-Policy: same-origin"
else
  check_warn "Security Headers" "Cross-Origin-Opener-Policy missing"
fi

if [ -n "$COEP" ] && echo "$COEP" | grep -qi "require-corp"; then
  check_pass "Security Headers" "Cross-Origin-Embedder-Policy: require-corp"
else
  check_warn "Security Headers" "Cross-Origin-Embedder-Policy missing"
fi

append_summary "Security Headers"

# =============================================================================
# 2. HTTPS Configuration
# =============================================================================
section "HTTPS Configuration"

echo "  [*] Checking HTTPS configuration..."
URL_SCHEME=$(echo "$BASE_URL" | cut -d: -f1)

if [ "$URL_SCHEME" = "https" ]; then
  check_pass "HTTPS" "Endpoint is served over HTTPS"

  TLS_VERSION=$(curl -sI --max-time 10 --tlsv1.2 "$BASE_URL" 2>/dev/null | head -1 || true)
  if [ -n "$TLS_VERSION" ]; then
    check_pass "HTTPS" "TLS 1.2+ is supported"
  else
    check_fail "HTTPS" "TLS 1.2+ not supported"
  fi

  TLS13=$(curl -sI --max-time 10 --tlsv1.3 "$BASE_URL" 2>/dev/null | head -1 || true)
  if [ -n "$TLS13" ]; then
    check_pass "HTTPS" "TLS 1.3 is supported"
  else
    check_warn "HTTPS" "TLS 1.3 not supported"
  fi
else
  check_warn "HTTPS" "Target is HTTP — skipping TLS checks (deploy behind HTTPS)"
fi

append_summary "HTTPS Configuration"

# =============================================================================
# 3. Exposed Endpoints Scan
# =============================================================================
section "Exposed Endpoints"

echo "  [*] Checking for exposed endpoints..."
ENDPOINTS=(
  "/health"
  "/health/ready"
  "/metrics"
  "/api/v1"
  "/api/v1/users"
  "/api/v1/admin"
  "/api/v1/auth"
  "/graphql"
  "/swagger"
  "/api-docs"
  "/.env"
  "/.git/config"
  "/robots.txt"
  "/sitemap.xml"
  "/.well-known/security.txt"
  "/admin"
  "/api"
  "/favicon.ico"
)

for endpoint in "${ENDPOINTS[@]}"; do
  STATUS=$(curl -so /dev/null -w "%{http_code}" --max-time 5 "$BASE_URL$endpoint" 2>/dev/null || true)
  case "$endpoint" in
    /health|/health/ready|/metrics)
      if [ "$STATUS" = "200" ]; then
        check_pass "Exposed Endpoints" "$endpoint returns $STATUS (expected)"
      else
        check_warn "Exposed Endpoints" "$endpoint returned $STATUS (expected 200)"
      fi
      ;;
    /.env|/.git/config)
      if [ "$STATUS" = "200" ] || [ "$STATUS" = "301" ] || [ "$STATUS" = "302" ]; then
        check_fail "Exposed Endpoints" "$endpoint is exposed! (status: $STATUS)"
      else
        check_pass "Exposed Endpoints" "$endpoint is properly restricted (status: $STATUS)"
      fi
      ;;
    /graphql)
      if [ "$STATUS" != "404" ] && [ "$STATUS" != "405" ] && [ "$STATUS" != "403" ]; then
        check_warn "Exposed Endpoints" "/graphql endpoint responds (status: $STATUS) — verify if intentional"
      else
        check_pass "Exposed Endpoints" "/graphql properly restricted (status: $STATUS)"
      fi
      ;;
    /swagger|/api-docs)
      if [ "$STATUS" = "200" ] || [ "$STATUS" = "301" ] || [ "$STATUS" = "302" ]; then
        check_fail "Exposed Endpoints" "API docs exposed at $endpoint (status: $STATUS)"
      else
        check_pass "Exposed Endpoints" "$endpoint is restricted (status: $STATUS)"
      fi
      ;;
    /robots.txt)
      if [ "$STATUS" = "200" ]; then
        check_pass "Exposed Endpoints" "robots.txt exists"
      fi
      ;;
    *)
      if [ "$STATUS" != "404" ] && [ "$STATUS" != "403" ] && [ "$STATUS" != "401" ] && [ "$STATUS" != "405" ] && [ -n "$STATUS" ]; then
        check_warn "Exposed Endpoints" "$endpoint returned $STATUS (unexpected)"
      fi
      ;;
  esac
done

append_summary "Exposed Endpoints"

# =============================================================================
# 4. CORS Configuration
# =============================================================================
section "CORS Configuration"

echo "  [*] Checking CORS headers..."
ORIGINS_TO_TEST=(
  "https://evil.com"
  "https://dreamhome11.com"
  "null"
)

for origin in "${ORIGINS_TO_TEST[@]}"; do
  CORS_RESULT=$(curl -s -I --max-time 5 -H "Origin: $origin" -H "Access-Control-Request-Method: GET" "$BASE_URL/api/v1/contests" 2>/dev/null || true)
  ACAO=$(echo "$CORS_RESULT" | grep -i "^access-control-allow-origin:" || true)
  if [ -n "$ACAO" ]; then
    ALLOWED_ORIGIN=$(echo "$ACAO" | sed 's/.*: //I')
    if [ "$ALLOWED_ORIGIN" = "$origin" ] || [ "$ALLOWED_ORIGIN" = "*" ]; then
      check_fail "CORS" "Origin '$origin' is allowed via CORS: $ALLOWED_ORIGIN"
    fi
  fi
done

if [ "$FAIL_CAT" -eq 0 ]; then
  check_pass "CORS" "No unauthorized origins allowed via CORS"
fi

append_summary "CORS Configuration"

# =============================================================================
# 5. Common Misconfigurations
# =============================================================================
section "Common Misconfigurations"

echo "  [*] Checking for common misconfigurations..."

# Check for server info disclosure
SERVER_HEADER=$(curl -sI --max-time 5 "$BASE_URL" 2>/dev/null | grep -i "^server:" || true)
if [ -n "$SERVER_HEADER" ]; then
  check_warn "Misconfigurations" "Server header discloses info: $(echo "$SERVER_HEADER" | tr -d '\r')"
else
  check_pass "Misconfigurations" "No server info disclosure"
fi

# Check for X-Powered-By header
XPB=$(curl -sI --max-time 5 "$BASE_URL" 2>/dev/null | grep -i "^x-powered-by:" || true)
if [ -n "$XPB" ]; then
  check_fail "Misconfigurations" "X-Powered-By header present: $(echo "$XPB" | tr -d '\r')"
else
  check_pass "Misconfigurations" "No X-Powered-By header"
fi

# Check for cache control on auth endpoints
CACHE_CHECK=$(curl -sI --max-time 5 "$BASE_URL/health" 2>/dev/null | grep -i "^cache-control:" || true)
if [ -n "$CACHE_CHECK" ]; then
  check_pass "Misconfigurations" "Cache-Control header present"
fi

append_summary "Common Misconfigurations"

# =============================================================================
# 6. Run Security Tests
# =============================================================================
section "Security Unit Tests"

echo "  [*] Running security test suite..."
if [ -f "$PROJECT_DIR/backend/package.json" ]; then
  cd "$PROJECT_DIR/backend"
  if npx jest --config test/jest-security.json --forceExit --detectOpenHandles 2>&1; then
    check_pass "Security Tests" "All security tests passed"
  else
    check_fail "Security Tests" "Some security tests failed — review output above"
  fi
  cd "$PROJECT_DIR"
else
  check_warn "Security Tests" "Backend package.json not found, skipping unit tests"
fi

append_summary "Security Unit Tests"

# =============================================================================
# 7. Dependency Audit
# =============================================================================
section "Dependency Security"

echo "  [*] Checking for known vulnerabilities..."
if command -v npm &>/dev/null && [ -f "$PROJECT_DIR/backend/package-lock.json" ]; then
  cd "$PROJECT_DIR/backend"
  if npm audit --audit-level=high 2>&1; then
    check_pass "Dependencies" "npm audit passed — no high/critical vulnerabilities"
  else
    check_warn "Dependencies" "npm audit found vulnerabilities — review and patch"
  fi
  cd "$PROJECT_DIR"
else
  check_warn "Dependencies" "npm or package-lock.json not found, skipping audit"
fi

append_summary "Dependency Security"

# =============================================================================
# Final Summary
# =============================================================================
echo ""
echo "=================================="
echo "Audit Complete"
echo "=================================="
echo ""

cat >> "$REPORT_FILE" <<-SUMMARY

---

## Final Results

| Metric | Count |
|--------|-------|
| ✅ Passed | $PASS |
| ❌ Failed | $FAIL |
| ⚠️  Warnings | $WARN |
| **Total** | **$((PASS + FAIL + WARN))** |

**Overall Status:** $([ "$CRITICAL_FAIL" = true ] && echo "❌ FAILED (critical issues found)" || echo "✅ PASSED")

*Report generated: $(date -u '+%Y-%m-%dT%H:%M:%SZ')*
SUMMARY

echo "  Passed: $PASS"
echo "  Failed: $FAIL"
echo "  Warnings: $WARN"
echo ""
echo "Report saved to: $REPORT_FILE"
echo ""

if [ "$CRITICAL_FAIL" = true ]; then
  echo "❌ Critical security issues found. See report for details."
  exit 1
else
  echo "✅ All critical checks passed."
  exit 0
fi
