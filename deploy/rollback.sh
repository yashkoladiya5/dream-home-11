#!/bin/bash
set -euo pipefail

# ─── Dream Home 11 — Rollback Procedure ─────────────────────────────────────
# Usage:
#   ./deploy/rollback.sh                         # Rollback to previous version (auto-detect)
#   ./deploy/rollback.sh production              # Rollback production
#   ./deploy/rollback.sh staging v1.5.0          # Rollback to specific version
# ────────────────────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; NC='\033[0m'; BOLD='\033[1m'

ENV="${1:-production}"
ROLLBACK_VERSION="${2:-}"
NAMESPACE="dream-home-11"
[[ "$ENV" == "staging" ]] && NAMESPACE="dream-home-11-staging"
DOMAIN="${ENV}.dreamhome11.com"
[[ "$ENV" == "production" ]] && DOMAIN="api.dreamhome11.com"

SLACK_WEBHOOK="${SLACK_WEBHOOK_URL:-}"

log()   { echo -e "${CYAN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $*"; }
info()  { log "${GREEN}INFO:${NC} $*"; }
warn()  { log "${YELLOW}WARN:${NC} $*"; }
error() { log "${RED}ERROR:${NC} $*"; exit 1; }
header(){ echo -e "\n${BOLD}${CYAN}═══════════════════════════════════════════════${NC}"; }
step()  { echo -e "${BOLD}${YELLOW}──➤ $*${NC}"; }

for cmd in kubectl curl; do
  command -v "$cmd" >/dev/null 2>&1 || error "Missing prerequisite: $cmd"
done

# ─── Determine active / previous colors ──────────────────────────────────────
determine_colors() {
  if kubectl get ingress -n "$NAMESPACE" -o jsonpath='{.items[*].spec.rules[0].http.paths[0].backend.service.name}' 2>/dev/null | grep -q blue; then
    ACTIVE_COLOR="blue"
    PREVIOUS_COLOR="green"
  else
    ACTIVE_COLOR="green"
    PREVIOUS_COLOR="blue"
  fi
  info "Active: ${CYAN}$ACTIVE_COLOR${NC} | Rollback target: ${CYAN}$PREVIOUS_COLOR${NC}"
}

# ─── Find previous image version ─────────────────────────────────────────────
find_previous_version() {
  if [ -n "$ROLLBACK_VERSION" ]; then
    ROLLBACK_IMAGE="dreamhome11/backend:${ROLLBACK_VERSION}"
    info "Using specified version: ${CYAN}$ROLLBACK_VERSION${NC}"
    return
  fi

  local current_image
  current_image=$(kubectl get "deployment/dream-home-11-${PREVIOUS_COLOR}" \
    -n "$NAMESPACE" -o jsonpath='{.spec.template.spec.containers[0].image}' 2>/dev/null || echo "")

  if [ -n "$current_image" ] && [ "$current_image" != "dreamhome11/backend:latest" ]; then
    ROLLBACK_IMAGE="$current_image"
    ROLLBACK_VERSION=$(echo "$current_image" | cut -d: -f2)
    info "Found previous image: ${CYAN}$ROLLBACK_IMAGE${NC}"
    return
  fi

  # Check deployment history
  local rev
  rev=$(kubectl rollout history "deployment/dream-home-11-${PREVIOUS_COLOR}" \
    -n "$NAMESPACE" 2>/dev/null | tail -2 | head -1 | awk '{print $1}' || echo "")

  if [ -n "$rev" ] && [ "$rev" -gt 1 ]; then
    ROLLBACK_IMAGE=$(kubectl rollout history "deployment/dream-home-11-${PREVIOUS_COLOR}" \
      -n "$NAMESPACE" --revision="$((rev - 1))" \
      -o jsonpath='{.spec.template.spec.containers[0].image}' 2>/dev/null || echo "")
  fi

  if [ -z "$ROLLBACK_IMAGE" ]; then
    ROLLBACK_IMAGE="dreamhome11/backend:latest"
    ROLLBACK_VERSION="latest"
    warn "Could not determine previous version — using ${YELLOW}latest${NC}"
  fi
}

# ─── Perform rollback ────────────────────────────────────────────────────────
perform_rollback() {
  step "Rolling back to $ROLLBACK_IMAGE..."

  local deploy_file="$SCRIPT_DIR/blue-green/deploy-${PREVIOUS_COLOR}.yaml"
  if [ ! -f "$deploy_file" ]; then
    error "Deployment manifest not found: $deploy_file"
  fi

  local temp_file="/tmp/dh11-rollback-${PREVIOUS_COLOR}.yaml"
  sed "s|image: dreamhome11/backend:latest|image: ${ROLLBACK_IMAGE}|" \
    "$deploy_file" > "$temp_file"

  kubectl apply -f "$temp_file" -n "$NAMESPACE"
  rm -f "$temp_file"

  info "Waiting for rollback rollout..."
  kubectl rollout status "deployment/dream-home-11-${PREVIOUS_COLOR}" \
    -n "$NAMESPACE" --timeout=180s

  step "Switching traffic to $PREVIOUS_COLOR..."
  kubectl apply -f "$SCRIPT_DIR/blue-green/route-${PREVIOUS_COLOR}.yaml"

  info "Traffic switched to ${CYAN}$PREVIOUS_COLOR${NC} with image ${CYAN}$ROLLBACK_IMAGE${NC}"
}

# ─── Verify rollback ─────────────────────────────────────────────────────────
verify_rollback() {
  step "Verifying rollback..."

  for i in $(seq 1 12); do
    if curl -sf --connect-timeout 10 "https://${DOMAIN}/health" >/dev/null 2>&1; then
      info "Health check passed after rollback"
      break
    fi
    if [ "$i" -eq 12 ]; then
      error "Rollback health check failed — manual intervention required"
    fi
    warn "Waiting for health check... attempt $i/12"
    sleep 5
  done

  local pods
  pods=$(kubectl get pods -n "$NAMESPACE" -l "app.kubernetes.io/deployment=${PREVIOUS_COLOR}" \
    --field-selector status.phase=Running -o jsonpath='{.items[*].metadata.name}' 2>/dev/null)
  local pod_count
  pod_count=$(echo "$pods" | wc -w | tr -d ' ')
  if [ "$pod_count" -ge 3 ]; then
    info "All $pod_count replicas running for ${CYAN}$PREVIOUS_COLOR${NC}"
  else
    warn "Only $pod_count replicas running (expected 3)"
  fi
}

# ─── Send alert notification ────────────────────────────────────────────────
send_alert() {
  if [ -z "$SLACK_WEBHOOK" ]; then
    warn "No SLACK_WEBHOOK_URL set — skipping alert"
    return
  fi

  local message="Rollback performed on *$ENV* to version *${ROLLBACK_VERSION}*"
  local color="$([[ $? -eq 0 ]] && echo "good" || echo "danger")"

  curl -sf -X POST -H 'Content-type: application/json' \
    --data "$(cat <<PAYLOAD
{
  "text": "🚨 Rollback: $ENV → $ROLLBACK_VERSION",
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "🚨 Rollback Executed"
      }
    },
    {
      "type": "section",
      "fields": [
        {"type": "mrkdwn", "text": "*Environment:* $ENV"},
        {"type": "mrkdwn", "text": "*Rolled back to:* \`$ROLLBACK_VERSION\`"},
        {"type": "mrkdwn", "text": "*New active:* $PREVIOUS_COLOR"},
        {"type": "mrkdwn", "text": "*Timestamp:* $(date '+%Y-%m-%d %H:%M:%S UTC')"}
      ]
    }
  ]
}
PAYLOAD
    )" "$SLACK_WEBHOOK" >/dev/null 2>&1 || warn "Slack notification failed"

  info "Alert notification sent"
}

# ─── Scale down failed deployment ───────────────────────────────────────────
cleanup_failed() {
  step "Scaling down failed deployment ($ACTIVE_COLOR)..."
  kubectl scale "deployment/dream-home-11-${ACTIVE_COLOR}" \
    --replicas=0 -n "$NAMESPACE" --timeout=60s
  info "Failed deployment scaled down"
}

# ─── Main ───────────────────────────────────────────────────────────────────
main() {
  header
  echo -e "${BOLD} Dream Home 11 — Rollback${NC}"
  echo -e " Environment: ${CYAN}$ENV${NC}"
  header

  determine_colors
  find_previous_version

  echo ""
  echo -e " ${YELLOW}${BOLD}⚠ WARNING: This will rollback $ENV to $ROLLBACK_VERSION${NC}"
  echo -n " Continue? [y/N] "
  read -r confirm
  if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    info "Rollback cancelled"
    exit 0
  fi

  perform_rollback
  verify_rollback
  cleanup_failed
  send_alert

  echo ""
  echo -e "${GREEN}${BOLD}✔ Rollback completed${NC}"
  echo -e "  Environment: ${CYAN}$ENV${NC}"
  echo -e "  Version:     ${CYAN}$ROLLBACK_VERSION${NC}"
  echo -e "  Active:      ${CYAN}$PREVIOUS_COLOR${NC}"
  echo ""
}

main "$@"
