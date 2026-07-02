#!/bin/bash
set -e

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
echo "--- Running Dart analysis ---"
flutter analyze

echo ""
echo "--- Running tests ---"
flutter test

echo ""
echo "--- Running performance benchmarks ---"
flutter test test/performance/

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
  --dart-define=ENABLE_MEMORY_PROFILER=false

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
  --dart-define=ENABLE_MEMORY_PROFILER=false

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
  --dart-define=ENABLE_MEMORY_PROFILER=false

echo ""
echo "=== Build complete ==="
echo "Android APK: build/app/outputs/flutter-apk/app-release.apk"
echo "Android AAB: build/app/outputs/bundle/release/app-release.aab"
echo "iOS Archive: build/ios/iphoneos/Runner.app"
echo "Debug info: build/debug-info/"
echo ""
echo "=== Performance test results ==="
if [ -d "test/performance" ]; then
  flutter test test/performance/ --machine 2>/dev/null | tail -20 || echo "Performance tests completed (see full output above)"
else
  echo "No performance test directory found at test/performance/"
fi
