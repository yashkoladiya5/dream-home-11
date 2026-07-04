#!/usr/bin/env bash
set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ASSETS_DIR="$PROJECT_ROOT/assets"
MANIFEST_FILE="$SCRIPT_DIR/asset-manifest.json"
AWS_PROFILE=""
S3_BUCKET=""
DISTRIBUTION_ID=""
DRY_RUN=false
VERSION=""
TIMESTAMP=""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info()  { echo -e "${CYAN}[INFO]${NC}  $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC}    $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

usage() {
  cat <<EOF
Usage: $(basename "$0") --bucket <s3-bucket> --profile <aws-profile> [options]

Required:
  --bucket <name>         S3 bucket name (e.g. dreamhome11-cdn-assets)
  --profile <profile>     AWS CLI profile name

Options:
  --distribution-id <id>  CloudFront distribution ID for cache invalidation
  --version <str>         Explicit version string (default: YYYYMMDD timestamp)
  --dry-run               Preview changes without uploading
  -h, --help              Show this help message
EOF
  exit 0
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --bucket)          S3_BUCKET="$2";        shift 2 ;;
    --profile)         AWS_PROFILE="$2";      shift 2 ;;
    --distribution-id) DISTRIBUTION_ID="$2";  shift 2 ;;
    --version)         VERSION="$2";          shift 2 ;;
    --dry-run)         DRY_RUN=true;          shift   ;;
    -h|--help)         usage                            ;;
    *) log_error "Unknown option: $1"; usage            ;;
  esac
done

if [[ -z "$S3_BUCKET" || -z "$AWS_PROFILE" ]]; then
  log_error "--bucket and --profile are required"
  usage
fi

if [[ -z "$VERSION" ]]; then
  VERSION="$(date +%Y%m%d)"
fi
TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

AWS_CMD="aws --profile $AWS_PROFILE"
S3_TARGET="s3://$S3_BUCKET/assets/"

if ! $AWS_CMD sts get-caller-identity &>/dev/null; then
  log_error "Unable to authenticate with AWS profile '$AWS_PROFILE'. Check your credentials."
  exit 1
fi

log_info "CDN Asset Uploader"
log_info "  Source:      $ASSETS_DIR"
log_info "  Target:      $S3_TARGET"
log_info "  Version:     $VERSION"
log_info "  Profile:     $AWS_PROFILE"
log_info "  Dry-run:     $DRY_RUN"
echo ""

if [[ ! -d "$ASSETS_DIR" ]]; then
  log_error "Assets directory not found: $ASSETS_DIR"
  exit 1
fi

declare -A MIME_TYPES=(
  [png]="image/png"
  [jpg]="image/jpeg"
  [jpeg]="image/jpeg"
  [gif]="image/gif"
  [webp]="image/webp"
  [avif]="image/avif"
  [svg]="image/svg+xml"
  [ico]="image/x-icon"
  [json]="application/json"
  [webmanifest]="application/manifest+json"
  [css]="text/css"
  [js]="application/javascript"
  [woff2]="font/woff2"
  [ttf]="font/ttf"
  [otf]="font/otf"
)

get_content_type() {
  local ext="${1##*.}"
  ext="${ext,,}"
  echo "${MIME_TYPES[$ext]:-application/octet-stream}"
}

compute_hash() {
  if command -v md5sum &>/dev/null; then
    md5sum "$1" | cut -d' ' -f1
  elif command -v md5 &>/dev/null; then
    md5 -r "$1" | cut -d' ' -f1
  else
    shasum -a 256 "$1" | cut -d' ' -f1 | head -c 32
  fi
}

upload_file() {
  local src="$1"
  local relative_path="$2"
  local content_type="$3"
  local cache_control="public, max-age=31536000, immutable"

  if [[ "$DRY_RUN" == true ]]; then
    log_info "[DRY-RUN] Would upload: s3://$S3_BUCKET/$relative_path ($content_type)"
    return 0
  fi

  log_info "Uploading: $relative_path"

  $AWS_CMD s3 cp "$src" "s3://$S3_BUCKET/$relative_path" \
    --content-type "$content_type" \
    --cache-control "$cache_control" \
    --no-progress 2>&1 | tail -1

  log_ok "Uploaded:  $relative_path"
}

build_manifest() {
  log_info "Generating asset manifest..."
  local entries=()
  local first=true

  while IFS= read -r -d '' file; do
    local relative="${file#$PROJECT_ROOT/}"
    local ext="${file##*.}"
    local hash
    hash=$(compute_hash "$file")

    local logical_name="${relative#assets/}"
    logical_name="${logical_name%.*}"
    logical_name="${logical_name//\//_}"

    if [[ "$first" == true ]]; then
      first=false
    fi

    if command -v identify &>/dev/null; then
      local dims
      dims=$(identify -format "%w %h" "$file" 2>/dev/null || echo "0 0")
      read -r width height <<< "$dims"
    else
      width=0
      height=0
    fi

    local content_type
    content_type=$(get_content_type "$file")

    entries+=("$(cat <<EOF
    "${logical_name}": {
      "path": "${relative}",
      "type": "${content_type}",
      "hash": "${hash}",
      "width": ${width},
      "height": ${height}
    }
EOF
)"
  done < <(find "$ASSETS_DIR" -type f \( -iname '*.png' -o -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.gif' -o -iname '*.webp' -o -iname '*.avif' -o -iname '*.svg' -o -iname '*.ico' -o -iname '*.json' \) -print0)

  local entries_json=""
  local sep=""
  for entry in "${entries[@]}"; do
    entries_json+="$sep$entry"
    sep=","
  done

  if [[ "$DRY_RUN" == true ]]; then
    log_info "[DRY-RUN] Manifest would be written to: $MANIFEST_FILE"
    return 0
  fi

  cat > "$MANIFEST_FILE" <<MANIFEST_EOF
{
  "version": "$VERSION",
  "generated": "$TIMESTAMP",
  "basePath": "assets",
  "assets": {
$entries_json
  }
}
MANIFEST_EOF

  log_ok "Manifest written: $MANIFEST_FILE"

  local content_type
  content_type=$(get_content_type "$MANIFEST_FILE")
  $AWS_CMD s3 cp "$MANIFEST_FILE" "s3://$S3_BUCKET/asset-manifest.json" \
    --content-type "$content_type" \
    --cache-control "public, max-age=300" \
    --no-progress 2>&1 | tail -1
  log_ok "Manifest uploaded to s3://$S3_BUCKET/asset-manifest.json"
}

# ── Upload all assets ──────────────────────────────────────────
file_count=0
while IFS= read -r -d '' file; do
  relative="${file#$PROJECT_ROOT/}"
  content_type=$(get_content_type "$file")
  upload_file "$file" "$relative" "$content_type"
  ((file_count++))
done < <(find "$ASSETS_DIR" -type f \( -iname '*.png' -o -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.gif' -o -iname '*.webp' -o -iname '*.avif' -o -iname '*.svg' -o -iname '*.ico' \) -print0)

if [[ "$DRY_RUN" == true ]]; then
  log_info "[DRY-RUN] Would upload $file_count files"
else
  log_ok "Uploaded $file_count files"
fi
echo ""

# ── Generate and upload manifest ───────────────────────────────
build_manifest
echo ""

# ── CloudFront invalidation ────────────────────────────────────
if [[ -n "$DISTRIBUTION_ID" && "$DRY_RUN" != true ]]; then
  log_info "Creating CloudFront invalidation for distribution $DISTRIBUTION_ID..."
  INVALIDATION_ID=$($AWS_CMD cloudfront create-invalidation \
    --distribution-id "$DISTRIBUTION_ID" \
    --paths "/assets/*" "/asset-manifest.json" \
    --query 'Invalidation.Id' \
    --output text)
  log_ok "Invalidation created: $INVALIDATION_ID"
elif [[ -n "$DISTRIBUTION_ID" && "$DRY_RUN" == true ]]; then
  log_info "[DRY-RUN] Would invalidate CloudFront distribution $DISTRIBUTION_ID for paths /assets/* and /asset-manifest.json"
fi

echo ""
log_ok "CDN upload complete (version: $VERSION)"
