import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:dream_home_11/core/performance/scroll_tracker.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  Future<void> pumpTestScreen(
    WidgetTester tester,
    ScrollController controller,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: ListView.builder(
            controller: controller,
            itemCount: 200,
            itemExtent: 100,
            itemBuilder: (context, index) {
              return Container(
                height: 100,
                color: index.isEven ? Colors.blue : Colors.red,
                child: Text('Item $index'),
              );
            },
          ),
        ),
      ),
    );
    await tester.pump();
  }

  group('Scroll Benchmark', () {
    testWidgets('measures frames per scroll drag', (tester) async {
      final controller = ScrollController();

      await pumpTestScreen(tester, controller);

      final timings = <FrameTiming>[];
      SchedulerBinding.instance.addTimingsCallback((newTimings) {
        timings.addAll(newTimings);
      });

      await tester.drag(
        find.byType(ListView),
        const Offset(0, -500),
      );
      await tester.pump();

      final frameCount = timings.length;
      final totalBuildTimeMs = timings.fold<double>(
        0,
        (sum, t) => sum + t.buildDuration.inMicroseconds / 1000.0,
      );
      final avgBuildTimeMs = frameCount > 0 ? totalBuildTimeMs / frameCount : 0.0;
      final jankyFrames = timings.where(
        (t) => t.buildDuration.inMilliseconds > 16,
      ).length;

      debugPrint(
        '[Benchmark] Dragged 500px: '
        '${frameCount} frames, '
        'avg build ${avgBuildTimeMs.toStringAsFixed(1)}ms, '
        '${jankyFrames} janky frames',
      );

      controller.dispose();
    }, timeout: const Timeout(Duration(seconds: 30)));

    testWidgets('TrackedScrollConfiguration integrates with ScrollTracker',
        (tester) async {
      final tracker = ScrollTracker();
      addTearDown(() => tracker.dispose());

      await tester.pumpWidget(
        MaterialApp(
          home: TrackedScrollConfiguration(
            tracker: tracker,
            child: const SizedBox(width: 100, height: 100),
          ),
        ),
      );

      final found =
          TrackedScrollConfiguration.of(tester.element(find.byType(SizedBox)));
      expect(found, isNotNull);
      expect(found!.tracker, same(tracker));
    });
  });
}
