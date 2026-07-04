#!/bin/bash
set -euo pipefail

# ─── Dream Home 11 — SSL Certificate Automation ─────────────────────────────
# Usage:
#   ./deploy/ssl-setup.sh                    # Obtain/renew all certs
#   ./deploy/ssl-setup.sh --check            # Check cert expiry
#   ./deploy/ssl-setup.sh --renew            # Force renewal
#   ./deploy/ssl-setup.sh --cron             # Setup auto-renewal cron
# ────────────────────────────────────────────────────────────────────────────

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; NC='\033[0m'; BOLD='\033[1m'

DOMAINS=("api.dreamhome11.com" "admin.dreamhome11.com")
EMAIL="admin@dreamhome11.com"
NGINX_SSL_DIR="/etc/nginx/ssl"
LETSENCRYPT_DIR="/etc/letsencrypt/live"
WEBROOT="/var/www/certbot"
DOCKER_COMPOSE_FILE="/Users/yash/Desktop/Dream11/deploy/docker-compose.prod.yml"

log()   { echo -e "${CYAN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $*"; }
info()  { log "${GREEN}INFO:${NC} $*"; }
warn()  { log "${YELLOW}WARN:${NC} $*"; }
error() { log "${RED}ERROR:${NC} $*"; exit 1; }
header(){ echo -e "\n${BOLD}${CYAN}═══════════════════════════════════════════════${NC}"; }

# ─── Prerequisites ──────────────────────────────────────────────────────────
check_prereqs() {
  header
  echo -e "${BOLD} Dream Home 11 — SSL Certificate Setup${NC}"
  header

  if ! command -v certbot &>/dev/null; then
    info "Installing certbot..."
    if command -v apt-get &>/dev/null; then
      sudo apt-get update && sudo apt-get install -y certbot python3-certbot-nginx
    elif command -v brew &>/dev/null; then
      brew install certbot
    elif command -v yum &>/dev/null; then
      sudo yum install -y certbot python3-certbot-nginx
    else
      error "No package manager found. Install certbot manually: https://certbot.eff.org"
    fi
  fi

  if command -v docker &>/dev/null && [ -f "$DOCKER_COMPOSE_FILE" ]; then
    info "Docker Compose setup detected"
  fi

  info "certbot version: $(certbot --version 2>/dev/null || echo 'checking...')"
}

# ─── Obtain / Renew certificates ────────────────────────────────────────────
obtain_certs() {
  local domains_args=""
  for domain in "${DOMAINS[@]}"; do
    domains_args="$domains_args -d $domain"
  done

  if [ -d "$LETSENCRYPT_DIR/${DOMAINS[0]}" ]; then
    info "Certificates exist — attempting renewal..."
    sudo certbot renew $domains_args --non-interactive --quiet
  else
    info "Obtaining new Let's Encrypt certificates..."
    # Try nginx plugin first, fallback to standalone/webroot
    if command -v nginx &>/dev/null && systemctl is-active nginx &>/dev/null 2>&1; then
      sudo certbot --nginx $domains_args \
        --non-interactive --agree-tos --email "$EMAIL" \
        --redirect --hsts --staple-ocsp
    else
      sudo mkdir -p "$WEBROOT"
      sudo certbot certonly --webroot -w "$WEBROOT" \
        $domains_args \
        --non-interactive --agree-tos --email "$EMAIL"
    fi
  fi
}

# ─── Copy certs to nginx/Docker/K8s paths ────────────────────────────────────
copy_certs() {
  header
  echo -e "${BOLD} Copying certificates to deployment paths${NC}"
  header

  for domain in "${DOMAINS[@]}"; do
    local cert_src="$LETSENCRYPT_DIR/$domain"
    if [ ! -d "$cert_src" ]; then
      warn "Certificate directory not found for $domain — skipping"
      continue
    fi

    info "Processing certificates for $domain..."

    # nginx path
    if [ -d "$NGINX_SSL_DIR" ]; then
      local nginx_dest="$NGINX_SSL_DIR/live/$domain"
      sudo mkdir -p "$nginx_dest"
      sudo cp "$cert_src/fullchain.pem" "$nginx_dest/"
      sudo cp "$cert_src/privkey.pem" "$nginx_dest/"
      sudo cp "$cert_src/chain.pem" "$nginx_dest/"
      sudo chmod 600 "$nginx_dest/privkey.pem"
      info "  → Copied to nginx: $nginx_dest"
    fi

    # Docker path (deploy/nginx/ssl)
    local project_ssl_dir="/Users/yash/Desktop/Dream11/deploy/nginx/ssl/live/$domain"
    mkdir -p "$project_ssl_dir"
    sudo cp "$cert_src/fullchain.pem" "$project_ssl_dir/"
    sudo cp "$cert_src/privkey.pem" "$project_ssl_dir/"
    sudo cp "$cert_src/chain.pem" "$project_ssl_dir/"
    sudo chmod 600 "$project_ssl_dir/privkey.pem"
    info "  → Copied to project: $project_ssl_dir"
  done
}

# ─── Restart nginx ──────────────────────────────────────────────────────────
restart_nginx() {
  header
  echo -e "${BOLD} Restarting nginx${NC}"
  header

  if command -v systemctl &>/dev/null && systemctl is-active nginx &>/dev/null 2>&1; then
    sudo systemctl reload nginx 2>/dev/null || sudo systemctl restart nginx
    info "nginx reloaded via systemctl"
  elif command -v docker &>/dev/null && [ -f "$DOCKER_COMPOSE_FILE" ]; then
    docker compose -f "$DOCKER_COMPOSE_FILE" exec nginx nginx -s reload 2>/dev/null || \
      docker compose -f "$DOCKER_COMPOSE_FILE" restart nginx 2>/dev/null || true
    info "nginx reloaded via docker compose"
  else
    warn "Could not restart nginx — do so manually"
  fi
}

# ─── Setup auto-renewal cron ────────────────────────────────────────────────
setup_cron() {
  header
  echo -e "${BOLD} Setting up auto-renewal cron job${NC}"
  header

  local script_path
  script_path="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/ssl-setup.sh"
  local cron_job="0 3 * * * $script_path --renew >> /var/log/ssl-renew.log 2>&1"

  if crontab -l 2>/dev/null | grep -q "$script_path"; then
    info "Cron job already exists — updating..."
    (crontab -l 2>/dev/null | grep -v "$script_path"; echo "$cron_job") | crontab -
  else
    (crontab -l 2>/dev/null; echo "$cron_job") | crontab -
    info "Cron job added: daily at 3:00 AM"
  fi

  # Also setup systemd timer if available
  if command -v systemctl &>/dev/null; then
    local service_file="/etc/systemd/system/certbot-renew.service"
    local timer_file="/etc/systemd/system/certbot-renew.timer"

    if [ ! -f "$service_file" ]; then
      sudo tee "$service_file" >/dev/null <<'SVC'
[Unit]
Description=Certbot Renewal

[Service]
Type=oneshot
ExecStart=/usr/bin/certbot renew --quiet --non-interactive
ExecStartPost=/bin/systemctl reload nginx
SVC
    fi

    if [ ! -f "$timer_file" ]; then
      sudo tee "$timer_file" >/dev/null <<'TMR'
[Unit]
Description=Run certbot renewal twice daily

[Timer]
OnCalendar=*-*-* 03:00,15:00:00
RandomizedDelaySec=3600
Persistent=true

[Install]
WantedBy=timers.target
TMR
      sudo systemctl daemon-reload
      sudo systemctl enable certbot-renew.timer --now
      info "Systemd timer enabled (twice daily)"
    fi
  fi
}

# ─── Check certificate expiry ───────────────────────────────────────────────
check_expiry() {
  header
  echo -e "${BOLD} Certificate Expiry Check${NC}"
  header

  local all_ok=true
  for domain in "${DOMAINS[@]}"; do
    local cert_file="$LETSENCRYPT_DIR/$domain/fullchain.pem"
    if [ ! -f "$cert_file" ]; then
      warn "No certificate found for $domain"
      all_ok=false
      continue
    fi

    local expiry
    expiry=$(openssl x509 -enddate -noout -in "$cert_file" 2>/dev/null | cut -d= -f2)
    local expiry_epoch
    expiry_epoch=$(date -j -f "%b %d %T %Y %Z" "$expiry" +%s 2>/dev/null || \
                   date -d "$expiry" +%s 2>/dev/null)
    local now_epoch
    now_epoch=$(date +%s)
    local days_left=$(( (expiry_epoch - now_epoch) / 86400 ))

    if [ "$days_left" -lt 0 ]; then
      echo -e "  ${RED}✘${NC} $domain — ${RED}EXPIRED${NC} (expired $(( -days_left )) days ago)"
      all_ok=false
    elif [ "$days_left" -lt 7 ]; then
      echo -e "  ${YELLOW}⚠${NC} $domain — ${YELLOW}$days_left days${NC} (expires $expiry)"
      all_ok=false
    elif [ "$days_left" -lt 30 ]; then
      echo -e "  ${YELLOW}⚠${NC} $domain — $days_left days (expires $expiry)"
    else
      echo -e "  ${GREEN}✔${NC} $domain — $days_left days (expires $expiry)"
    fi
  done

  $all_ok && return 0 || return 1
}

# ─── Main ───────────────────────────────────────────────────────────────────
main() {
  case "${1:-}" in
    --check)
      check_expiry
      ;;
    --renew)
      check_prereqs
      obtain_certs
      copy_certs
      restart_nginx
      info "Renewal complete"
      ;;
    --cron)
      setup_cron
      ;;
    *)
      check_prereqs
      obtain_certs
      copy_certs
      restart_nginx
      setup_cron
      check_expiry
      echo -e "\n${GREEN}${BOLD}✔ SSL setup complete${NC}"
      ;;
  esac
}

main "$@"
