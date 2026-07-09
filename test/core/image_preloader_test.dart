import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dream_home_11/core/performance/image_preloader.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  group('ImagePreloader', () {
    test('imagePreloaderProvider creates an ImagePreloader', () {
      final container = ProviderContainer();
      addTearDown(() => container.dispose());

      final preloader = container.read(imagePreloaderProvider);
      expect(preloader, isA<ImagePreloader>());
    });

    test('preCacheCommonImages does not throw', () async {
      final preloader = ImagePreloader();
      await expectLater(preloader.preCacheCommonImages(), completes);
    });
  });
}
