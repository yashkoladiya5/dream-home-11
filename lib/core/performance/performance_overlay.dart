import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/foundation.dart';
import '../performance/rendering_analyzer.dart';

class PerformanceOverlayToggle extends ConsumerStatefulWidget {
  final Widget child;

  const PerformanceOverlayToggle({super.key, required this.child});

  @override
  ConsumerState<PerformanceOverlayToggle> createState() => _PerformanceOverlayToggleState();
}

class _PerformanceOverlayToggleState extends ConsumerState<PerformanceOverlayToggle> {
  bool _visible = false;

  @override
  Widget build(BuildContext context) {
    final fps = ref.watch(renderingAnalyzerProvider.select((a) => a.currentFps));
    final rebuilds = ref.watch(renderingAnalyzerProvider.select((a) => a.totalRebuilds));
    final repaintCount = ref.watch(renderingAnalyzerProvider.select((a) => a.repaintBoundaryCount));

    return GestureDetector(
      onLongPress: () {
        setState(() => _visible = !_visible);
      },
      child: Stack(
        children: [
          widget.child,
          if (kDebugMode && _visible)
            Positioned(
              top: 4,
              right: 4,
              child: RenderingDebugOverlay(
                fps: fps,
                rebuilds: rebuilds,
                repaintBoundaries: repaintCount,
              ),
            ),
        ],
      ),
    );
  }
}
