import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dream_home_11/core/performance/rendering_analyzer.dart';

void main() {
  group('RenderingAnalyzer', () {
    late RenderingAnalyzer analyzer;

    setUp(() {
      analyzer = RenderingAnalyzer();
    });

    tearDown(() {
      analyzer.dispose();
    });

    test('initial values are zero', () {
      expect(analyzer.currentFps, equals(0));
      expect(analyzer.totalRebuilds, equals(0));
      expect(analyzer.lastSecondRebuilds, equals(0));
      expect(analyzer.repaintBoundaryCount, equals(0));
      expect(analyzer.overdrawVisible, isFalse);
    });

    test('recordRebuild increments counter', () {
      analyzer.recordRebuild();
      expect(analyzer.totalRebuilds, equals(1));
      analyzer.recordRebuild();
      analyzer.recordRebuild();
      expect(analyzer.totalRebuilds, equals(3));
    });

    test('toggleOverdrawVisualization flips flag', () {
      expect(analyzer.overdrawVisible, isFalse);
      analyzer.toggleOverdrawVisualization();
      expect(analyzer.overdrawVisible, isTrue);
      analyzer.toggleOverdrawVisualization();
      expect(analyzer.overdrawVisible, isFalse);
    });

    test('onFrame increments frame count', () {
      analyzer.onFrame(const Duration(milliseconds: 16));
      analyzer.onFrame(const Duration(milliseconds: 32));
      analyzer.onFrame(const Duration(milliseconds: 48));
      expect(analyzer.currentFps, equals(0));
    });

    test('fpsStream provides stream', () {
      expect(analyzer.fpsStream, isNotNull);
      expect(analyzer.fpsStream.isBroadcast, isTrue);
    });
  });

  group('RenderingDebugOverlay', () {
    testWidgets('renders without error with high fps', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: const RenderingDebugOverlay(
              fps: 60,
              rebuilds: 100,
              repaintBoundaries: 5,
            ),
          ),
        ),
      );
      expect(find.text('60 FPS'), findsOneWidget);
    });

    testWidgets('renders without error with low fps', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: const RenderingDebugOverlay(
              fps: 15,
              rebuilds: 200,
              repaintBoundaries: 10,
            ),
          ),
        ),
      );
      expect(find.text('15 FPS'), findsOneWidget);
    });
  });

  group('Providers', () {
    test('renderingAnalyzerProvider creates analyzer', () {
      final container = ProviderContainer();
      addTearDown(() {
        final a = container.read(renderingAnalyzerProvider);
        a.dispose();
        container.dispose();
      });

      final analyzer = container.read(renderingAnalyzerProvider);
      expect(analyzer, isA<RenderingAnalyzer>());
    });

    testWidgets('showRenderingOverlayProvider defaults to false', (tester) async {
      final container = ProviderContainer();
      addTearDown(() => container.dispose());

      expect(container.read(showRenderingOverlayProvider), isFalse);
    });
  });
}
