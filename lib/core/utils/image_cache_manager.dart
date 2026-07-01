import 'dart:async';
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

  static Future<void> preCacheUrls(Iterable<String> urls) async {
    for (final url in urls) {
      unawaited(_manager.getSingleFile(url).then((_) {}));
    }
  }

  static Future<void> clearCache() async {
    await _manager.emptyCache();
  }
}
