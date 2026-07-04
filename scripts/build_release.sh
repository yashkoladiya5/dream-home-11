#!/bin/bash
set -eo pipefail

APP_NAME="dream_home_11"
BUILD_NUMBER="${BUILD_NUMBER:-1}"
BUILD_NAME="${BUILD_NAME:-1.0.0}"
PLATFORM="${1:-all}"
ENV="${2:-production}"
SENTRY_DSN="${SENTRY_DSN:-}"
START_TIME=$(date +%s)

usage() {
  echo "Usage: $0 [--platform android|ios|all] [--env production|staging] [--version VERSION] [--build-number NUM]"
  exit 1
}

while [[ $# -gt 0 ]]; do
  case $1 in
    --platform) PLATFORM="$2"; shift 2 ;;
    --env) ENV="$2"; shift 2 ;;
    --version) BUILD_NAME="$2"; shift 2 ;;
    --build-number) BUILD_NUMBER="$2"; shift 2 ;;
    *) shift ;;
  esac
done

if [[ "$PLATFORM" != "android" && "$PLATFORM" != "ios" && "$PLATFORM" != "all" ]]; then
  echo "Error: Invalid platform '$PLATFORM'. Must be android, ios, or all."
  exit 1
fi

if [[ "$ENV" != "production" && "$ENV" != "staging" ]]; then
  echo "Error: Invalid environment '$ENV'. Must be production or staging."
  exit 1
fi

echo "=== $APP_NAME Release Build v$BUILD_NAME (build $BUILD_NUMBER) ==="
echo "Platform: $PLATFORM"
echo "Environment: $ENV"
echo ""

if ! command -v flutter &> /dev/null; then
  echo "Error: Flutter is not installed or not in PATH"
  exit 1
fi

echo "--- Flutter pub get ---"
flutter pub get

echo ""
echo "--- Cleaning previous builds ---"
flutter clean
flutter pub get

DART_DEFINES="--dart-define=APP_ENV=$ENV"
if [[ -n "$SENTRY_DSN" ]]; then
  DART_DEFINES="$DART_DEFINES --dart-define=SENTRY_DSN=$SENTRY_DSN"
fi

if [[ "$ENV" == "production" ]]; then
  DART_DEFINES="$DART_DEFINES --dart-define=ENABLE_SSL_PINNING=true"
fi

# Android builds
if [[ "$PLATFORM" == "android" || "$PLATFORM" == "all" ]]; then
  echo ""
  echo "--- Building Android APK (Release) ---"
  flutter build apk \
    --release \
    --obfuscate \
    --split-debug-info=build/debug-info/android/ \
    --build-name="$BUILD_NAME" \
    --build-number="$BUILD_NUMBER" \
    $DART_DEFINES

  echo ""
  echo "--- Building Android AppBundle (Release) ---"
  flutter build appbundle \
    --release \
    --obfuscate \
    --split-debug-info=build/debug-info/android/ \
    --build-name="$BUILD_NAME" \
    --build-number="$BUILD_NUMBER" \
    $DART_DEFINES
fi

# iOS builds
if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "all" ]]; then
  echo ""
  echo "--- Building iOS (Release, no codesign) ---"
  flutter build ios \
    --release \
    --no-codesign \
    --obfuscate \
    --split-debug-info=build/debug-info/ios/ \
    --build-name="$BUILD_NAME" \
    --build-number="$BUILD_NUMBER" \
    $DART_DEFINES
fi

echo ""
echo "--- Verifying build artifacts ---"

if [[ "$PLATFORM" == "android" || "$PLATFORM" == "all" ]]; then
  APK_PATH="build/app/outputs/flutter-apk/app-release.apk"
  AAB_PATH="build/app/outputs/bundle/release/app-release.aab"

  if [[ -f "$APK_PATH" ]]; then
    APK_SIZE=$(stat -f%z "$APK_PATH" 2>/dev/null || stat -c%s "$APK_PATH" 2>/dev/null)
    APK_SIZE_MB=$((APK_SIZE / 1048576))
    echo "✓ Android APK: $APK_PATH (${APK_SIZE_MB}MB)"
    echo "  SHA-256: $(shasum -a 256 "$APK_PATH" | cut -d' ' -f1)"
  else
    echo "⚠ Android APK not found"
  fi

  if [[ -f "$AAB_PATH" ]]; then
    AAB_SIZE=$(stat -f%z "$AAB_PATH" 2>/dev/null || stat -c%s "$AAB_PATH" 2>/dev/null)
    AAB_SIZE_MB=$((AAB_SIZE / 1048576))
    echo "✓ Android AAB: $AAB_PATH (${AAB_SIZE_MB}MB)"
    echo "  SHA-256: $(shasum -a 256 "$AAB_PATH" | cut -d' ' -f1)"
  else
    echo "⚠ Android AAB not found"
  fi
fi

if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "all" ]]; then
  IOS_APP_PATH="build/ios/Release-iphoneos/Runner.app"
  if [[ -d "$IOS_APP_PATH" ]]; then
    IOS_SIZE=$(du -sh "$IOS_APP_PATH" | cut -f1)
    echo "✓ iOS App: $IOS_APP_PATH (${IOS_SIZE})"
  else
    echo "⚠ iOS app not found at $IOS_APP_PATH"
  fi
fi

echo ""
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
echo "=== Build complete in ${DURATION}s ==="
echo "Artifacts:"
echo "  Android APK: build/app/outputs/flutter-apk/app-release.apk"
echo "  Android AAB: build/app/outputs/bundle/release/app-release.aab"
echo "  iOS App:     build/ios/Release-iphoneos/Runner.app"
echo "  Debug info:  build/debug-info/"
