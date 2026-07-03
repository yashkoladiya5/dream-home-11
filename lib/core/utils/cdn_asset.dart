import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import '../network/api_config.dart';

class CdnAsset {
  CdnAsset._();

  static const String formatWebp = 'webp';
  static const String formatAvif = 'avif';
  static const String formatJpeg = 'jpeg';
  static const String formatPng = 'png';

  static String image(String path, {
    int? width,
    int? height,
    String? format,
    int quality = 80,
  }) {
    final devicePixelRatio = _devicePixelRatio();
    final adjustedWidth = width != null ? (width * devicePixelRatio).round() : null;
    final adjustedHeight = height != null ? (height * devicePixelRatio).round() : null;

    return ApiConfig.assetUrl(
      path,
      format: format ?? _preferredFormat(),
      width: adjustedWidth,
      height: adjustedHeight,
      quality: quality,
    );
  }

  static String thumbnail(String path, {int size = 150}) {
    return image(path, width: size, height: size, quality: 60);
  }

  static String avatar(String path, {int size = 80}) {
    return image(path, width: size, height: size, quality: 70);
  }

  static String banner(String path, {int width = 1200}) {
    return image(path, width: width, quality: 85);
  }

  static double _devicePixelRatio() {
    if (kIsWeb) return 2.0;
    try {
      return WidgetsBinding.instance.platformDispatcher.views.first.devicePixelRatio;
    } catch (_) {
      return 2.0;
    }
  }

  static String _preferredFormat() {
    if (kIsWeb) return formatWebp;
    return formatWebp;
  }
}
