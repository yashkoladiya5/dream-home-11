import 'dart:math' as math;
import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:dream_home_11/core/utils/image_cache_manager.dart';

class ImageResizeConfig {
  final int? maxWidth;
  final int? maxHeight;
  final int? memCacheWidth;
  final int? memCacheHeight;

  ImageResizeConfig({
    this.maxWidth = 1080,
    this.maxHeight = 1080,
    int? originalWidth,
    int? originalHeight,
  })  : memCacheWidth = originalWidth != null && maxWidth != null
            ? math.min(originalWidth, maxWidth) ~/ 2
            : null,
        memCacheHeight = originalHeight != null && maxHeight != null
            ? math.min(originalHeight, maxHeight) ~/ 2
            : null;
}

class ImageUrlBuilder {
  ImageUrlBuilder._();

  static String resizeUrl(
    String url, {
    required int width,
    required int height,
  }) {
    final separator = url.contains('?') ? '&' : '?';
    return '$url${separator}w=$width&h=$height';
  }
}

Future<void> preCacheDashboardImages() async {
  final urls = <String>[];
  await AppImageCacheManager.preCacheUrls(urls);
}

({int? memCacheWidth, int? memCacheHeight}) cacheImageDimensions() {
  final platform = WidgetsBinding.instance.platformDispatcher;
  final view = platform.views.first;
  final size = view.physicalSize;
  final dpr = view.devicePixelRatio;
  final effectiveDpr = dpr > 2.0 ? 2.0 : dpr;
  return (
    memCacheWidth: (size.width / dpr * effectiveDpr).round(),
    memCacheHeight: (size.height / dpr * effectiveDpr).round(),
  );
}

Future<void> configureImageCache() async {
    if (kReleaseMode) return;
    final dims = cacheImageDimensions();
    debugPrint('[ImageOptimizer] Cache configured: ${dims.memCacheWidth}x${dims.memCacheHeight}');
  }
