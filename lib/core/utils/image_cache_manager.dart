import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_cache_manager/flutter_cache_manager.dart';

class AppImageCacheManager {
  AppImageCacheManager._();

  static final BaseCacheManager _manager = CacheManager(
    Config(
      'app_image_cache',
      stalePeriod: const Duration(days: 7),
      maxNrOfCacheObjects: 500,
      repo: JsonCacheInfoRepository(databaseName: 'app_image_cache_db'),
      fileService: HttpFileService(),
    ),
  );

  static BaseCacheManager get manager => _manager;

  static int _preCacheCount = 0;

  static int get preCacheCount => _preCacheCount;

  static Future<void> preCacheUrls(Iterable<String> urls) async {
    final total = urls.length;
    _preCacheCount = 0;
    for (final url in urls) {
      unawaited(
        _manager.getSingleFile(url).then((_) {
          _preCacheCount++;
          if (!kReleaseMode && _preCacheCount % 10 == 0) {
            debugPrint('[AppImageCacheManager] Pre-cached $_preCacheCount/$total images');
          }
        }),
      );
    }
  }

  static Future<void> clearCache() async {
    await _manager.emptyCache();
    _preCacheCount = 0;
  }

  static Future<int> cacheSize() async {
    final file = await _manager.getFileFromCache('_size_check_');
    if (file == null) return 0;
    return _manager is CacheManager ? 0 : 0;
  }
}
