import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

class KycImagePicker {
  static Future<XFile?> pickFromCamera() async {
    try {
      final picker = ImagePicker();
      return await picker.pickImage(
        source: ImageSource.camera,
        imageQuality: 85,
        maxWidth: 1024,
        maxHeight: 1024,
      );
    } catch (e) {
      debugPrint('Error picking image from camera: $e');
      return null;
    }
  }

  static Future<XFile?> pickFromGallery() async {
    try {
      final picker = ImagePicker();
      return await picker.pickImage(
        source: ImageSource.gallery,
        imageQuality: 85,
        maxWidth: 1024,
        maxHeight: 1024,
      );
    } catch (e) {
      debugPrint('Error picking image from gallery: $e');
      return null;
    }
  }

  static Future<XFile?> showPickerSheet(BuildContext context) async {
    try {
      final result = await showModalBottomSheet<dynamic>(
        context: context,
        backgroundColor: const Color(0xFF1E293B),
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        builder: (ctx) {
          return SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: const Color(0xFF374151),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  const SizedBox(height: 20),
                  const Text(
                    'Select Image Source',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 24),
                  Row(
                    children: [
                      Expanded(
                        child: _SheetButton(
                          icon: Icons.camera_alt_rounded,
                          label: 'Camera',
                          onTap: () => Navigator.of(ctx).pop(_CameraOption()),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: _SheetButton(
                          icon: Icons.photo_library_rounded,
                          label: 'Gallery',
                          onTap: () => Navigator.of(ctx).pop(_GalleryOption()),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          );
        },
      );

      if (result is _CameraOption) {
        return await pickFromCamera();
      } else if (result is _GalleryOption) {
        return await pickFromGallery();
      }
      return null;
    } catch (e) {
      debugPrint('Error showing image picker sheet: $e');
      return null;
    }
  }
}

class _CameraOption {
  const _CameraOption();
}

class _GalleryOption {
  const _GalleryOption();
}

class _SheetButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _SheetButton({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: const Color(0xFF374151),
      borderRadius: BorderRadius.circular(16),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 20),
          child: Column(
            children: [
              Icon(icon, color: const Color(0xFFD22C2C), size: 36),
              const SizedBox(height: 12),
              Text(
                label,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
