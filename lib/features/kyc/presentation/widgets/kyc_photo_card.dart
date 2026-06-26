import 'dart:io';
import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../data/models/kyc_document_type.dart';

class KycPhotoCard extends StatelessWidget {
  final KycDocumentType documentType;
  final File? imageFile;
  final String? imageUrl;
  final bool isUploading;
  final double uploadProgress;
  final String? errorMessage;
  final VoidCallback onPickImage;
  final VoidCallback? onRemove;

  const KycPhotoCard({
    super.key,
    required this.documentType,
    this.imageFile,
    this.imageUrl,
    this.isUploading = false,
    this.uploadProgress = 0.0,
    this.errorMessage,
    required this.onPickImage,
    this.onRemove,
  });

  bool get _hasImage => imageFile != null || imageUrl != null;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return GestureDetector(
      onTap: isUploading ? null : onPickImage,
      child: Container(
        decoration: BoxDecoration(
          gradient: AppTheme.darkCardGradient,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: errorMessage != null
                ? AppTheme.primaryRed
                : _hasImage
                    ? AppTheme.emeraldGreen.withValues(alpha: 0.5)
                    : const Color(0x1FFFFFFF),
          ),
        ),
        clipBehavior: Clip.antiAlias,
        child: _hasImage ? _buildPreview(theme) : _buildEmpty(theme),
      ),
    );
  }

  Widget _buildEmpty(ThemeData theme) {
    return Container(
      height: 120,
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: AppTheme.primaryRed.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.cloud_upload_rounded, color: AppTheme.primaryRed, size: 24),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  documentType.displayName,
                  style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 4),
                Text(
                  documentType.hint,
                  style: theme.textTheme.bodySmall?.copyWith(color: AppTheme.greyMedium, fontSize: 11),
                ),
              ],
            ),
          ),
          const Icon(Icons.chevron_right_rounded, color: AppTheme.greyMedium),
        ],
      ),
    );
  }

  Widget _buildPreview(ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (isUploading)
          LinearProgressIndicator(
            value: uploadProgress,
            backgroundColor: AppTheme.greyDark,
            valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.primaryRed),
            minHeight: 3,
          ),
        Stack(
          children: [
            ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
              child: imageFile != null
                  ? Image.file(
                      imageFile!,
                      height: 160,
                      width: double.infinity,
                      fit: BoxFit.cover,
                      errorBuilder: (_, _, _) => _buildPlaceholder(theme),
                    )
                  : Image.network(
                      imageUrl!,
                      height: 160,
                      width: double.infinity,
                      fit: BoxFit.cover,
                      errorBuilder: (_, _, _) => _buildPlaceholder(theme),
                    ),
            ),
            if (isUploading)
              Container(
                height: 160,
                color: Colors.black54,
                child: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const SizedBox(
                        width: 28,
                        height: 28,
                        child: CircularProgressIndicator(
                          strokeWidth: 2.5,
                          color: AppTheme.primaryRed,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        '${(uploadProgress * 100).toInt()}%',
                        style: const TextStyle(color: Colors.white, fontSize: 13),
                      ),
                    ],
                  ),
                ),
              ),
            if (!isUploading)
              Positioned(
                top: 8,
                right: 8,
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _SmallIconButton(
                      icon: Icons.swap_horiz_rounded,
                      onTap: onPickImage,
                      tooltip: 'Replace',
                    ),
                    if (onRemove != null) ...[
                      const SizedBox(width: 6),
                      _SmallIconButton(
                        icon: Icons.close_rounded,
                        onTap: onRemove!,
                        tooltip: 'Remove',
                      ),
                    ],
                  ],
                ),
              ),
          ],
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          child: Row(
            children: [
              Icon(
                Icons.check_circle_rounded,
                size: 16,
                color: errorMessage != null ? AppTheme.primaryRed : AppTheme.emeraldGreen,
              ),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  errorMessage ?? documentType.displayName,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: errorMessage != null ? AppTheme.primaryRed : AppTheme.greyLight,
                    fontSize: 12,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildPlaceholder(ThemeData theme) {
    return Container(
      height: 160,
      color: AppTheme.secondarySlate,
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.broken_image_rounded, color: AppTheme.greyMedium, size: 32),
            const SizedBox(height: 6),
            Text('Failed to load image', style: TextStyle(color: AppTheme.greyMedium, fontSize: 12)),
          ],
        ),
      ),
    );
  }
}

class _SmallIconButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  final String tooltip;

  const _SmallIconButton({
    required this.icon,
    required this.onTap,
    required this.tooltip,
  });

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip,
      child: Material(
        color: Colors.black54,
        borderRadius: BorderRadius.circular(20),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(20),
          child: Padding(
            padding: const EdgeInsets.all(6),
            child: Icon(icon, color: Colors.white, size: 18),
          ),
        ),
      ),
    );
  }
}
