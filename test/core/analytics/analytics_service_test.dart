import 'package:flutter_test/flutter_test.dart';
import 'package:dream_home_11/core/analytics/sentry_config.dart';

void main() {
  group('SentryConfig', () {
    test('configure does not throw when DSN is empty', () async {
      await expectLater(SentryConfig.configure(), completes);
    });

    test('has static configure method', () {
      expect(SentryConfig.configure, isA<Function>());
    });
  });
}
