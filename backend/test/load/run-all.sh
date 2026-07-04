#!/usr/bin/env bash
set -eo pipefail

TARGET_URL="http://localhost:3000"
STAGES=""
REPORT_DIR=""
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

usage() {
  echo "Usage: $0 [--target URL] [--stages CONFIG] [--report-dir PATH]"
  echo ""
  echo "Options:"
  echo "  --target URL       Target base URL (default: http://localhost:3000)"
  echo "  --stages CONFIG    k6 stages configuration JSON (optional)"
  echo "  --report-dir PATH  Output directory for reports (default: SCRIPT_DIR/reports)"
  echo "  --help             Show this help message"
  echo ""
  echo "Examples:"
  echo "  $0 --target https://staging.dreamhome11.com"
  echo "  $0 --target http://localhost:3000 --stages '[...]'"
  echo "  $0 --target https://production.com --report-dir ./reports/prod-$(date +%Y%m%d)"
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target)
      TARGET_URL="$2"
      shift 2
      ;;
    --stages)
      STAGES="$2"
      shift 2
      ;;
    --report-dir)
      REPORT_DIR="$2"
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

if ! command -v k6 &>/dev/null; then
  echo "Error: k6 is not installed."
  echo ""
  echo "Installation instructions:"
  echo "  macOS: brew install k6"
  echo "  Ubuntu/Debian:"
  echo "    sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69"
  echo "    echo 'deb https://dl.k6.io/deb stable main' | sudo tee /etc/apt/sources.list.d/k6.list"
  echo "    sudo apt-get update && sudo apt-get install k6"
  echo "  Windows (WSL): Follow Linux instructions"
  echo "  Docker: docker pull grafana/k6"
  echo ""
  echo "See: https://k6.io/docs/getting-started/installation/"
  exit 1
fi

if [ -z "$REPORT_DIR" ]; then
  REPORT_DIR="$SCRIPT_DIR/reports"
fi

mkdir -p "$REPORT_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
SUMMARY_FILE="$REPORT_DIR/summary_$TIMESTAMP.txt"

export TARGET_URL
export K6_PROMETHEUS_OUTPUT="${K6_PROMETHEUS_OUTPUT:-}"

echo "==========================================" | tee -a "$SUMMARY_FILE"
echo " Dream Home 11 — k6 Load Test Suite" | tee -a "$SUMMARY_FILE"
echo " Target: $TARGET_URL" | tee -a "$SUMMARY_FILE"
echo " Reports: $REPORT_DIR" | tee -a "$SUMMARY_FILE"
echo " Started: $(date)" | tee -a "$SUMMARY_FILE"
echo "==========================================" | tee -a "$SUMMARY_FILE"

declare -A TESTS
TESTS["health-check"]="health-check.js"
TESTS["auth-flow"]="auth-flow.js"
TESTS["contest-join"]="contest-join.js"
TESTS["leaderboard"]="leaderboard.js"
TESTS["wallet-transactions"]="wallet-transactions.js"
TESTS["mixed-workload"]="mixed-workload.js"

PASSED=0
FAILED=0

run_test() {
  local name="$1"
  local script="$2"
  local report_file="$REPORT_DIR/${name}_$TIMESTAMP.json"
  local summary_file="$REPORT_DIR/${name}_$TIMESTAMP.txt"

  echo "" | tee -a "$SUMMARY_FILE"
  echo "--- Running: $name ($script) ---" | tee -a "$SUMMARY_FILE"

  local k6_args=(
    "run"
    "$SCRIPT_DIR/$script"
    "--summary-export=$report_file"
    "--out" "json=$report_file"
  )

  if [ -n "$STAGES" ]; then
    k6_args+=("-e" "STAGES_CONFIG=$STAGES")
  fi

  if k6 "${k6_args[@]}" 2>&1 | tee "$summary_file"; then
    echo "--- Completed: $name (PASS) ---" | tee -a "$SUMMARY_FILE"
    PASSED=$((PASSED + 1))
  else
    echo "--- Completed: $name (FAIL) ---" | tee -a "$SUMMARY_FILE"
    FAILED=$((FAILED + 1))
  fi
}

for test_name in "${!TESTS[@]}"; do
  run_test "$test_name" "${TESTS[$test_name]}"
done

echo "" | tee -a "$SUMMARY_FILE"
echo "==========================================" | tee -a "$SUMMARY_FILE"
echo " Results: $PASSED passed, $FAILED failed" | tee -a "$SUMMARY_FILE"
echo " Reports saved to: $REPORT_DIR" | tee -a "$SUMMARY_FILE"
echo "==========================================" | tee -a "$SUMMARY_FILE"

echo ""
echo "To view results:"
echo "  ls -la $REPORT_DIR"
echo ""
echo "To compare with baseline:"
echo "  k6 run --summary-trend-stats=\"avg,p(95),p(99),max\" <script>"

exit $FAILED
