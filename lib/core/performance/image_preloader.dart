import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/painting.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../network/api_config.dart';
import '../utils/cdn_manifest.dart';

final imagePreloaderProvider = Provider<ImagePreloader>((ref) {
  final manifestAsync = ref.watch(manifestProvider);
  return ImagePreloader(manifestAsync.valueOrNull);
});

class ImagePreloader {
  final CdnManifest? _manifest;

  ImagePreloader([this._manifest]);

  int _pendingCount = 0;
  int get pendingCount => _pendingCount;

  static const _commonAssetKeys = [
    'logo_horizontal',
    'logo_square',
    'brand_mark',
    'loading_placeholder',
    'avatar_placeholder',
    'error_illustration',
    'empty_state_illustration',
    'no_network_illustration',
    'banner_home_small',
    'banner_home_medium',
    'banner_contest_small',
    'banner_contest_medium',
  ];

  Future<void> preCacheCommonImages() async {
    final manifest = _manifest;
    if (manifest == null) {
      if (!kReleaseMode) {
        debugPrint('[ImagePreloader] Manifest not loaded — skipping pre-cache');
      }
      return;
    }

    final cdnBase = ApiConfig.cdnBaseUrl;
    if (cdnBase.isEmpty) {
      if (!kReleaseMode) {
        debugPrint('[ImagePreloader] CDN not configured — skipping pre-cache');
      }
      return;
    }

    final urls = <String>[];
    for (final key in _commonAssetKeys) {
      if (manifest.hasAsset(key)) {
        urls.add(manifest.assetUrl(key));
      }
    }

    _pendingCount = urls.length;
    if (!kReleaseMode) {
      debugPrint('[ImagePreloader] Pre-caching $_pendingCount images');
    }

    await Future.wait(urls.map(preCacheImage));
    _pendingCount = 0;

    if (!kReleaseMode) {
      debugPrint('[ImagePreloader] Pre-cache complete');
    }
  }

  Future<void> preCacheImage(String url) async {
    try {
      final completer = Completer<void>();
      final image = NetworkImage(url);
      final stream = image.resolve(ImageConfiguration.empty);
      final listener = ImageStreamListener(
        (ImageInfo info, bool synchronousCall) {
          completer.complete();
        },
        onError: (Object exception, StackTrace? stackTrace) {
          completer.completeError(exception, stackTrace);
        },
      );
      stream.addListener(listener);
      await completer.future;
      stream.removeListener(listener);
    } catch (e) {
      if (!kReleaseMode) {
        debugPrint('[ImagePreloader] Failed to pre-cache: $url — $e');
      }
    }
  }

  Future<void> preCacheUrls(List<String> urls) async {
    _pendingCount = urls.length;
    await Future.wait(urls.map(preCacheImage));
    _pendingCount = 0;
  }
}
