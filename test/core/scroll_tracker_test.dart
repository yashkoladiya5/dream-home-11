import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dream_home_11/core/performance/scroll_tracker.dart';

void main() {
  group('ScrollSessionMetrics', () {
    test('creates with default values', () {
      final metrics = const ScrollSessionMetrics(
        totalDistance: 100,
        averageVelocity: 50,
        maxVelocity: 200,
        sessionCount: 3,
        jankyFrames: 2,
        totalFrames: 100,
        jankPercentage: 2.0,
      );

      expect(metrics.totalDistance, equals(100));
      expect(metrics.averageVelocity, equals(50));
      expect(metrics.maxVelocity, equals(200));
      expect(metrics.sessionCount, equals(3));
      expect(metrics.jankyFrames, equals(2));
      expect(metrics.totalFrames, equals(100));
      expect(metrics.jankPercentage, equals(2.0));
    });

    test('copyWith overrides specified fields', () {
      const metrics = ScrollSessionMetrics(
        totalDistance: 100,
        averageVelocity: 50,
        maxVelocity: 200,
        sessionCount: 3,
        jankyFrames: 2,
        totalFrames: 100,
        jankPercentage: 2.0,
      );

      final updated = metrics.copyWith(totalDistance: 200, sessionCount: 5);
      expect(updated.totalDistance, equals(200));
      expect(updated.sessionCount, equals(5));
      expect(updated.averageVelocity, equals(50));
      expect(updated.maxVelocity, equals(200));
    });
  });

  group('ScrollTracker', () {
    late ScrollTracker tracker;

    setUp(() {
      tracker = ScrollTracker();
    });

    tearDown(() {
      tracker.dispose();
    });

    test('initial metrics are zero', () {
      final metrics = tracker.currentMetrics;
      expect(metrics.totalDistance, equals(0));
      expect(metrics.sessionCount, equals(0));
      expect(metrics.jankyFrames, equals(0));
    });

    test('trackScrollController returns the same controller', () {
      final controller = ScrollController();
      final tracked = tracker.trackScrollController(controller);
      expect(tracked, same(controller));
      controller.dispose();
    });

    test('metricsStream is broadcast', () {
      expect(tracker.metricsStream.isBroadcast, isTrue);
    });
  });

  group('TrackedScrollConfiguration', () {
    testWidgets('can wrap a widget', (tester) async {
      final tracker = ScrollTracker();
      addTearDown(() => tracker.dispose());

      await tester.pumpWidget(
        TrackedScrollConfiguration(
          tracker: tracker,
          child: const SizedBox(width: 100, height: 100),
        ),
      );

      expect(find.byType(SizedBox), findsOneWidget);
    });
  });

  group('Providers', () {
    test('scrollTrackerProvider creates tracker', () {
      final container = ProviderContainer();
      addTearDown(() => container.dispose());

      final tracker = container.read(scrollTrackerProvider);
      expect(tracker, isA<ScrollTracker>());
    });
  });
}
