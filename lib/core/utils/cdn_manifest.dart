import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../network/api_config.dart';

class CdnManifestEntry {
  final String path;
  final String type;
  final String hash;
  final int width;
  final int height;

  const CdnManifestEntry({
    required this.path,
    required this.type,
    required this.hash,
    required this.width,
    required this.height,
  });

  factory CdnManifestEntry.fromJson(Map<String, dynamic> json) {
    return CdnManifestEntry(
      path: json['path'] as String,
      type: json['type'] as String,
      hash: json['hash'] as String,
      width: json['width'] as int,
      height: json['height'] as int,
    );
  }
}

class CdnManifest {
  final String version;
  final String generated;
  final String basePath;
  final Map<String, CdnManifestEntry> assets;

  const CdnManifest({
    required this.version,
    required this.generated,
    required this.basePath,
    required this.assets,
  });

  factory CdnManifest.fromJson(Map<String, dynamic> json) {
    final rawAssets = json['assets'] as Map<String, dynamic>;
    final resolved = <String, CdnManifestEntry>{};

    void flatten(String prefix, Map<String, dynamic> map) {
      for (final entry in map.entries) {
        if (entry.value is Map<String, dynamic>) {
          final nested = entry.value as Map<String, dynamic>;
          if (nested.containsKey('path') && nested.containsKey('type')) {
            resolved[entry.key] = CdnManifestEntry.fromJson(nested);
          } else {
            flatten('$prefix${entry.key}.', nested);
          }
        }
      }
    }

    flatten('', rawAssets);
    return CdnManifest(
      version: json['version'] as String? ?? '',
      generated: json['generated'] as String? ?? '',
      basePath: json['basePath'] as String? ?? 'assets',
      assets: resolved,
    );
  }

  String assetUrl(String logicalName) {
    final base = ApiConfig.cdnBaseUrl;
    final entry = assets[logicalName];
    if (entry == null) {
      debugPrint('[CdnManifest] Asset not found in manifest: $logicalName');
      return logicalName;
    }
    if (base.isEmpty) {
      return entry.path;
    }
    final cleanPath = entry.path.startsWith('/') ? entry.path.substring(1) : entry.path;
    return '$base/$cleanPath';
  }

  bool hasAsset(String logicalName) => assets.containsKey(logicalName);
}

final manifestProvider = FutureProvider<CdnManifest?>((ref) async {
  final manifest = CdnManifestService();
  return manifest.load();
});

class CdnManifestService {
  CdnManifest? _cached;

  Future<CdnManifest> load() async {
    if (_cached != null) return _cached!;

    final base = ApiConfig.cdnBaseUrl;
    CdnManifest? manifest;

    if (base.isNotEmpty) {
      manifest = await _fetchFromCdn(base);
    }

    manifest ??= await _loadBundled();

    if (manifest == null) {
      manifest = const CdnManifest(
        version: '0',
        generated: '',
        basePath: 'assets',
        assets: {},
      );
      if (!kReleaseMode) {
        debugPrint('[CdnManifest] No manifest found — using empty manifest');
      }
    }

    _cached = manifest;
    return manifest;
  }

  Future<CdnManifest?> _fetchFromCdn(String baseUrl) async {
    try {
      final url = '$baseUrl/asset-manifest.json';
      final response = await Dio().get<Map<String, dynamic>>(
        url,
        options: Options(
          receiveTimeout: const Duration(seconds: 5),
          extra: {'noRetry': true},
        ),
      );
      return CdnManifest.fromJson(response.data!);
    } catch (e) {
      if (!kReleaseMode) {
        debugPrint('[CdnManifest] Failed to fetch from CDN: $e');
      }
      return null;
    }
  }

  Future<CdnManifest?> _loadBundled() async {
    try {
      final jsonString = await rootBundle.loadString('deploy/assets/asset-manifest.json');
      final json = jsonDecode(jsonString) as Map<String, dynamic>;
      return CdnManifest.fromJson(json);
    } catch (e) {
      if (!kReleaseMode) {
        debugPrint('[CdnManifest] Failed to load bundled manifest: $e');
      }
      return null;
    }
  }
}
