#!/bin/bash
set -euo pipefail

# ─── Dream Home 11 — Master Deployment Script ───────────────────────────────
# Usage:
#   ./deploy/deploy.sh staging             # deploy latest to staging
#   ./deploy/deploy.sh production          # deploy latest to production
#   ./deploy/deploy.sh production v2.0.1   # deploy specific version
#   ./deploy/deploy.sh production --rollback  # rollback previous deploy
# ────────────────────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; NC='\033[0m'; BOLD='\033[1m'

ENV="${1:-staging}"
VERSION="${2:-latest}"
NAMESPACE="dream-home-11"
[[ "$ENV" == "staging" ]] && NAMESPACE="dream-home-11-staging"

log()   { echo -e "${CYAN}[$(date '+%H:%M:%S')]${NC} $*"; }
info()  { log "${GREEN}INFO:${NC} $*"; }
warn()  { log "${YELLOW}WARN:${NC} $*"; }
error() { log "${RED}ERROR:${NC} $*"; exit 1; }
header(){ echo -e "\n${BOLD}${CYAN}═══════════════════════════════════════════════${NC}"; }
step()  { echo -e "${BOLD}${YELLOW}──➤ $*${NC}"; }

trap 'echo -e "${RED}Deployment failed at line $LINENO${NC}"; exit 1' ERR

# ─── Prerequisites ──────────────────────────────────────────────────────────
header
echo -e "${BOLD} Dream Home 11 — Master Deployment${NC}"
echo -e " Environment: ${CYAN}$ENV${NC}   Version: ${CYAN}$VERSION${NC}"
header

for cmd in docker kubectl jq curl; do
  command -v "$cmd" >/dev/null 2>&1 || error "Missing prerequisite: $cmd"
done

# ─── Determine active/idle colors ───────────────────────────────────────────
determine_colors() {
  local active=$(kubectl get ingress -n "$NAMESPACE" -l app.kubernetes.io/deployment=active -o jsonpath='{.items[0].metadata.labels.app\.kubernetes\.io/deployment-color}' 2>/dev/null || echo "blue")

  if kubectl get ingress -n "$NAMESPACE" dream-home-11-blue 2>/dev/null | grep -q dream-home-11-blue && \
     kubectl get ingress -n "$NAMESPACE" -o jsonpath='{.items[*].spec.rules[0].http.paths[0].backend.service.name}' 2>/dev/null | grep -q blue; then
    ACTIVE_COLOR="blue"
    IDLE_COLOR="green"
  else
    ACTIVE_COLOR="green"
    IDLE_COLOR="blue"
  fi

  info "Active: ${CYAN}$ACTIVE_COLOR${NC} | Idle: ${CYAN}$IDLE_COLOR${NC}"
}

# ─── Build & Push ───────────────────────────────────────────────────────────
build_and_push() {
  step "Building Docker images (version: $VERSION)..."

  cd "$PROJECT_ROOT/backend"

  local tag="dreamhome11/backend:${VERSION}"
  local sha_tag="dreamhome11/backend:$(git rev-parse --short HEAD 2>/dev/null || echo "$VERSION")"

  docker build -t "$tag" -t "$sha_tag" -t "dreamhome11/backend:${ENV}" .

  step "Pushing images to registry..."
  docker push "$tag"
  docker push "$sha_tag"
  docker push "dreamhome11/backend:${ENV}"

  IMAGE_TAG="$sha_tag"
  info "Image pushed: ${CYAN}$IMAGE_TAG${NC}"
  cd "$PROJECT_ROOT"
}

# ─── Deploy to idle environment ─────────────────────────────────────────────
deploy_idle() {
  step "Deploying to idle environment ($IDLE_COLOR)..."

  local deploy_file="$SCRIPT_DIR/blue-green/deploy-${IDLE_COLOR}.yaml"
  local temp_file="/tmp/dh11-deploy-${IDLE_COLOR}.yaml"

  sed "s|image: dreamhome11/backend:latest|image: dreamhome11/backend:${IMAGE_TAG}|" \
    "$deploy_file" > "$temp_file"

  kubectl apply -f "$temp_file" -n "$NAMESPACE"
  rm -f "$temp_file"

  info "Waiting for deployment rollout..."
  kubectl rollout status "deployment/dream-home-11-${IDLE_COLOR}" \
    -n "$NAMESPACE" --timeout=180s

  step "Running health checks on idle environment..."
  local svc="service/dream-home-11-${IDLE_COLOR}"

  for i in $(seq 1 15); do
    local status
    status=$(kubectl get "$svc" -n "$NAMESPACE" -o jsonpath='{.spec.ports[0].port}' 2>/dev/null)
    if [ -n "$status" ]; then
      local pod_ip
      pod_ip=$(kubectl get pods -n "$NAMESPACE" \
        -l "app.kubernetes.io/deployment=${IDLE_COLOR}" \
        -o jsonpath='{.items[0].status.podIP}' 2>/dev/null || true)

      if [ -n "$pod_ip" ]; then
        if kubectl exec -n "$NAMESPACE" \
          "deployment/dream-home-11-${IDLE_COLOR}" -- \
          curl -sf http://localhost:3000/health >/dev/null 2>&1; then
          info "Idle health check passed"
          break
        fi
      fi
    fi
    warn "Waiting for idle environment to be healthy... attempt $i/15"
    sleep 5
  done
}

# ─── Switch traffic ─────────────────────────────────────────────────────────
switch_traffic() {
  step "Switching traffic to $IDLE_COLOR..."

  kubectl apply -f "$SCRIPT_DIR/blue-green/route-${IDLE_COLOR}.yaml"

  if [[ "$ACTIVE_COLOR" != "$IDLE_COLOR" ]]; then
    kubectl label ingress "dream-home-11-${ACTIVE_COLOR}" \
      app.kubernetes.io/deployment- || true
    kubectl label ingress "dream-home-11-${IDLE_COLOR}" \
      app.kubernetes.io/deployment=active --overwrite
  fi

  info "Traffic switched to ${CYAN}$IDLE_COLOR${NC}"

  step "Verifying live traffic..."
  local domain="${ENV}.dreamhome11.com"
  [[ "$ENV" == "production" ]] && domain="api.dreamhome11.com"

  for i in $(seq 1 12); do
    if curl -sf "https://${domain}/health" >/dev/null 2>&1; then
      info "Live endpoint healthy after switch"
      break
    fi
    if [ "$i" -eq 12 ]; then
      warn "Live health check failed after switch — consider rollback"
    fi
    sleep 5
  done
}

# ─── Scale down old environment ─────────────────────────────────────────────
scale_down_old() {
  step "Scaling down old environment ($ACTIVE_COLOR)..."

  kubectl scale "deployment/dream-home-11-${ACTIVE_COLOR}" \
    --replicas=0 -n "$NAMESPACE" --timeout=60s

  info "Old environment ($ACTIVE_COLOR) scaled down"
}

# ─── Main ───────────────────────────────────────────────────────────────────
main() {
  if [ "${2:-}" = "--rollback" ]; then
    "$SCRIPT_DIR/rollback.sh" "$ENV"
    exit 0
  fi

  determine_colors
  build_and_push
  deploy_idle
  switch_traffic
  scale_down_old

  "$SCRIPT_DIR/verify-deployment.sh" "$ENV"

  echo ""
  echo -e "${GREEN}${BOLD}✔ Deployment completed successfully${NC}"
  echo -e "  Environment: ${CYAN}$ENV${NC}"
  echo -e "  Version:     ${CYAN}$VERSION${NC}"
  echo -e "  Active:      ${CYAN}$IDLE_COLOR${NC}"
  echo ""
}

main "$@"
