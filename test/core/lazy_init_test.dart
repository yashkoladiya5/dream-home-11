import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dream_home_11/core/performance/lazy_init.dart';

class _TestService with InitializableService {
  final String name;
  final bool shouldFail;

  _TestService({required this.name, this.shouldFail = false});

  @override
  String get serviceName => name;

  @override
  Future<void> initialize() async {
    if (shouldFail) {
      throw Exception('$name failed');
    }
    markInitialized();
  }
}

void main() {
  group('InitializableService', () {
    test('starts uninitialized', () {
      final service = _TestService(name: 'test');
      expect(service.isInitialized, isFalse);
    });

    test('becomes initialized after initialize()', () async {
      final service = _TestService(name: 'test');
      await service.initialize();
      expect(service.isInitialized, isTrue);
    });

    test('reports correct service name', () {
      final service = _TestService(name: 'MyService');
      expect(service.serviceName, equals('MyService'));
    });
  });

  group('AppInitializer', () {
    late AppInitializer initializer;

    setUp(() {
      initializer = AppInitializer();
    });

    tearDown(() {
      initializer.dispose();
    });

    test('starts with no progress', () {
      expect(initializer.isAllInitialized, isFalse);
    });

    test('addService adds task without initializing', () {
      final service = _TestService(name: 'test');
      initializer.addService(service, InitPriority.critical);

      expect(initializer.isAllInitialized, isFalse);
      expect(service.isInitialized, isFalse);
    });

    test('initializeCritical runs critical services', () async {
      final service1 = _TestService(name: 's1');
      final service2 = _TestService(name: 's2');
      initializer.addService(service1, InitPriority.critical);
      initializer.addService(service2, InitPriority.critical);

      await initializer.initializeCritical();

      expect(service1.isInitialized, isTrue);
      expect(service2.isInitialized, isTrue);
    });

    test('services initialize in priority order', () async {
      final critical = _TestService(name: 'critical');
      final required = _TestService(name: 'required');
      final background = _TestService(name: 'background');

      initializer.addService(critical, InitPriority.critical);
      initializer.addService(required, InitPriority.required);
      initializer.addService(background, InitPriority.background);

      await initializer.initializeCritical();
      expect(critical.isInitialized, isTrue);
      expect(required.isInitialized, isFalse);

      await initializer.initializeRequired();
      expect(required.isInitialized, isTrue);
      expect(background.isInitialized, isFalse);

      await initializer.initializeBackground();
      expect(background.isInitialized, isTrue);
    });

    test('error tolerance does not block other services', () async {
      final failing = _TestService(name: 'failing', shouldFail: true);
      final ok = _TestService(name: 'ok');

      initializer.addService(failing, InitPriority.critical);
      initializer.addService(ok, InitPriority.critical);

      await initializer.initializeCritical();

      expect(failing.isInitialized, isFalse);
      expect(ok.isInitialized, isTrue);
    });

    test('progress stream emits values', () async {
      final s1 = _TestService(name: 's1');
      final s2 = _TestService(name: 's2');
      initializer.addService(s1, InitPriority.critical);
      initializer.addService(s2, InitPriority.critical);

      final progressValues = <double>[];
      initializer.progressStream.listen(progressValues.add);

      await initializer.initializeCritical();

      expect(progressValues, isNotEmpty);
      expect(progressValues.last, greaterThan(0));
    });

    test('isFullyInitialized after all phases complete', () async {
      final s = _TestService(name: 's');
      initializer.addService(s, InitPriority.idle);

      await initializer.initializeIdle();

      expect(initializer.isAllInitialized, isTrue);
    });
  });

  group('DeferredInitService', () {
    test('wraps a function and marks initialized', () async {
      bool called = false;
      final service = DeferredInitService(
        serviceName: 'deferred',
        initFn: () async {
          called = true;
        },
      );

      expect(service.serviceName, equals('deferred'));
      expect(service.isInitialized, isFalse);

      await service.initialize();

      expect(called, isTrue);
      expect(service.isInitialized, isTrue);
    });
  });

  group('Providers', () {
    testWidgets('appInitializerProvider creates initializer', (tester) async {
      final container = ProviderContainer();
      addTearDown(() => container.dispose());

      final initializer = container.read(appInitializerProvider);
      expect(initializer, isA<AppInitializer>());
    });

    testWidgets('isFullyInitializedProvider defaults to false', (tester) async {
      final container = ProviderContainer();
      addTearDown(() => container.dispose());

      expect(container.read(isFullyInitializedProvider), isFalse);
    });
  });
}
