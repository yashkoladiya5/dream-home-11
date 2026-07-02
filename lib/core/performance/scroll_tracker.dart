import 'dart:async';
import 'dart:math';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class ScrollSessionMetrics {
  final double totalDistance;
  final double averageVelocity;
  final double maxVelocity;
  final int sessionCount;
  final int jankyFrames;
  final int totalFrames;
  final double jankPercentage;

  const ScrollSessionMetrics({
    required this.totalDistance,
    required this.averageVelocity,
    required this.maxVelocity,
    required this.sessionCount,
    required this.jankyFrames,
    required this.totalFrames,
    required this.jankPercentage,
  });

  ScrollSessionMetrics copyWith({
    double? totalDistance,
    double? averageVelocity,
    double? maxVelocity,
    int? sessionCount,
    int? jankyFrames,
    int? totalFrames,
    double? jankPercentage,
  }) {
    return ScrollSessionMetrics(
      totalDistance: totalDistance ?? this.totalDistance,
      averageVelocity: averageVelocity ?? this.averageVelocity,
      maxVelocity: maxVelocity ?? this.maxVelocity,
      sessionCount: sessionCount ?? this.sessionCount,
      jankyFrames: jankyFrames ?? this.jankyFrames,
      totalFrames: totalFrames ?? this.totalFrames,
      jankPercentage: jankPercentage ?? this.jankPercentage,
    );
  }
}

class ScrollTracker {
  bool _isTracking = false;
  int _sessionCount = 0;
  double _totalDistance = 0;
  double _currentSessionDistance = 0;
  double _currentSessionMaxVelocity = 0;
  double _sessionTotalVelocity = 0;
  int _sessionVelocitySamples = 0;
  int _jankyFrames = 0;
  int _totalFrames = 0;

  final _metricsController = StreamController<ScrollSessionMetrics>.broadcast();
  ScrollSessionMetrics _lastMetrics = const ScrollSessionMetrics(
    totalDistance: 0,
    averageVelocity: 0,
    maxVelocity: 0,
    sessionCount: 0,
    jankyFrames: 0,
    totalFrames: 0,
    jankPercentage: 0,
  );

  Stream<ScrollSessionMetrics> get metricsStream => _metricsController.stream;
  ScrollSessionMetrics get currentMetrics => _lastMetrics;

  final Set<ScrollController> _trackedControllers = {};

  ScrollController trackScrollController(ScrollController controller) {
    if (kReleaseMode) return controller;

    bool scrollNotifierAttached = false;
    _trackedControllers.add(controller);

    controller.addListener(() {
      if (!controller.hasClients) return;

      if (!scrollNotifierAttached) {
        scrollNotifierAttached = true;
        controller.position.isScrollingNotifier.addListener(() {
          if (controller.position.isScrollingNotifier.value) {
            _onScrollStart();
          } else {
            _onScrollEnd();
          }
        });
      }

      _onScroll(controller);
    });

    return controller;
  }

  double _lastPixels = 0;

  void _onScroll(ScrollController controller) {
    if (!_isTracking || !controller.hasClients) return;

    final position = controller.position;
    final pixels = position.pixels;
    final delta = (pixels - _lastPixels).abs();

    _currentSessionDistance += delta;
    _currentSessionMaxVelocity = max(_currentSessionMaxVelocity, delta / 0.016);
    _sessionTotalVelocity += delta / 0.016;
    _sessionVelocitySamples++;
    _totalFrames++;
    _lastPixels = pixels;
  }

  void _onScrollStart() {
    _isTracking = true;
    _currentSessionDistance = 0;
    _currentSessionMaxVelocity = 0;
    _sessionTotalVelocity = 0;
    _sessionVelocitySamples = 0;
  }

  void _onScrollEnd() {
    if (!_isTracking) return;
    _isTracking = false;
    _sessionCount++;

    _totalDistance += _currentSessionDistance;

    final avgVelocity = _sessionVelocitySamples > 0
        ? _sessionTotalVelocity / _sessionVelocitySamples
        : 0.0;

    final jankPercentage = _totalFrames > 0
        ? (_jankyFrames / _totalFrames) * 100
        : 0.0;

    _lastMetrics = ScrollSessionMetrics(
      totalDistance: _totalDistance,
      averageVelocity: avgVelocity,
      maxVelocity: _currentSessionMaxVelocity,
      sessionCount: _sessionCount,
      jankyFrames: _jankyFrames,
      totalFrames: _totalFrames,
      jankPercentage: jankPercentage,
    );

    _metricsController.add(_lastMetrics);
  }

  void recordJankyFrame() {
    if (!_isTracking) return;
    _jankyFrames++;
  }

  void dispose() {
    _metricsController.close();
  }
}

class TrackedScrollConfiguration extends InheritedWidget {
  final ScrollTracker tracker;

  const TrackedScrollConfiguration({
    super.key,
    required this.tracker,
    required super.child,
  });

  static TrackedScrollConfiguration? of(BuildContext context) {
    return context.dependOnInheritedWidgetOfExactType<TrackedScrollConfiguration>();
  }

  @override
  bool updateShouldNotify(TrackedScrollConfiguration oldWidget) {
    return tracker != oldWidget.tracker;
  }
}

final scrollTrackerProvider = Provider<ScrollTracker>((ref) {
  final tracker = ScrollTracker();
  ref.onDispose(() => tracker.dispose());
  return tracker;
});

final scrollMetricsProvider = StreamProvider<ScrollSessionMetrics>((ref) {
  final tracker = ref.watch(scrollTrackerProvider);
  return tracker.metricsStream;
});
