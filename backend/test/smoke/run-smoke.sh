#!/usr/bin/env bash
set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

usage() {
  echo "Usage: $0 [--base-url URL]"
  echo ""
  echo "Options:"
  echo "  --base-url URL  Target base URL (default: http://localhost:3000)"
  echo "  --help          Show this help message"
  echo ""
  echo "Examples:"
  echo "  $0"
  echo "  $0 --base-url https://staging.dreamhome11.com"
  echo "  $0 --base-url https://production.dreamhome11.com"
  exit 1
}

BASE_URL="http://localhost:3000"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --base-url)
      BASE_URL="$2"
      shift 2
      ;;
    --help)
      usage
      ;;
    *)
      echo "Unknown option: $1"
      usage
      ;;
  esac
done

export NODE_ENV=test
export BASE_URL

echo "=========================================="
echo " Dream Home 11 — Production Smoke Tests"
echo " Base URL: $BASE_URL"
echo "=========================================="

cd "$PROJECT_DIR"

if npx jest --config ./test/jest-e2e.json \
  --testPathPattern="smoke" \
  --verbose \
  --forceExit \
  --detectOpenHandles 2>&1; then
  echo ""
  echo "=========================================="
  echo " All smoke tests passed!"
  echo "=========================================="
  exit 0
else
  echo ""
  echo "=========================================="
  echo " Some smoke tests FAILED!"
  echo "=========================================="
  exit 1
fi
