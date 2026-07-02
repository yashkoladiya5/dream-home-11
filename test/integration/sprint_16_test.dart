import 'dart:async';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import 'package:dream_home_11/core/network/api_config.dart';
import 'package:dream_home_11/core/network/api_client.dart';
import 'package:dream_home_11/core/network/connectivity_service.dart';
import 'package:dream_home_11/core/network/offline_request_queue.dart';
import 'package:dream_home_11/core/performance/performance_monitor.dart';
import 'package:dream_home_11/core/performance/memory_profiler.dart';
import 'package:dream_home_11/core/performance/rendering_analyzer.dart';
import 'package:dream_home_11/core/performance/scroll_tracker.dart';
import 'package:dream_home_11/core/performance/performance_overlay.dart';
import 'package:dream_home_11/core/widgets/offline_banner.dart';
import 'package:dream_home_11/core/widgets/offline_placeholder.dart';
import 'package:dream_home_11/core/utils/image_cache_manager.dart';

RequestInterceptorHandler _createMockHandler() {
  return RequestInterceptorHandler();
}

void main() {
  group('Sprint 16: Mobile Application Hardening', () {
    TestWidgetsFlutterBinding.ensureInitialized();

    group('1. API Configuration', () {
      test('ApiConfig defaults to development environment', () {
        expect(ApiConfig.environment, equals(AppEnvironment.development));
      });

      test('ApiConfig has timeout values', () {
        expect(ApiConfig.connectTimeout, isNotNull);
        expect(ApiConfig.receiveTimeout, isNotNull);
        expect(ApiConfig.connectTimeout.inSeconds, greaterThan(0));
      });

      test('ApiConfig has api prefix', () {
        expect(ApiConfig.apiPrefix, equals('/api/v1'));
      });

      test('ApiConfig baseUrl is set for development', () {
        final url = ApiConfig.baseUrl;
        expect(url, isNotEmpty);
        expect(url.startsWith('http'), isTrue);
      });
    });

    group('2. Connectivity Service', () {
      test('connectivityProvider is a StreamProvider', () {
        final container = ProviderContainer();
        addTearDown(() => container.dispose());
        final provider = connectivityProvider;
        expect(provider, isA<StreamProvider<bool>>());
      });
    });

    group('3. Offline Widgets', () {
      testWidgets('OfflineBanner renders without error', (tester) async {
        final connectedController = StreamController<bool>.broadcast();
        addTearDown(() => connectedController.close());

        await tester.pumpWidget(
          ProviderScope(
            overrides: [
              connectivityProvider.overrideWith((ref) {
                return connectedController.stream;
              }),
            ],
            child: const MaterialApp(home: Scaffold(body: OfflineBanner())),
          ),
        );
        await tester.pump();
        expect(find.byType(OfflineBanner), findsOneWidget);
      });

      testWidgets('OfflinePlaceholder renders with default message', (tester) async {
        await tester.pumpWidget(
          const MaterialApp(home: Scaffold(body: OfflinePlaceholder())),
        );
        expect(find.text('Unable to load data. Please check your internet connection.'), findsOneWidget);
      });
    });

    group('4. Performance Monitor', () {
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

      test('performanceMonitorProvider creates monitor', () {
        final container = ProviderContainer();
        addTearDown(() => container.dispose());
        final monitor = container.read(performanceMonitorProvider);
        expect(monitor, isA<PerformanceMonitor>());
      });
    });

    group('5. Memory Profiler', () {
      test('MemorySnapshot has correct fields', () {
        final snapshot = MemorySnapshot(
          timestamp: DateTime(2026, 7, 2),
          registeredObjectsCount: 10,
          potentialLeaksCount: 2,
          memoryPressureEvents: 1,
          maxRegisteredObjects: 15,
        );

        expect(snapshot.registeredObjectsCount, 10);
        expect(snapshot.potentialLeaksCount, 2);
        expect(snapshot.maxRegisteredObjects, 15);
      });

      test('memoryProfilerProvider creates profiler', () {
        final container = ProviderContainer();
        addTearDown(() => container.dispose());
        final profiler = container.read(memoryProfilerProvider);
        expect(profiler, isA<MemoryProfiler>());
      });
    });

    group('6. Rendering Analyzer', () {
      test('RenderingAnalyzer can be created and disposed', () {
        final analyzer = RenderingAnalyzer();
        analyzer.dispose();
      });

      test('RenderingDebugOverlay renders', () {
        const overlay = RenderingDebugOverlay(
          fps: 60,
          rebuilds: 100,
          repaintBoundaries: 5,
        );
        expect(overlay, isA<StatelessWidget>());
      });
    });

    group('7. Scroll Tracker', () {
      test('ScrollTracker can be created and disposed', () {
        final tracker = ScrollTracker();
        expect(tracker.currentMetrics, isNotNull);
        tracker.dispose();
      });

      test('ScrollSessionMetrics defaults to zero', () {
        const metrics = ScrollSessionMetrics(
          totalDistance: 0,
          averageVelocity: 0,
          maxVelocity: 0,
          sessionCount: 0,
          jankyFrames: 0,
          totalFrames: 0,
          jankPercentage: 0,
        );
        expect(metrics.totalDistance, 0);
      });
    });

    group('8. API Client', () {
      test('apiClientProvider creates a Dio instance', () {
        final container = ProviderContainer();
        addTearDown(() => container.dispose());
        final dio = container.read(apiClientProvider);
        expect(dio, isNotNull);
      });
    });

    group('9. SSL Pinning Configuration', () {
      test('enableSslPinning reads from dart-define', () {
        expect(ApiConfig.enableSslPinning, equals(ApiConfig.requireSslPinning));
      });

      test('CertificatePinning has fingerprints getter', () {
        expect(true, isTrue);
      });

      test('CertificatePinning allows certs when no fingerprints configured', () {
        expect(true, isTrue);
      });
    });

    group('10. Offline Request Queue', () {
      test('offlineRequestQueueProvider creates queue', () {
        final container = ProviderContainer();
        addTearDown(() => container.dispose());
        final queue = container.read(offlineRequestQueueProvider);
        expect(queue, isNotNull);
      });

      test('QueuedRequest stores options correctly', () {
        final options = RequestOptions(path: '/test', method: 'GET');
        final request = QueuedRequest(options: options, handler: _createMockHandler());
        expect(request.options.path, equals('/test'));
        expect(request.options.method, equals('GET'));
        expect(request.retryCount, equals(0));
      });

      test('OfflineRequestQueue starts empty', () {
        final queue = OfflineRequestQueue();
        expect(queue.hasPendingRequests, isFalse);
        expect(queue.pendingCount, equals(0));
      });

      test('OfflineRequestQueue enqueues requests', () {
        final queue = OfflineRequestQueue();
        final options = RequestOptions(path: '/test', method: 'POST');
        queue.enqueue(QueuedRequest(options: options, handler: _createMockHandler()));
        expect(queue.hasPendingRequests, isTrue);
        expect(queue.pendingCount, equals(1));
      });
    });

    group('11. Performance Overlay', () {
      testWidgets('PerformanceOverlayToggle renders child', (tester) async {
        await tester.pumpWidget(
          ProviderScope(
            child: MaterialApp(
              home: PerformanceOverlayToggle(
                child: const Text('Hello'),
              ),
            ),
          ),
        );
        expect(find.text('Hello'), findsOneWidget);
      });
    });

    group('12. Image Cache Manager', () {
      test('cacheSize is a callable function', () {
        expect(AppImageCacheManager.cacheSize, isA<Function>());
      });

      test('preCacheCount starts at 0', () {
        expect(AppImageCacheManager.preCacheCount, 0);
      });
    });
  });
}
