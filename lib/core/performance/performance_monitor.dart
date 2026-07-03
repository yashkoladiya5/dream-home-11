import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'app_performance_config.dart';

class PerformanceMetrics {
  final int totalFrames;
  final int jankyFrames;
  final double averageFrameBuildTimeMs;
  final double maxFrameBuildTimeMs;
  final double jankPercentage;

  const PerformanceMetrics({
    required this.totalFrames,
    required this.jankyFrames,
    required this.averageFrameBuildTimeMs,
    required this.maxFrameBuildTimeMs,
    required this.jankPercentage,
  });
}

final performanceMonitorProvider = Provider<PerformanceMonitor>((ref) {
  final monitor = PerformanceMonitor();
  ref.onDispose(() => monitor.dispose());
  return monitor;
});

final performanceMetricsProvider = StreamProvider<PerformanceMetrics>((ref) {
  final monitor = ref.watch(performanceMonitorProvider);
  return monitor.metricsStream;
});

class PerformanceMonitor with WidgetsBindingObserver {
  final _frameTimings = <Duration>[];
  final _paintTimings = <Duration>[];
  final _controller = StreamController<PerformanceMetrics>.broadcast();
  Timer? _reportTimer;

  static const _jankThreshold = Duration(milliseconds: 16);
  static const _reportInterval = Duration(seconds: 10);

  double _maxBuildMs = 0;
  double _maxPaintMs = 0;

  Stream<PerformanceMetrics> get metricsStream => _controller.stream;

  PerformanceMonitor() {
    WidgetsBinding.instance.addObserver(this);
    if (AppPerformanceConfig.enableFrameMonitoring) {
      SchedulerBinding.instance.addTimingsCallback(_onTimings);
      _reportTimer = Timer.periodic(_reportInterval, (_) => _report());
    }
  }

  void _onTimings(List<FrameTiming> timings) {
    for (final timing in timings) {
      final buildDuration = timing.buildDuration;
      final paintDuration = timing.rasterDuration;
      _frameTimings.add(buildDuration);
      _paintTimings.add(paintDuration);

      final buildMs = buildDuration.inMicroseconds / 1000.0;
      if (buildMs > _maxBuildMs) _maxBuildMs = buildMs;

      final paintMs = paintDuration.inMicroseconds / 1000.0;
      if (paintMs > _maxPaintMs) _maxPaintMs = paintMs;
    }
    if (_frameTimings.length > 1000) {
      _frameTimings.removeRange(0, _frameTimings.length - 1000);
    }
    if (_paintTimings.length > 1000) {
      _paintTimings.removeRange(0, _paintTimings.length - 1000);
    }
  }

  void _report() {
    if (_frameTimings.isEmpty) return;

    final totalMs = _frameTimings.map((d) => d.inMicroseconds / 1000.0).toList();
    final paintMs = _paintTimings.map((d) => d.inMicroseconds / 1000.0).toList();
    final total = totalMs.length;
    final janky = totalMs.where((ms) => ms > _jankThreshold.inMilliseconds).length;
    final avg = totalMs.isEmpty ? 0.0 : (totalMs.reduce((a, b) => a + b) / total);
    final maxMs = totalMs.isEmpty ? 0.0 : totalMs.reduce((a, b) => a > b ? a : b);
    final avgPaint = paintMs.isEmpty ? 0.0 : (paintMs.reduce((a, b) => a + b) / paintMs.length);
    final maxP = paintMs.isEmpty ? 0.0 : paintMs.reduce((a, b) => a > b ? a : b);
    final jankPct = total > 0 ? double.parse(((janky / total) * 100).toStringAsFixed(1)) : 0.0;

    if (!kReleaseMode) {
      debugPrint('[Performance] Build — Frames: $total, Jank: $janky ($jankPct%), Avg: ${avg.toStringAsFixed(1)}ms, Max: ${maxMs.toStringAsFixed(1)}ms');
      if (avgPaint > 4) {
        debugPrint('[Performance] Paint — Avg: ${avgPaint.toStringAsFixed(1)}ms, Max: ${maxP.toStringAsFixed(1)}ms');
      }
    }

    _controller.add(PerformanceMetrics(
      totalFrames: total,
      jankyFrames: janky,
      averageFrameBuildTimeMs: double.parse(avg.toStringAsFixed(1)),
      maxFrameBuildTimeMs: double.parse(maxMs.toStringAsFixed(1)),
      jankPercentage: jankPct,
    ));

    _frameTimings.clear();
    _paintTimings.clear();
    _maxBuildMs = 0;
    _maxPaintMs = 0;
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused || state == AppLifecycleState.inactive) {
      _frameTimings.clear();
      _paintTimings.clear();
      _reportTimer?.cancel();
    } else if (state == AppLifecycleState.resumed && !kReleaseMode) {
      _reportTimer = Timer.periodic(_reportInterval, (_) => _report());
    }
  }

  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _reportTimer?.cancel();
    _controller.close();
  }
}
