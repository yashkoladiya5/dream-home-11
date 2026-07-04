#!/bin/bash
set -eo pipefail

# Dream Home 11 — Automated Release Creation Script
# Usage: ./scripts/release.sh [major|minor|patch|<version>] [options]

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
PUBSPEC="$PROJECT_ROOT/pubspec.yaml"
BACKEND_PKG="$PROJECT_ROOT/backend/package.json"
CHANGELOG="$PROJECT_ROOT/CHANGELOG.md"
DRY_RUN=false
SKIP_TESTS=false
SKIP_BUILD=false

usage() {
  echo -e "${BOLD}Dream Home 11 — Release Script${NC}"
  echo ""
  echo "Usage: $0 [options] <version-type>"
  echo ""
  echo "Version Types:"
  echo "  major                Increment major version (1.0.0 → 2.0.0)"
  echo "  minor                Increment minor version (1.0.0 → 1.1.0)"
  echo "  patch                Increment patch version (1.0.0 → 1.0.1)"
  echo "  X.Y.Z                Explicit semver version (e.g. 1.2.3)"
  echo ""
  echo "Options:"
  echo "  --dry-run            Show what would be done without making changes"
  echo "  --skip-tests         Skip test execution"
  echo "  --skip-build         Skip artifact building"
  echo "  -h, --help           Show this help message"
  echo ""
  echo "Examples:"
  echo "  $0 patch             # 1.0.0 → 1.0.1"
  echo "  $0 minor             # 1.0.0 → 1.1.0"
  echo "  $0 2.0.0             # Explicit version"
  echo "  $0 patch --dry-run   # Preview changes"
  exit 0
}

parse_args() {
  RELEASE_TYPE=""
  while [[ $# -gt 0 ]]; do
    case $1 in
      major|minor|patch)
        RELEASE_TYPE="$1"
        shift
        ;;
      --dry-run)
        DRY_RUN=true
        shift
        ;;
      --skip-tests)
        SKIP_TESTS=true
        shift
        ;;
      --skip-build)
        SKIP_BUILD=true
        shift
        ;;
      -h|--help)
        usage
        ;;
      *)
        if [[ $RELEASE_TYPE == "" ]]; then
          RELEASE_TYPE="$1"
          shift
        else
          echo -e "${RED}Unknown option: $1${NC}"
          usage
        fi
        ;;
    esac
  done

  if [[ -z "$RELEASE_TYPE" ]]; then
    log_error "No version type specified."
    usage
  fi
}

validate_semver() {
  local version=$1
  if [[ ! $version =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    log_error "Invalid version format: '$version'. Must be MAJOR.MINOR.PATCH (e.g. 1.2.3)"
    exit 1
  fi
}

get_current_version() {
  if [[ -f "$PUBSPEC" ]]; then
    grep '^version:' "$PUBSPEC" | awk '{print $2}' | cut -d'+' -f1
  else
    log_error "pubspec.yaml not found at $PUBSPEC"
    exit 1
  fi
}

bump_version() {
  local current=$1
  local bump_type=$2

  IFS='.' read -r major minor patch <<< "$current"

  case $bump_type in
    major) echo "$((major + 1)).0.0" ;;
    minor) echo "$major.$((minor + 1)).0" ;;
    patch) echo "$major.$minor.$((patch + 1))" ;;
    *)    validate_semver "$bump_type"; echo "$bump_type" ;;
  esac
}

check_clean_working_directory() {
  if [[ -n "$(git status --porcelain)" ]]; then
    log_error "Working directory is not clean. Please commit or stash changes first."
    git status --short
    exit 1
  fi
  log_ok "Working directory is clean"
}

run_flutter_tests() {
  log_info "Running Flutter tests..."
  if ! flutter test --no-sound-null-safety 2>&1 | tail -5; then
    log_error "Flutter tests failed. Aborting release."
    exit 1
  fi
  log_ok "Flutter tests passed"
}

run_backend_tests() {
  log_info "Running backend tests..."
  (cd "$PROJECT_ROOT/backend" && npm test 2>&1 | tail -5)
  local exit_code=$?
  if [[ $exit_code -ne 0 ]]; then
    log_error "Backend tests failed. Aborting release."
    exit 1
  fi
  log_ok "Backend tests passed"
}

update_pubspec_version() {
  local new_version=$1
  if [[ "$DRY_RUN" == true ]]; then
    log_info "[DRY-RUN] Would update pubspec.yaml: version: $new_version+1"
    return
  fi
  sed -i '' "s/^version: .*/version: $new_version+1/" "$PUBSPEC"
  log_ok "Updated pubspec.yaml to version $new_version"
}

update_backend_version() {
  local new_version=$1
  if [[ "$DRY_RUN" == true ]]; then
    log_info "[DRY-RUN] Would update backend/package.json: version: $new_version"
    return
  fi
  sed -i '' "s/\"version\": \".*\"/\"version\": \"$new_version\"/" "$BACKEND_PKG"
  log_ok "Updated backend/package.json to version $new_version"
}

generate_changelog_entry() {
  local version=$1
  if [[ "$DRY_RUN" == true ]]; then
    log_info "[DRY-RUN] Would add changelog entry for v$version"
    return
  fi

  local today
  today=$(date +%Y-%m-%d)

  cat > /tmp/changelog_entry.md << EOF
## v$version ($today)

### Added
- Initial production release of Dream Home 11

### Features
- Phone OTP authentication with Firebase
- Multiple contest types (Mega, Home, Private)
- Real-time leaderboards and contest updates
- Double-entry wallet with Razorpay integration
- Points engine with tier multipliers and streaks
- Rewards catalog with spin wheel gamification
- Community feed with chat and referrals
- KYC verification and secure withdrawals
- Multi-language support (English, Hindi)
- Push notifications and deep linking

### Infrastructure
- Docker/Kubernetes deployment ready
- PgBouncer connection pooling
- Redis caching with persistence
- Prometheus/Grafana monitoring
- Sentry error tracking
- CDN asset delivery

---
EOF

  if [[ ! -f "$CHANGELOG" ]]; then
    echo "# Changelog" > "$CHANGELOG"
    echo "" >> "$CHANGELOG"
    echo "All notable changes to Dream Home 11 will be documented in this file." >> "$CHANGELOG"
    echo "" >> "$CHANGELOG"
  fi

  cat /tmp/changelog_entry.md >> "$CHANGELOG"
  log_ok "Changelog entry added for v$version"
}

create_git_tag() {
  local version=$1
  if [[ "$DRY_RUN" == true ]]; then
    log_info "[DRY-RUN] Would create and push git tag: v$version"
    return
  fi

  git add "$PUBSPEC" "$BACKEND_PKG" "$CHANGELOG"
  git commit -m "chore(release): bump version to v$version"
  git tag -a "v$version" -m "Dream Home 11 v$version — Initial Release"
  log_ok "Created git tag v$version"
}

build_flutter_artifacts() {
  if [[ "$DRY_RUN" == true ]]; then
    log_info "[DRY-RUN] Would build Flutter release artifacts"
    return
  fi
  log_info "Building Flutter release APK..."
  flutter build apk --release --obfuscate --split-debug-info=build/debug-info/android/
  log_ok "APK built at build/app/outputs/flutter-apk/app-release.apk"

  log_info "Building Flutter release AAB..."
  flutter build appbundle --release --obfuscate --split-debug-info=build/debug-info/android/
  log_ok "AAB built at build/app/outputs/bundle/release/app-release.aab"
}

build_docker_image() {
  local version=$1
  if [[ "$DRY_RUN" == true ]]; then
    log_info "[DRY-RUN] Would build Docker image: dreamhome11/backend:$version"
    return
  fi
  log_info "Building backend Docker image..."
  docker build -t "dreamhome11/backend:$version" -t "dreamhome11/backend:latest" "$PROJECT_ROOT/backend"
  log_ok "Docker image built: dreamhome11/backend:$version"
}

output_release_summary() {
  local version=$1
  local current=$2

  echo ""
  echo -e "${CYAN}══════════════════════════════════════════════════════════════${NC}"
  echo -e "${BOLD}${GREEN}              Release Summary: v$current → v$version${NC}${NC}"
  echo -e "${CYAN}══════════════════════════════════════════════════════════════${NC}"
  echo ""
  echo -e "  ${BOLD}Version:${NC}     $version"
  echo -e "  ${BOLD}Date:${NC}       $(date '+%Y-%m-%d %H:%M:%S')"
  echo ""
  echo -e "  ${BOLD}Artifacts:${NC}"
  echo -e "    APK:        build/app/outputs/flutter-apk/app-release.apk"
  echo -e "    AAB:        build/app/outputs/bundle/release/app-release.aab"
  echo -e "    Docker:     dreamhome11/backend:$version"
  echo -e "    Debug Info: build/debug-info/"
  echo ""
  echo -e "  ${BOLD}Tags:${NC}        v$version"
  echo ""
  if [[ "$DRY_RUN" == true ]]; then
    echo -e "  ${YELLOW}  ⚠  DRY RUN — No changes were made${NC}"
  fi
  echo -e "${CYAN}══════════════════════════════════════════════════════════════${NC}"
  echo ""
  echo -e "  ${BOLD}Next steps:${NC}"
  echo -e "    1. Run ./scripts/verify-release.sh v$version to verify artifacts"
  echo -e "    2. Push tag: git push origin v$version"
  echo -e "    3. Push commit: git push origin main"
  echo -e "    4. Submit to stores"
  echo ""
}

main() {
  echo -e "${CYAN}╔══════════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}║   ${BOLD}Dream Home 11 — Release Automation${NC}${CYAN}     ║${NC}"
  echo -e "${CYAN}╚══════════════════════════════════════════════╝${NC}"
  echo ""

  parse_args "$@"

  CURRENT_VERSION=$(get_current_version)
  log_info "Current version: $CURRENT_VERSION"

  NEW_VERSION=$(bump_version "$CURRENT_VERSION" "$RELEASE_TYPE")
  log_info "New version: $NEW_VERSION"

  if [[ "$DRY_RUN" == true ]]; then
    echo -e "${YELLOW}══════════ DRY RUN MODE ══════════${NC}"
  fi

  echo ""
  check_clean_working_directory

  if [[ "$SKIP_TESTS" == false ]]; then
    echo ""
    run_flutter_tests
    run_backend_tests
  else
    log_warn "Tests skipped (--skip-tests)"
  fi

  echo ""
  update_pubspec_version "$NEW_VERSION"
  update_backend_version "$NEW_VERSION"
  generate_changelog_entry "$NEW_VERSION"

  echo ""
  create_git_tag "$NEW_VERSION"

  if [[ "$SKIP_BUILD" == false ]]; then
    echo ""
    build_flutter_artifacts
    echo ""
    build_docker_image "$NEW_VERSION"
  else
    log_warn "Build skipped (--skip-build)"
  fi

  echo ""
  output_release_summary "$NEW_VERSION" "$CURRENT_VERSION"
}

main "$@"
