import 'package:flutter_test/flutter_test.dart';
import 'package:dream_home_11/core/utils/image_optimizer.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('ImageResizeConfig', () {
    test('uses default maxWidth and maxHeight when no arguments provided', () {
      final config = ImageResizeConfig();
      expect(config.maxWidth, 1080);
      expect(config.maxHeight, 1080);
    });

    test('uses custom maxWidth and maxHeight', () {
      final config = ImageResizeConfig(maxWidth: 720, maxHeight: 480);
      expect(config.maxWidth, 720);
      expect(config.maxHeight, 480);
    });

    test('memCacheWidth and memCacheHeight are null without originals', () {
      final config = ImageResizeConfig();
      expect(config.memCacheWidth, isNull);
      expect(config.memCacheHeight, isNull);
    });

    test('computes memCacheWidth and memCacheHeight from originals', () {
      final config = ImageResizeConfig(
        originalWidth: 4000,
        originalHeight: 3000,
      );
      expect(config.memCacheWidth, 1080 ~/ 2);
      expect(config.memCacheHeight, 1080 ~/ 2);
    });

    test('uses original dimensions when smaller than max', () {
      final config = ImageResizeConfig(
        maxWidth: 1080,
        maxHeight: 1080,
        originalWidth: 800,
        originalHeight: 600,
      );
      expect(config.memCacheWidth, 800 ~/ 2);
      expect(config.memCacheHeight, 600 ~/ 2);
    });

    test('allows nullable maxWidth and maxHeight', () {
      final config = ImageResizeConfig(
        maxWidth: null,
        maxHeight: null,
        originalWidth: 2000,
        originalHeight: 1500,
      );
      expect(config.maxWidth, isNull);
      expect(config.maxHeight, isNull);
      expect(config.memCacheWidth, isNull);
      expect(config.memCacheHeight, isNull);
    });
  });

  group('ImageUrlBuilder.resizeUrl', () {
    test('appends query params when URL has no query string', () {
      final result = ImageUrlBuilder.resizeUrl(
        'https://cdn.example.com/image.jpg',
        width: 400,
        height: 300,
      );
      expect(result, 'https://cdn.example.com/image.jpg?w=400&h=300');
    });

    test('appends query params when URL already has query string', () {
      final result = ImageUrlBuilder.resizeUrl(
        'https://cdn.example.com/image.jpg?fit=cover',
        width: 400,
        height: 300,
      );
      expect(result, 'https://cdn.example.com/image.jpg?fit=cover&w=400&h=300');
    });
  });

  group('cacheImageDimensions', () {
    test('returns non-null memCacheWidth and memCacheHeight', () {
      final result = cacheImageDimensions();
      expect(result.memCacheWidth, isNotNull);
      expect(result.memCacheHeight, isNotNull);
      expect(result.memCacheWidth!, greaterThan(0));
      expect(result.memCacheHeight!, greaterThan(0));
    });
  });
}
