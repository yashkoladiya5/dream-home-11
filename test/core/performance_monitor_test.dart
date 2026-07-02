import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../lib/core/performance/performance_monitor.dart';

void main() {
  group('PerformanceMonitor', () {
    test('performanceMonitorProvider creates a PerformanceMonitor', () {
      TestWidgetsFlutterBinding.ensureInitialized();
      final container = ProviderContainer();
      addTearDown(() => container.dispose());

      final monitor = container.read(performanceMonitorProvider);
      expect(monitor, isA<PerformanceMonitor>());
    });

    test('performanceMetricsProvider returns async value', () {
      TestWidgetsFlutterBinding.ensureInitialized();
      final container = ProviderContainer();
      addTearDown(() => container.dispose());

      final asyncValue = container.read(performanceMetricsProvider);
      expect(asyncValue, isA<AsyncValue<PerformanceMetrics>>());
    });

    test('PerformanceMetrics has correct fields', () {
      final metrics = PerformanceMetrics(
        totalFrames: 100,
        jankyFrames: 5,
        averageFrameBuildTimeMs: 8.5,
        maxFrameBuildTimeMs: 32.0,
        jankPercentage: 5.0,
      );

      expect(metrics.totalFrames, 100);
      expect(metrics.jankyFrames, 5);
      expect(metrics.averageFrameBuildTimeMs, 8.5);
      expect(metrics.maxFrameBuildTimeMs, 32.0);
      expect(metrics.jankPercentage, 5.0);
    });

    test('PerformanceMonitor dispose does not throw', () {
      TestWidgetsFlutterBinding.ensureInitialized();
      final container = ProviderContainer();
      container.read(performanceMonitorProvider);
      expect(() => container.dispose(), returnsNormally);
    });
  });
}
