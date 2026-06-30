#!/usr/bin/env bash
set -euo pipefail

BASE_URL="http://localhost:3000"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target)
      BASE_URL="$2"
      shift 2
      ;;
    *)
      echo "Usage: $0 [--target <url>]"
      exit 1
      ;;
  esac
done

if ! command -v k6 &>/dev/null; then
  echo "Error: k6 is not installed. Please install k6 first."
  echo "  macOS: brew install k6"
  echo "  Linux: https://k6.io/docs/getting-started/installation/"
  exit 1
fi

DIR="$(cd "$(dirname "$0")" && pwd)"
export BASE_URL

echo "=========================================="
echo " Dream Home 11 — Load Test Suite"
echo " Target: $BASE_URL"
echo "=========================================="

run_test() {
  local name="$1"
  local script="$2"
  echo ""
  echo "--- Running: $name ($script) ---"
  k6 run "$DIR/$script"
  echo "--- Completed: $name ---"
}

run_test "Smoke Test"       "smoke.js"
run_test "Leaderboard"      "leaderboard.js"
run_test "Contests"         "contests.js"
run_test "Wallet"           "wallet.js"
run_test "Compensation"     "compensation.js"

echo ""
echo "=========================================="
echo " All load tests completed successfully!"
echo "=========================================="
