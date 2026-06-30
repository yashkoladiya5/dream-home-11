import 'package:flutter_test/flutter_test.dart';
import 'package:dream_home_11/core/utils/validators.dart';

void main() {
  group('Validators.phoneNumber', () {
    test('returns null for valid Indian phone number', () {
      expect(Validators.phoneNumber('+919999999999'), isNull);
    });

    test('returns error for empty value', () {
      expect(Validators.phoneNumber(''), isNotEmpty);
    });

    test('returns error for too short number', () {
      expect(Validators.phoneNumber('12345'), isNotEmpty);
    });
  });

  group('Validators.required', () {
    test('returns null for non-empty string', () {
      expect(Validators.required('test'), isNull);
    });

    test('returns error for empty string', () {
      expect(Validators.required(''), isNotEmpty);
    });

    test('returns error for whitespace only', () {
      expect(Validators.required('   '), isNotEmpty);
    });
  });

  group('Validators.amount', () {
    test('returns null for valid amount', () {
      expect(Validators.amount('100'), isNull);
    });

    test('returns error for zero', () {
      expect(Validators.amount('0'), isNotEmpty);
    });

    test('returns error for negative', () {
      expect(Validators.amount('-50'), isNotEmpty);
    });

    test('returns error for empty', () {
      expect(Validators.amount(''), isNotEmpty);
    });
  });
}
