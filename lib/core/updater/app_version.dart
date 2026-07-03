import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'dart:io' show Platform;

class AppVersion {
  static String get current =>
      const String.fromEnvironment('APP_VERSION', defaultValue: '1.0.0');

  static String get buildNumber =>
      const String.fromEnvironment('APP_BUILD_NUMBER', defaultValue: '1');

  static String get userAgent {
    final platform = !kIsWeb
        ? (Platform.isAndroid ? 'Android' : 'iOS')
        : 'Web';
    return 'DreamHome11/$current (Flutter; $platform)';
  }

  static String get apiVersion => 'v1';
}

final versionProvider = Provider<AppVersion>((ref) => AppVersion());
