#!/bin/bash
set -eo pipefail

# Dream Home 11 — Release Artifact Verification Script
# Usage: ./scripts/verify-release.sh [version]

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

log_info()  { echo -e "${BLUE}[INFO]${NC}  $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC}    $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPORT_DIR="$PROJECT_ROOT/build/verify"
REPORT_FILE="$REPORT_DIR/verification-report-$(date +%Y%m%d_%H%M%S).md"
PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

VERSION="${1:-1.0.0}"

TITLE_CHECK() {
  echo -e "\n${BOLD}$1${NC}"
  echo "---"
}

PASS() {
  echo -e "  ${GREEN}✓${NC} $1"
  PASS_COUNT=$((PASS_COUNT + 1))
}

FAIL() {
  echo -e "  ${RED}✗${NC} $1"
  FAIL_COUNT=$((FAIL_COUNT + 1))
}

WARN() {
  echo -e "  ${YELLOW}⚠${NC} $1"
  WARN_COUNT=$((WARN_COUNT + 1))
}

mkdir -p "$REPORT_DIR"

exec > >(tee -a "$REPORT_FILE") 2>&1

echo -e "${CYAN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   ${BOLD}Dream Home 11 — Release Artifact Verification${NC}${CYAN} ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo "Version:  $VERSION"
echo "Date:     $(date '+%Y-%m-%d %H:%M:%S')"
echo "Report:   $REPORT_FILE"
echo ""

TITLE_CHECK "1. Artifact Existence"

APK_PATH="$PROJECT_ROOT/build/app/outputs/flutter-apk/app-release.apk"
AAB_PATH="$PROJECT_ROOT/build/app/outputs/bundle/release/app-release.aab"

if [[ -f "$APK_PATH" ]]; then
  APK_SIZE=$(stat -f%z "$APK_PATH" 2>/dev/null || stat -c%s "$APK_PATH" 2>/dev/null)
  APK_SIZE_MB=$(echo "scale=2; $APK_SIZE / 1048576" | bc)
  PASS "APK found: $APK_PATH (${APK_SIZE_MB}MB)"
else
  FAIL "APK not found at $APK_PATH"
fi

if [[ -f "$AAB_PATH" ]]; then
  AAB_SIZE=$(stat -f%z "$AAB_PATH" 2>/dev/null || stat -c%s "$AAB_PATH" 2>/dev/null)
  AAB_SIZE_MB=$(echo "scale=2; $AAB_SIZE / 1048576" | bc)
  PASS "AAB found: $AAB_PATH (${AAB_SIZE_MB}MB)"
else
  FAIL "AAB not found at $AAB_PATH"
fi

echo ""
TITLE_CHECK "2. APK/AAB Signature Verification"

if command -v jarsigner &> /dev/null; then
  if [[ -f "$APK_PATH" ]]; then
    if jarsigner -verify -certs "$APK_PATH" 2>&1 | grep -q "jar verified"; then
      PASS "APK signature verified (jarsigner)"
    else
      FAIL "APK signature verification failed"
      jarsigner -verify -certs "$APK_PATH" 2>&1 | tail -3
    fi
  fi
  if [[ -f "$AAB_PATH" ]]; then
    if jarsigner -verify -certs "$AAB_PATH" 2>&1 | grep -q "jar verified"; then
      PASS "AAB signature verified (jarsigner)"
    else
      FAIL "AAB signature verification failed"
      jarsigner -verify -certs "$AAB_PATH" 2>&1 | tail -3
    fi
  fi
else
  WARN "jarsigner not found — skipping signature verification"
fi

echo ""
TITLE_CHECK "3. Version String Consistency"

MISMATCH=0

PUBSPEC_VER=$(grep '^version:' "$PROJECT_ROOT/pubspec.yaml" | awk '{print $2}' | cut -d'+' -f1)
if [[ "$PUBSPEC_VER" == "$VERSION" ]]; then
  PASS "pubspec.yaml version matches: $PUBSPEC_VER"
else
  FAIL "pubspec.yaml version mismatch: expected $VERSION, found $PUBSPEC_VER"
  MISMATCH=1
fi

BACKEND_VER=$(grep '"version"' "$PROJECT_ROOT/backend/package.json" | awk -F'"' '{print $4}')
if [[ "$BACKEND_VER" == "$VERSION" ]]; then
  PASS "backend/package.json version matches: $BACKEND_VER"
else
  FAIL "backend/package.json version mismatch: expected $VERSION, found $BACKEND_VER"
  MISMATCH=1
fi

if git tag -l "v$VERSION" | grep -q "v$VERSION"; then
  PASS "Git tag v$VERSION exists"
else
  WARN "Git tag v$VERSION not found (may not be pushed yet)"
fi

echo ""
TITLE_CHECK "4. SHA-256 Checksums"

if [[ -f "$APK_PATH" ]]; then
  APK_SHA=$(shasum -a 256 "$APK_PATH" | cut -d' ' -f1)
  PASS "APK SHA-256: $APK_SHA"
fi

if [[ -f "$AAB_PATH" ]]; then
  AAB_SHA=$(shasum -a 256 "$AAB_PATH" | cut -d' ' -f1)
  PASS "AAB SHA-256: $AAB_SHA"
fi

CHECKSUM_FILE="$REPORT_DIR/sha256sums-$VERSION.txt"
{
  if [[ -f "$APK_PATH" ]]; then
    shasum -a 256 "$APK_PATH"
  fi
  if [[ -f "$AAB_PATH" ]]; then
    shasum -a 256 "$AAB_PATH"
  fi
} > "$CHECKSUM_FILE"

PASS "Checksums saved to $CHECKSUM_FILE"

echo ""
TITLE_CHECK "5. Sentry Source Maps"

DEBUG_INFO_DIR="$PROJECT_ROOT/build/debug-info/android"
if [[ -d "$DEBUG_INFO_DIR" ]]; then
  MAP_COUNT=$(find "$DEBUG_INFO_DIR" -name "*.symbols" 2>/dev/null | wc -l | tr -d ' ')
  if [[ "$MAP_COUNT" -gt 0 ]]; then
    PASS "Sentry debug symbols found: $MAP_COUNT files"
  else
    WARN "No .symbols files found in $DEBUG_INFO_DIR"
  fi
  TOTAL_SIZE=$(du -sh "$DEBUG_INFO_DIR" | cut -f1)
  PASS "Debug info total size: $TOTAL_SIZE"
else
  WARN "Debug info directory not found at $DEBUG_INFO_DIR"
fi

echo ""
TITLE_CHECK "6. Docker Image Verification"

if command -v docker &> /dev/null; then
  if docker image inspect "dreamhome11/backend:$VERSION" &>/dev/null; then
    IMG_SIZE=$(docker image inspect "dreamhome11/backend:$VERSION" --format='{{if .Size}}{{.Size}}{{end}}' 2>/dev/null)
    if [[ -n "$IMG_SIZE" ]]; then
      IMG_SIZE_MB=$(echo "scale=1; $IMG_SIZE / 1048576" | bc)
      PASS "Docker image dreamhome11/backend:$VERSION exists (${IMG_SIZE_MB}MB)"
    else
      PASS "Docker image dreamhome11/backend:$VERSION exists"
    fi
  else
    WARN "Docker image dreamhome11/backend:$VERSION not found locally"
  fi
else
  WARN "Docker not available — skipping image check"
fi

echo ""
TITLE_CHECK "7. Artifact Size Report"

echo ""
printf "  %-40s %15s\n" "Artifact" "Size"
printf "  %-40s %15s\n" "----------------------------------------" "---------------"
if [[ -f "$APK_PATH" ]]; then
  printf "  %-40s %15s\n" "APK (app-release.apk)" "${APK_SIZE_MB}MB"
fi
if [[ -f "$AAB_PATH" ]]; then
  printf "  %-40s %15s\n" "AAB (app-release.aab)" "${AAB_SIZE_MB}MB"
fi
if docker image inspect "dreamhome11/backend:$VERSION" &>/dev/null; then
  printf "  %-40s %15s\n" "Docker (dreamhome11/backend:$VERSION)" "${IMG_SIZE_MB}MB"
fi
echo ""

echo ""
TITLE_CHECK "8. Summary"

echo ""
echo -e "  ${BOLD}Results:${NC}"
echo -e "  ${GREEN}  Passed: $PASS_COUNT${NC}"
echo -e "  ${RED}  Failed: $FAIL_COUNT${NC}"
echo -e "  ${YELLOW}  Warnings: $WARN_COUNT${NC}"
echo ""

if [[ $FAIL_COUNT -eq 0 ]]; then
  echo -e "  ${GREEN}${BOLD}✓ All checks passed — release v$VERSION is ready!${NC}"
else
  echo -e "  ${RED}${BOLD}✗ $FAIL_COUNT check(s) failed — review issues before submitting.${NC}"
fi

echo ""
echo -e "${CYAN}══════════════════════════════════════════════════${NC}"
echo "Report saved to: $REPORT_FILE"

exit $FAIL_COUNT
