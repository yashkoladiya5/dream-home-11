import 'package:flutter/foundation.dart';

class AppPerformanceConfig {
  AppPerformanceConfig._();

  /// Whether the performance debug overlay is shown
  /// Controlled by --dart-define=PERFORMANCE_OVERLAY=true|false
  /// Defaults to kDebugMode (true in debug, false in release)
  static bool get showPerformanceOverlay {
    if (kReleaseMode) return false;
    const env = String.fromEnvironment('PERFORMANCE_OVERLAY');
    if (env.isNotEmpty) return env == 'true';
    return kDebugMode;
  }

  /// Whether frame build/paint monitoring is enabled
  /// Controlled by --dart-define=ENABLE_FRAME_MONITORING=true|false
  /// Defaults to true in debug builds
  static bool get enableFrameMonitoring {
    if (kReleaseMode) return false;
    const env = String.fromEnvironment('ENABLE_FRAME_MONITORING');
    if (env.isNotEmpty) return env == 'true';
    return true;
  }

  /// Whether memory profiling is enabled
  /// Controlled by --dart-define=ENABLE_MEMORY_PROFILER=true|false
  /// Defaults to true in debug builds
  static bool get enableMemoryProfiler {
    if (kReleaseMode) return false;
    const env = String.fromEnvironment('ENABLE_MEMORY_PROFILER');
    if (env.isNotEmpty) return env == 'true';
    return true;
  }

  /// Whether scroll tracking is enabled
  /// No dart-define yet — defaults to debug-only
  static bool get enableScrollTracking => !kReleaseMode;

  /// Whether rendering analysis is enabled
  /// No dart-define yet — defaults to debug-only
  static bool get enableRenderingAnalysis => showPerformanceOverlay;
}
