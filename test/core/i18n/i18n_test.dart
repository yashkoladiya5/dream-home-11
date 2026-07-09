import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:dream_home_11/core/i18n/locale_provider.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues(<String, Object>{});
  });

  group('LocaleNotifier', () {
    test('initial locale is English', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);
      final locale = container.read(localeProvider);
      expect(locale, const Locale('en'));
    });

    test('setLocale updates state', () async {
      final container = ProviderContainer();
      addTearDown(container.dispose);
      final notifier = container.read(localeProvider.notifier);
      await notifier.setLocale(const Locale('hi'));
      expect(container.read(localeProvider), const Locale('hi'));
    });

    test('setLocale to same locale does not throw', () async {
      final container = ProviderContainer();
      addTearDown(container.dispose);
      final notifier = container.read(localeProvider.notifier);
      await notifier.setLocale(const Locale('en'));
      expect(container.read(localeProvider), const Locale('en'));
    });
  });
}
