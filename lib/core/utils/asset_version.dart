class AssetVersion {
  AssetVersion._();

  static const _version = 'v1';

  static String get buildTimestamp {
    const timestamp = String.fromEnvironment('BUILD_TIMESTAMP');
    return timestamp.isNotEmpty ? timestamp : _version;
  }

  static String versioned(String path) {
    final separator = path.contains('?') ? '&' : '?';
    return '$path${separator}_v=$buildTimestamp';
  }

  static String fallbackAsset(String assetName) {
    return 'assets/images/$assetName';
  }
}
