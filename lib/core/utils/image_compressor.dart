import 'dart:io';
import 'dart:typed_data';
import 'dart:ui' as ui;

class ImageCompressor {
  static const int _maxWidth = 1024;
  static const int _maxHeight = 1024;

  static Future<File> compress(File file) async {
    try {
      final Uint8List fileBytes = await file.readAsBytes();
      final codec = await ui.instantiateImageCodec(
        fileBytes,
        targetWidth: _maxWidth,
        targetHeight: _maxHeight,
      );
      final frame = await codec.getNextFrame();
      final byteData = await frame.image.toByteData(
        format: ui.ImageByteFormat.png,
      );
      if (byteData == null) return file;

      final compressedPath = '${file.path}_compressed.jpg';
      final compressedFile = File(compressedPath);
      await compressedFile.writeAsBytes(byteData.buffer.asUint8List());
      return compressedFile;
    } catch (_) {
      return file;
    }
  }
}
