import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final imagePreloaderProvider = Provider<ImagePreloader>((ref) {
  return ImagePreloader();
});

class ImagePreloader {
  ImagePreloader();

  int get pendingCount => 0;

  Future<void> preCacheCommonImages() async {
    if (!kReleaseMode) {
      debugPrint('[ImagePreloader] CDN URLs not configured — skipping pre-cache');
    }
  }
}
