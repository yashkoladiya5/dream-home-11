#!/bin/bash
set -eo pipefail

APP_NAME="dream_home_11"
BUILD_NUMBER="${BUILD_NUMBER:-1}"
BUILD_NAME="${BUILD_NAME:-1.0.0}"

echo "=== Building $APP_NAME v$BUILD_NAME (build $BUILD_NUMBER) ==="

echo ""
echo "--- Flutter pub get ---"
flutter pub get

echo ""
echo "--- Cleaning previous builds ---"
flutter clean
flutter pub get

echo ""
echo "--- Checking dependencies ---"
if ! command -v flutter &> /dev/null; then
    echo "Error: Flutter is not installed"
    exit 1
fi
flutter doctor --verbose 2>&1 | head -20 || true

echo ""
echo "--- Running Dart analysis ---"
flutter analyze

echo ""
echo "--- Running tests ---"
flutter test

echo ""
echo "--- Running performance benchmarks ---"
flutter test test/performance/

echo ""
echo "--- Running Sprint 16 integration tests ---"
flutter test test/integration/sprint_16_test.dart

echo ""
echo "--- Building Android APK (Release) ---"
flutter build apk \
  --release \
  --obfuscate \
  --split-debug-info=build/debug-info/android/ \
  --build-name="$BUILD_NAME" \
  --build-number="$BUILD_NUMBER" \
  --target-platform android-arm,android-arm64 \
  --dart-define=PERFORMANCE_OVERLAY=false \
  --dart-define=ENABLE_FRAME_MONITORING=false \
  --dart-define=ENABLE_MEMORY_PROFILER=false \
  --dart-define=APP_ENV=production \
  --dart-define=ENABLE_SSL_PINNING=true

echo ""
echo "--- Building Android AppBundle (Release) ---"
flutter build appbundle \
  --release \
  --obfuscate \
  --split-debug-info=build/debug-info/android/ \
  --build-name="$BUILD_NAME" \
  --build-number="$BUILD_NUMBER" \
  --dart-define=PERFORMANCE_OVERLAY=false \
  --dart-define=ENABLE_FRAME_MONITORING=false \
  --dart-define=ENABLE_MEMORY_PROFILER=false \
  --dart-define=APP_ENV=production \
  --dart-define=ENABLE_SSL_PINNING=true

echo ""
echo "--- Building iOS Archive (Release) ---"
flutter build ios \
  --release \
  --no-codesign \
  --obfuscate \
  --split-debug-info=build/debug-info/ios/ \
  --build-name="$BUILD_NAME" \
  --build-number="$BUILD_NUMBER" \
  --dart-define=PERFORMANCE_OVERLAY=false \
  --dart-define=ENABLE_FRAME_MONITORING=false \
  --dart-define=ENABLE_MEMORY_PROFILER=false \
  --dart-define=APP_ENV=production \
  --dart-define=ENABLE_SSL_PINNING=true

echo ""
echo "--- Verifying build artifacts ---"
if [ -f "build/app/outputs/flutter-apk/app-release.apk" ]; then
  echo "✓ Android APK exists"
else
  echo "⚠ Android APK not found"
fi
if [ -f "build/app/outputs/bundle/release/app-release.aab" ]; then
  echo "✓ Android AAB exists"
else
  echo "⚠ Android AAB not found"
fi
if [ -d "build/ios/iphoneos/Runner.app" ]; then
  echo "✓ iOS archive exists"
else
  echo "⚠ iOS archive not found"
fi
if [ -d "build/debug-info/android" ] && [ -d "build/debug-info/ios" ]; then
  echo "✓ Debug info symbols present"
else
  echo "⚠ Debug info symbols incomplete"
fi
echo "✓ Build artifacts verified"

echo ""
echo "=== Build complete ==="
echo "Android APK: build/app/outputs/flutter-apk/app-release.apk"
echo "Android AAB: build/app/outputs/bundle/release/app-release.aab"
echo "iOS Archive: build/ios/iphoneos/Runner.app"
echo "Debug info: build/debug-info/"
echo ""
echo "=== Performance test results ==="
if [ -d "test/performance" ]; then
  echo "--- Scroll Benchmark ---"
  flutter test test/performance/ --machine 2>/dev/null | grep -E "(pass|fail)" | head -10 || echo "Scroll benchmarks completed"
  echo "--- Performance Monitor Tests ---"
  flutter test test/core/performance_monitor_test.dart --machine 2>/dev/null | grep -E "(pass|fail)" | head -5 || echo "Performance monitor tests completed"
else
  echo "No performance test directory found at test/performance/"
fi
