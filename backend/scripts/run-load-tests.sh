#!/usr/bin/env bash
set -eo pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOAD_DIR="$(cd "$SCRIPT_DIR/../test/load" && pwd)"
DEFAULT_TARGET="http://localhost:3000"
TARGET_URL="${TARGET_URL:-$DEFAULT_TARGET}"
REPORT_DIR="${REPORT_DIR:-$LOAD_DIR/reports}"
ENVIRONMENT="${ENVIRONMENT:-development}"
STAGES=""

usage() {
  cat <<EOF
Usage: $(basename "$0") [OPTIONS]

Run all k6 load test scripts in backend/test/load/ with colored output,
threshold validation, and HTML summary report generation.

Options:
  --target URL       Target base URL (default: http://localhost:3000)
  --stages CONFIG    k6 stages JSON configuration (overrides defaults)
  --report-dir PATH  Output directory for reports (default: test/load/reports)
  --environment ENV  Environment tag (development|staging|production)
  --help             Show this help message

Environment variables:
  TARGET_URL         Same as --target
  REPORT_DIR         Same as --report-dir
  ENVIRONMENT        Same as --environment
  K6_PROMETHEUS_OUTPUT  Enable Prometheus output for k6

Examples:
  $(basename "$0") --target https://staging.dreamhome11.com
  $(basename "$0") --target http://localhost:3000 --environment staging
  $(basename "$0") --target https://production.com --report-dir ./reports/prod
EOF
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target) TARGET_URL="$2"; shift 2 ;;
    --stages) STAGES="$2"; shift 2 ;;
    --report-dir) REPORT_DIR="$2"; shift 2 ;;
    --environment) ENVIRONMENT="$2"; shift 2 ;;
    --help) usage ;;
    *) echo -e "${RED}Unknown option: $1${NC}"; usage ;;
  esac
done

if ! command -v k6 &>/dev/null; then
  echo -e "${RED}Error: k6 is not installed.${NC}"
  echo ""
  echo "Installation instructions:"
  echo "  macOS: brew install k6"
  echo "  Linux: https://k6.io/docs/getting-started/installation/"
  echo "  Docker: docker pull grafana/k6"
  exit 1
fi

mkdir -p "$REPORT_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
SUMMARY_FILE="$REPORT_DIR/summary_$TIMESTAMP.txt"
HTML_REPORT="$REPORT_DIR/report_$TIMESTAMP.html"
JSON_RESULTS="$REPORT_DIR/results_$TIMESTAMP.json"

export TARGET_URL
export ENVIRONMENT
export K6_PROMETHEUS_OUTPUT="${K6_PROMETHEUS_OUTPUT:-}"

echo -e "${CYAN}==========================================${NC}" | tee -a "$SUMMARY_FILE"
echo -e "${CYAN} Dream Home 11 — k6 Load Test Suite${NC}" | tee -a "$SUMMARY_FILE"
echo -e "${CYAN} Target: $TARGET_URL${NC}" | tee -a "$SUMMARY_FILE"
echo -e "${CYAN} Reports: $REPORT_DIR${NC}" | tee -a "$SUMMARY_FILE"
echo -e "${CYAN} Environment: $ENVIRONMENT${NC}" | tee -a "$SUMMARY_FILE"
echo -e "${CYAN} Started: $(date)${NC}" | tee -a "$SUMMARY_FILE"
echo -e "${CYAN}==========================================${NC}" | tee -a "$SUMMARY_FILE"

declare -A TESTS
TESTS["health-check"]="health-check.js"
TESTS["auth-flow"]="auth-flow.js"
TESTS["contest-join"]="contest-join.js"
TESTS["leaderboard"]="leaderboard.js"
TESTS["wallet-transactions"]="wallet-transactions.js"
TESTS["mixed-workload"]="mixed-workload.js"

PASSED=0
FAILED=0
ALL_RESULTS="[]"

run_test() {
  local name="$1"
  local script="$2"
  local json_file="$REPORT_DIR/${name}_$TIMESTAMP.json"
  local summary_file="$REPORT_DIR/${name}_$TIMESTAMP.txt"

  echo "" | tee -a "$SUMMARY_FILE"
  echo -e "${YELLOW}[RUNNING]${NC} $name ($script)" | tee -a "$SUMMARY_FILE"

  local k6_args=(
    "run"
    "$LOAD_DIR/$script"
    "--summary-export=$json_file"
    "--out" "json=$json_file"
    "-e" "TARGET_URL=$TARGET_URL"
    "-e" "ENVIRONMENT=$ENVIRONMENT"
  )

  if [ -n "$STAGES" ]; then
    k6_args+=("-e" "STAGES_CONFIG=$STAGES")
  fi

  set +e
  if k6 "${k6_args[@]}" 2>&1 | tee "$summary_file"; then
    echo -e "${GREEN}[PASS]${NC} $name completed successfully" | tee -a "$SUMMARY_FILE"
    PASSED=$((PASSED + 1))
    local status="pass"
  else
    echo -e "${RED}[FAIL]${NC} $name failed (thresholds breached)" | tee -a "$SUMMARY_FILE"
    FAILED=$((FAILED + 1))
    local status="fail"
  fi
  set -eo pipefail

  ALL_RESULTS=$(echo "$ALL_RESULTS" | jq \
    --arg name "$name" \
    --arg status "$status" \
    --argjson data "$(cat "$json_file" 2>/dev/null || echo '{}')" \
    '. += [{"test": $name, "status": $status, "data": $data}]' 2>/dev/null || echo "$ALL_RESULTS")
}

echo -e "${BOLD}Found ${#TESTS[@]} test scripts to execute${NC}" | tee -a "$SUMMARY_FILE"

for test_name in "${!TESTS[@]}"; do
  run_test "$test_name" "${TESTS[$test_name]}"
done

echo "$ALL_RESULTS" > "$JSON_RESULTS"

echo "" | tee -a "$SUMMARY_FILE"
echo -e "${CYAN}==========================================${NC}" | tee -a "$SUMMARY_FILE"
echo -e "${BOLD} Results: ${GREEN}$PASSED passed${NC}, ${RED}$FAILED failed${NC}${NC}" | tee -a "$SUMMARY_FILE"
echo -e "${CYAN} Reports saved to: $REPORT_DIR${NC}" | tee -a "$SUMMARY_FILE"
echo -e "${CYAN}==========================================${NC}" | tee -a "$SUMMARY_FILE"

cat > "$HTML_REPORT" <<HTMLREPORT
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Dream Home 11 — Load Test Report</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 960px; margin: 0 auto; padding: 20px; background: #0f172a; color: #e2e8f0; }
  h1 { color: #38bdf8; border-bottom: 2px solid #334155; padding-bottom: 10px; }
  h2 { color: #94a3b8; }
  .summary { display: flex; gap: 20px; margin: 20px 0; }
  .card { background: #1e293b; border-radius: 8px; padding: 20px; flex: 1; text-align: center; }
  .card .number { font-size: 2em; font-weight: bold; }
  .card.pass .number { color: #22c55e; }
  .card.fail .number { color: #ef4444; }
  .card.total .number { color: #38bdf8; }
  table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  th, td { padding: 12px; text-align: left; border-bottom: 1px solid #334155; }
  th { background: #1e293b; color: #94a3b8; }
  .pass-badge { color: #22c55e; font-weight: bold; }
  .fail-badge { color: #ef4444; font-weight: bold; }
  .meta { color: #64748b; font-size: 0.9em; margin-top: 30px; }
</style>
</head>
<body>
<h1>🏠 Dream Home 11 — Load Test Report</h1>
<p>Generated: $(date)<br>Target: $TARGET_URL<br>Environment: $ENVIRONMENT</p>

<div class="summary">
  <div class="card total">
    <div class="number">${#TESTS[@]}</div>
    <div>Total Tests</div>
  </div>
  <div class="card pass">
    <div class="number">$PASSED</div>
    <div>Passed</div>
  </div>
  <div class="card fail">
    <div class="number">$FAILED</div>
    <div>Failed</div>
  </div>
</div>

<h2>Test Results</h2>
<table>
  <tr><th>Test</th><th>Status</th><th>Report</th></tr>
HTMLREPORT

for test_name in "${!TESTS[@]}"; do
  json_file="$REPORT_DIR/${test_name}_$TIMESTAMP.json"
  if [ -f "$json_file" ]; then
    status_badge="pass-badge"
    status_text="PASS"
    check_status=$(python3 -c "
import json,sys
try:
    with open('$json_file') as f:
        d=json.load(f)
    thresholds=d.get('thresholds',{})
    failed=[k for k,v in thresholds.items() if v.get('fail',False)]
    print('fail' if failed else 'pass')
except Exception: print('unknown')
" 2>/dev/null || echo "unknown")
    [ "$check_status" = "fail" ] && { status_badge="fail-badge"; status_text="FAIL"; }
  fi
  cat >> "$HTML_REPORT" <<HTMLREPORT
  <tr>
    <td>${test_name//_/ }</td>
    <td class="$status_badge">$status_text</td>
    <td><a href="${test_name}_$TIMESTAMP.json">JSON</a> | <a href="${test_name}_$TIMESTAMP.txt">Log</a></td>
  </tr>
HTMLREPORT
done

cat >> "$HTML_REPORT" <<HTMLREPORT
</table>
<div class="meta">
<p>To re-run: <code>bash backend/scripts/run-load-tests.sh --target $TARGET_URL</code></p>
<p>To analyze: <code>node backend/scripts/analyze-load-results.js --input $JSON_RESULTS</code></p>
</div>
</body>
</html>
HTMLREPORT

echo "" | tee -a "$SUMMARY_FILE"
echo -e "${GREEN}HTML report generated: $HTML_REPORT${NC}" | tee -a "$SUMMARY_FILE"
echo "" | tee -a "$SUMMARY_FILE"
echo -e "To view results:" | tee -a "$SUMMARY_FILE"
echo -e "  ls -la $REPORT_DIR" | tee -a "$SUMMARY_FILE"
echo -e "To analyze results:" | tee -a "$SUMMARY_FILE"
echo -e "  node $SCRIPT_DIR/analyze-load-results.js --input $JSON_RESULTS" | tee -a "$SUMMARY_FILE"
echo -e "To open HTML report:" | tee -a "$SUMMARY_FILE"
echo -e "  open $HTML_REPORT" | tee -a "$SUMMARY_FILE"

exit $FAILED
