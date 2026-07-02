import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../utils/image_cache_manager.dart';

final imagePreloaderProvider = Provider<ImagePreloader>((ref) {
  return ImagePreloader();
});

class ImagePreloader {
  ImagePreloader();

  static const _commonImageUrls = <String>[
    // Production CDN images - update these when CDN is configured
    // 'https://cdn.dreamhome11.com/assets/logo.png',
    // 'https://cdn.dreamhome11.com/assets/splash_bg.jpg',
    // 'https://cdn.dreamhome11.com/assets/empty_state.png',
    // 'https://cdn.dreamhome11.com/assets/avatar_placeholder.png',
  ];

  int get pendingCount => _commonImageUrls.length;

  Future<void> preCacheCommonImages() async {
    if (_commonImageUrls.isEmpty) {
      if (!kReleaseMode) {
        debugPrint('[ImagePreloader] No URLs configured for pre-caching');
      }
      return;
    }
    if (!kReleaseMode) {
      debugPrint('[ImagePreloader] Pre-caching ${_commonImageUrls.length} images');
    }
    final stopwatch = Stopwatch()..start();
    await AppImageCacheManager.preCacheUrls(_commonImageUrls);
    stopwatch.stop();
    if (!kReleaseMode) {
      debugPrint('[ImagePreloader] Pre-cached ${_commonImageUrls.length} images in ${stopwatch.elapsedMilliseconds}ms');
    }
  }
}
