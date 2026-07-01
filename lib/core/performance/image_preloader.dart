import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../utils/image_cache_manager.dart';

final imagePreloaderProvider = Provider<ImagePreloader>((ref) {
  return ImagePreloader();
});

class ImagePreloader {
  ImagePreloader();

  static const _commonImageUrls = <String>[];

  Future<void> preCacheCommonImages() async {
    if (_commonImageUrls.isEmpty) return;
    if (!kReleaseMode) {
      debugPrint('[ImagePreloader] Pre-caching ${_commonImageUrls.length} images');
    }
    await AppImageCacheManager.preCacheUrls(_commonImageUrls);
  }
}
