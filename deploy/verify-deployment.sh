#!/bin/bash
set -euo pipefail

# ─── Dream Home 11 — Deployment Verification ────────────────────────────────
# Usage:
#   ./deploy/verify-deployment.sh                # verify currently-active env
#   ./deploy/verify-deployment.sh production     # verify production
#   ./deploy/verify-deployment.sh staging        # verify staging
# ────────────────────────────────────────────────────────────────────────────

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; NC='\033[0m'; BOLD='\033[1m'

ENV="${1:-production}"
NAMESPACE="dream-home-11"
[[ "$ENV" == "staging" ]] && NAMESPACE="dream-home-11-staging"
DOMAIN="${ENV}.dreamhome11.com"
[[ "$ENV" == "production" ]] && DOMAIN="api.dreamhome11.com"

PASS=0
FAIL=0

log()    { echo -e "${CYAN}[$(date '+%H:%M:%S')]${NC} $*"; }
info()   { log "${GREEN}INFO:${NC} $*"; }
warn()   { log "${YELLOW}WARN:${NC} $*"; }
error()  { log "${RED}ERROR:${NC} $*"; }
header() { echo -e "\n${BOLD}${CYAN}═══════════════════════════════════════════════${NC}"; }

check() {
  local name="$1"; shift
  if "$@" >/dev/null 2>&1; then
    echo -e "  ${GREEN}✔${NC} $name"
    PASS=$((PASS + 1))
    return 0
  else
    echo -e "  ${RED}✘${NC} $name"
    FAIL=$((FAIL + 1))
    return 1
  fi
}

# ─── Summary ────────────────────────────────────────────────────────────────
summary() {
  local total=$((PASS + FAIL))
  local color="$GREEN"
  [ "$FAIL" -gt 0 ] && color="$RED"
  echo ""
  echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════${NC}"
  echo -e " ${BOLD}Deployment Verification Summary${NC}"
  echo -e " Environment: ${CYAN}$ENV${NC}"
  echo -e " ${GREEN}Passed: $PASS${NC}"
  echo -e " ${RED}Failed: $FAIL${NC}"
  echo -e " Total:  $total"
  echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════${NC}"

  if [ "$FAIL" -eq 0 ]; then
    echo -e " ${GREEN}${BOLD}✔ All checks passed${NC}"
  else
    echo -e " ${RED}${BOLD}✘ $FAIL check(s) failed${NC}"
    return 1
  fi
}

# ─── Main ───────────────────────────────────────────────────────────────────
main() {
  header
  echo -e "${BOLD} Dream Home 11 — Deployment Verification${NC}"
  echo -e " Environment: ${CYAN}$ENV${NC}   Namespace: ${CYAN}$NAMESPACE${NC}"
  header

  # ── K8s Pod Status ──────────────────────────────────────────────────────
  echo -e "\n${BOLD}▸ Pod Status${NC}"

  local pods
  pods=$(kubectl get pods -n "$NAMESPACE" -o json 2>/dev/null || echo '{"items":[]}')

  local pod_count
  pod_count=$(echo "$pods" | jq '.items | length')
  check "Pods exist in namespace" [ "$pod_count" -gt 0 ]

  local running
  running=$(echo "$pods" | jq '[.items[] | select(.status.phase=="Running")] | length')
  check "All pods Running ($running/$pod_count)" [ "$running" -eq "$pod_count" ]

  local ready
  ready=$(echo "$pods" | jq '[.items[] | select(.status.containerStatuses[0].ready==true)] | length')
  check "All containers ready ($ready/$pod_count)" [ "$ready" -eq "$pod_count" ]

  local restarts
  restarts=$(echo "$pods" | jq '[.items[].status.containerStatuses[0].restartCount] | max')
  check "No excessive restarts (max: $restarts)" [ "$restarts" -lt 5 ]

  # ── Health Endpoints ────────────────────────────────────────────────────
  echo -e "\n${BOLD}▸ Health Endpoints${NC}"

  local svc_name
  svc_name=$(kubectl get svc -n "$NAMESPACE" -l app.kubernetes.io/name=dream-home-11 \
    -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")

  if [ -n "$svc_name" ]; then
    local pod_name
    pod_name=$(kubectl get pods -n "$NAMESPACE" -l app=dream-home-11 \
      --field-selector status.phase=Running -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || true)

    if [ -n "$pod_name" ]; then
      check "Health endpoint (/health)" \
        kubectl exec -n "$NAMESPACE" "$pod_name" -- curl -sf http://localhost:3000/health >/dev/null 2>&1

      check "Liveness endpoint (/health/live)" \
        kubectl exec -n "$NAMESPACE" "$pod_name" -- curl -sf http://localhost:3000/health/live >/dev/null 2>&1

      check "Readiness endpoint (/health/ready)" \
        kubectl exec -n "$NAMESPACE" "$pod_name" -- curl -sf http://localhost:3000/health/ready >/dev/null 2>&1
    else
      warn "No running pods found for health checks"
    fi
  else
    warn "No service found for health checks"
  fi

  # ── External DNS / HTTPS ────────────────────────────────────────────────
  echo -e "\n${BOLD}▸ External Endpoints${NC}"

  check "DNS resolves ($DOMAIN)" \
    nslookup "$DOMAIN" >/dev/null 2>&1 || host "$DOMAIN" >/dev/null 2>&1 || dig +short "$DOMAIN" >/dev/null 2>&1

  check "HTTPS reachable (https://$DOMAIN/health)" \
    curl -sf --connect-timeout 10 "https://$DOMAIN/health" >/dev/null 2>&1

  # ── Redis Connectivity ──────────────────────────────────────────────────
  echo -e "\n${BOLD}▸ Redis${NC}"

  if kubectl get configmap -n "$NAMESPACE" dream-home-11-config -o yaml 2>/dev/null | grep -q redis; then
    local redis_host
    redis_host=$(kubectl get configmap -n "$NAMESPACE" dream-home-11-config \
      -o jsonpath='{.data.REDIS_HOST}' 2>/dev/null || echo "")

    if [ -n "$redis_host" ] && [ -n "${pod_name:-}" ]; then
      check "Redis reachable from pod ($redis_host)" \
        kubectl exec -n "$NAMESPACE" "$pod_name" -- \
          sh -c "curl -sf http://$redis_host:6379/ping >/dev/null 2>&1 || \
                 nc -zv $redis_host 6379 >/dev/null 2>&1"
    fi
  fi

  # ── PostgreSQL Connectivity ─────────────────────────────────────────────
  echo -e "\n${BOLD}▸ PostgreSQL${NC}"

  if kubectl get configmap -n "$NAMESPACE" dream-home-11-config -o yaml 2>/dev/null | grep -q DB_HOST; then
    local db_host
    db_host=$(kubectl get configmap -n "$NAMESPACE" dream-home-11-config \
      -o jsonpath='{.data.DB_HOST}' 2>/dev/null || "")

    if [ -n "$db_host" ] && [ -n "${pod_name:-}" ]; then
      check "PostgreSQL reachable from pod ($db_host)" \
        kubectl exec -n "$NAMESPACE" "$pod_name" -- \
          sh -c "nc -zv $db_host 5432 >/dev/null 2>&1"
    fi
  fi

  # ── Certificate Expiry ──────────────────────────────────────────────────
  echo -e "\n${BOLD}▸ SSL Certificates${NC}"

  if curl -sfvo /dev/null "https://$DOMAIN/health" 2>&1 | grep -q "expire date"; then
    local expiry
    expiry=$(echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN":443 2>/dev/null \
      | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2 || echo "unknown")

    if [ "$expiry" != "unknown" ]; then
      local expiry_epoch
      expiry_epoch=$(date -j -f "%b %d %T %Y %Z" "$expiry" +%s 2>/dev/null || \
                     date -d "$expiry" +%s 2>/dev/null || echo "0")
      local now_epoch
      now_epoch=$(date +%s)
      local days_left=$(( (expiry_epoch - now_epoch) / 86400 ))
      check "Certificate expires in $days_left days (>= 7)" [ "$days_left" -ge 7 ]
    fi
  fi

  # ── Ingress Status ──────────────────────────────────────────────────────
  echo -e "\n${BOLD}▸ Ingress${NC}"

  local ing_count
  ing_count=$(kubectl get ingress -n "$NAMESPACE" -o json | jq '.items | length' 2>/dev/null || echo "0")
  check "Ingress exists ($ing_count resource(s))" [ "$ing_count" -gt 0 ]

  # ── Resource Usage ──────────────────────────────────────────────────────
  echo -e "\n${BOLD}▸ Resource Usage${NC}"

  local cpu_usage=""
  local mem_usage=""
  cpu_usage=$(kubectl top pods -n "$NAMESPACE" --no-headers 2>/dev/null \
    | awk '{sum+=$2} END {print sum}' || echo "N/A")
  mem_usage=$(kubectl top pods -n "$NAMESPACE" --no-headers 2>/dev/null \
    | awk '{sum+=$3} END {print sum}' || echo "N/A")

  if [ "$cpu_usage" != "N/A" ]; then
    info "Total CPU: ${CYAN}${cpu_usage}m${NC}   Total Memory: ${CYAN}${mem_usage}${NC}"
  fi

  summary
}

main "$@"
