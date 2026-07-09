import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class RenderingAnalyzer {
  RenderingAnalyzer() {
    if (!kReleaseMode) {
      _fpsTimer = Timer.periodic(const Duration(seconds: 1), _updateFps);
    }
  }

  final List<Duration> _frameDurations = [];
  int _frameCount = 0;
  int _totalRebuilds = 0;
  int _lastSecondRebuilds = 0;
  int _repaintBoundaryCount = 0;
  double _currentFps = 0;
  bool _overdrawVisible = false;

  Timer? _fpsTimer;
  final _fpsController = StreamController<double>.broadcast();
  final _rebuildController = StreamController<int>.broadcast();

  double get currentFps => _currentFps;
  int get totalRebuilds => _totalRebuilds;
  int get lastSecondRebuilds => _lastSecondRebuilds;
  int get repaintBoundaryCount => _repaintBoundaryCount;
  bool get overdrawVisible => _overdrawVisible;

  Stream<double> get fpsStream => _fpsController.stream;

  void onFrame(Duration timestamp) {
    if (kReleaseMode) return;
    _frameCount++;
    _frameDurations.add(timestamp);
    if (_frameDurations.length > 100) {
      _frameDurations.removeAt(0);
    }
  }

  void _updateFps(Timer timer) {
    if (kReleaseMode) return;
    _currentFps = _frameCount.toDouble();
    _lastSecondRebuilds = _frameCount;
    _frameCount = 0;
    _fpsController.add(_currentFps);
  }

  void recordRebuild() {
    if (kReleaseMode) return;
    _totalRebuilds++;
  }

  void toggleOverdrawVisualization() {
    if (kReleaseMode) return;
    _overdrawVisible = !_overdrawVisible;
    debugPaintSizeEnabled = _overdrawVisible;
    debugPaintBaselinesEnabled = _overdrawVisible;
    debugRepaintRainbowEnabled = _overdrawVisible;
    debugPaintLayerBordersEnabled = _overdrawVisible;
  }

  void estimateRepaintBoundaries() {
    if (kReleaseMode) return;
    final root = RendererBinding.instance.renderViews.first;
    _repaintBoundaryCount = _countRepaintBoundaries(root);
  }

  int _countRepaintBoundaries(RenderObject object) {
    int count = object.isRepaintBoundary ? 1 : 0;
    object.visitChildren((child) {
      count += _countRepaintBoundaries(child);
    });
    return count;
  }

  void dispose() {
    _fpsTimer?.cancel();
    _fpsController.close();
    _rebuildController.close();
    if (_overdrawVisible) {
      debugPaintSizeEnabled = false;
      debugPaintBaselinesEnabled = false;
      debugRepaintRainbowEnabled = false;
      debugPaintLayerBordersEnabled = false;
    }
  }
}

class RenderingDebugOverlay extends StatelessWidget {
  final double fps;
  final int rebuilds;
  final int repaintBoundaries;

  const RenderingDebugOverlay({
    super.key,
    required this.fps,
    required this.rebuilds,
    required this.repaintBoundaries,
  });

  @override
  Widget build(BuildContext context) {
    if (kReleaseMode) return const SizedBox.shrink();

    final fpsColor = fps > 55
        ? Colors.green
        : fps > 30
            ? Colors.amber
            : Colors.red;

    return Container(
      width: 60,
      height: 48,
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: Colors.black87,
        borderRadius: BorderRadius.circular(4),
      ),
      child: FittedBox(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '${fps.toStringAsFixed(0)} FPS',
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.bold,
                color: fpsColor,
              ),
            ),
            Text(
              'R: $rebuilds',
              style: const TextStyle(fontSize: 8, color: Colors.white70),
            ),
            Text(
              'P: $repaintBoundaries',
              style: const TextStyle(fontSize: 8, color: Colors.white70),
            ),
          ],
        ),
      ),
    );
  }
}

final renderingAnalyzerProvider = Provider<RenderingAnalyzer>((ref) {
  final analyzer = RenderingAnalyzer();
  ref.onDispose(() => analyzer.dispose());
  return analyzer;
});

final fpsProvider = StreamProvider<double>((ref) {
  final analyzer = ref.watch(renderingAnalyzerProvider);
  return analyzer.fpsStream;
});

final showRenderingOverlayProvider = StateProvider<bool>((ref) => false);
