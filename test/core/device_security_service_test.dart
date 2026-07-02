import 'package:flutter_test/flutter_test.dart';
import 'package:dream_home_11/core/security/device_security_service.dart';

void main() {
  group('DeviceIntegrityResult', () {
    test('isSecure returns true when isRooted is false', () {
      final result = const DeviceIntegrityResult(isRooted: false);
      expect(result.isSecure, isTrue);
    });

    test('isSecure returns false when isRooted is true', () {
      final result = const DeviceIntegrityResult(isRooted: true);
      expect(result.isSecure, isFalse);
    });

    test('defaults to empty lists and maps', () {
      final result = const DeviceIntegrityResult(isRooted: false);
      expect(result.rootIndicators, isEmpty);
      expect(result.details, isEmpty);
    });

    test('stores root indicators correctly', () {
      final result = const DeviceIntegrityResult(
        isRooted: true,
        rootIndicators: ['su_binary_found', 'test_keys_build'],
        details: {'su_binary_paths': ['/system/bin/su']},
      );
      expect(result.rootIndicators.length, 2);
      expect(result.rootIndicators[0], 'su_binary_found');
      expect(result.details['su_binary_paths'], ['/system/bin/su']);
    });
  });
}
