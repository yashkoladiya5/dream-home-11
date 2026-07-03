import 'dart:io';
import 'package:flutter/foundation.dart';

enum AppEnvironment { development, staging, production }

class ApiConfig {
  ApiConfig._();

  /// Current environment, controlled by --dart-define=APP_ENV=development|staging|production
  /// Defaults to development
  static AppEnvironment get environment {
    const env = String.fromEnvironment('APP_ENV');
    switch (env) {
      case 'production':
        return AppEnvironment.production;
      case 'staging':
        return AppEnvironment.staging;
      default:
        return AppEnvironment.development;
    }
  }

  /// Whether this is a release build
  static bool get isRelease => kReleaseMode;

  /// The base URL for API requests
  static String get baseUrl {
    switch (environment) {
      case AppEnvironment.production:
        return 'https://api.dreamhome11.com';
      case AppEnvironment.staging:
        return 'https://staging.api.dreamhome11.com';
      case AppEnvironment.development:
        if (!kIsWeb && Platform.isAndroid) {
          return 'http://10.0.2.2:3000';
        }
        return 'http://localhost:3000';
    }
  }

  /// Whether SSL pinning is required
  static bool get requireSslPinning {
    switch (environment) {
      case AppEnvironment.production:
        return true;
      case AppEnvironment.staging:
        return false;
      case AppEnvironment.development:
        return false;
    }
  }

  /// Whether SSL pinning is enabled via dart-define override
  /// Controlled by --dart-define=ENABLE_SSL_PINNING=true|false
  /// Falls back to requireSslPinning if not set
  static bool get enableSslPinning {
    const env = String.fromEnvironment('ENABLE_SSL_PINNING');
    if (env == 'true') return true;
    if (env == 'false') return false;
    return requireSslPinning;
  }

  /// Connection timeout
  static Duration get connectTimeout => const Duration(seconds: 10);

  /// Receive timeout
  static Duration get receiveTimeout => const Duration(seconds: 10);

  /// API version prefix
  static String get apiPrefix => '/api/v1';

  /// CDN base URL for asset delivery
  static String get cdnBaseUrl {
    switch (environment) {
      case AppEnvironment.production:
        return 'https://cdn.dreamhome11.com';
      case AppEnvironment.staging:
        return 'https://staging-cdn.dreamhome11.com';
      case AppEnvironment.development:
        return '';
    }
  }

  /// Constructs a full CDN URL for a given asset path
  static String assetUrl(String path, {String? format, int? width, int? height, int? quality}) {
    final base = cdnBaseUrl;
    if (base.isEmpty) return path;
    final cleanPath = path.startsWith('/') ? path.substring(1) : path;
    final url = '$base/$cleanPath';
    final params = <String, String>{};
    if (format != null) params['format'] = format;
    if (width != null) params['width'] = width.toString();
    if (height != null) params['height'] = height.toString();
    if (quality != null) params['quality'] = quality.toString();
    if (params.isEmpty) return url;
    return '$url?${params.entries.map((e) => '${e.key}=${Uri.encodeComponent(e.value)}').join('&')}';
  }
}
