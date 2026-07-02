import 'package:flutter/foundation.dart' show defaultTargetPlatform, TargetPlatform;
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class DeviceIntegrityResult {
  final bool isRooted;
  final List<String> rootIndicators;
  final Map<String, dynamic> details;

  const DeviceIntegrityResult({
    required this.isRooted,
    this.rootIndicators = const [],
    this.details = const {},
  });

  bool get isSecure => !isRooted;
}

class DeviceSecurityService {
  static const _channel = MethodChannel('com.dreamhome11/device_security');

  bool get canCheck {
    return defaultTargetPlatform == TargetPlatform.android ||
        defaultTargetPlatform == TargetPlatform.iOS;
  }

  Future<DeviceIntegrityResult> checkDeviceIntegrity() async {
    try {
      final result = await _channel.invokeMethod<Map>('checkDeviceIntegrity');
      if (result == null) {
        return const DeviceIntegrityResult(isRooted: false);
      }
      return DeviceIntegrityResult(
        isRooted: (result['isRooted'] as bool?) ?? false,
        rootIndicators: (result['rootIndicators'] as List<dynamic>?)
                ?.map((e) => e.toString())
                .toList() ??
            [],
        details: (result['details'] as Map<dynamic, dynamic>?)
                ?.map((k, v) => MapEntry(k.toString(), v)) ??
            {},
      );
    } catch (e) {
      return const DeviceIntegrityResult(isRooted: false);
    }
  }
}

final deviceSecurityProvider = FutureProvider<DeviceIntegrityResult>((ref) async {
  return DeviceSecurityService().checkDeviceIntegrity();
});
