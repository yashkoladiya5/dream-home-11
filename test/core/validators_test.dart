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

    test('returns null for 10-digit number without + prefix', () {
      expect(Validators.phoneNumber('9999999999'), isNull);
    });

    test('returns error for phone number with padded whitespace (no trim)', () {
      expect(Validators.phoneNumber('  +919999999999  '), isNotEmpty);
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

  group('Validators.email', () {
    test('returns null for valid email', () {
      expect(Validators.email('user@example.com'), isNull);
    });

    test('returns null for email with subdomain', () {
      expect(Validators.email('user@sub.example.com'), isNull);
    });

    test('returns error for missing @', () {
      expect(Validators.email('userexample.com'), isNotEmpty);
    });

    test('returns error for missing domain', () {
      expect(Validators.email('user@'), isNotEmpty);
    });

    test('returns null for empty value (email is optional)', () {
      expect(Validators.email(''), isNull);
    });
  });

  group('Validators.minLength', () {
    test('returns null when value meets minimum length', () {
      expect(Validators.minLength('hello', 3), isNull);
    });

    test('returns error when value is shorter than minimum', () {
      expect(Validators.minLength('ab', 3), isNotEmpty);
    });

    test('returns null for null value', () {
      expect(Validators.minLength(null, 5), isNull);
    });

    test('trims whitespace before checking length', () {
      expect(Validators.minLength('  ab  ', 3), isNotEmpty);
    });
  });

  group('Validators.maxLength', () {
    test('returns null when value is within maximum length', () {
      expect(Validators.maxLength('hello', 10), isNull);
    });

    test('returns error when value exceeds maximum length', () {
      expect(Validators.maxLength('hello world', 5), isNotEmpty);
    });

    test('returns null for null value', () {
      expect(Validators.maxLength(null, 5), isNull);
    });

    test('returns null when value equals maximum length', () {
      expect(Validators.maxLength('abc', 3), isNull);
    });
  });
}
