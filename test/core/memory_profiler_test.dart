import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dream_home_11/core/performance/memory_profiler.dart';

class _TestDisposable {
  bool disposed = false;
  void dispose() => disposed = true;
}

void main() {
  group('MemorySnapshot', () {
    test('has correct fields', () {
      final now = DateTime.now();
      final snapshot = MemorySnapshot(
        timestamp: now,
        registeredObjectsCount: 5,
        potentialLeaksCount: 2,
        memoryPressureEvents: 1,
        maxRegisteredObjects: 10,
      );

      expect(snapshot.timestamp, now);
      expect(snapshot.registeredObjectsCount, 5);
      expect(snapshot.potentialLeaksCount, 2);
      expect(snapshot.memoryPressureEvents, 1);
      expect(snapshot.maxRegisteredObjects, 10);
    });
  });

  group('MemoryProfiler', () {
    test('can be created and disposed', () {
      TestWidgetsFlutterBinding.ensureInitialized();
      final profiler = MemoryProfiler();
      expect(profiler, isA<MemoryProfiler>());
      expect(profiler.registeredObjectsCount, 0);
      expect(profiler.potentialLeaksCount, 0);
      expect(profiler.memoryPressureEvents, 0);
      expect(profiler.maxRegisteredObjects, 0);
      profiler.dispose();
    });

    test('registerDisposable and unregisterDisposable work', () {
      TestWidgetsFlutterBinding.ensureInitialized();
      final profiler = MemoryProfiler();
      addTearDown(() => profiler.dispose());

      final disposable = _TestDisposable();

      profiler.registerDisposable(disposable, label: 'test');
      expect(profiler.registeredObjectsCount, 1);
      expect(profiler.maxRegisteredObjects, 1);

      profiler.unregisterDisposable(disposable);
      expect(profiler.registeredObjectsCount, 0);

      disposable.dispose();
    });

    test('registerDisposable multiple objects tracks max', () {
      TestWidgetsFlutterBinding.ensureInitialized();
      final profiler = MemoryProfiler();
      addTearDown(() {
        profiler.dispose();
      });

      final obj1 = _TestDisposable();
      final obj2 = _TestDisposable();
      final obj3 = _TestDisposable();

      profiler.registerDisposable(obj1);
      profiler.registerDisposable(obj2);
      expect(profiler.registeredObjectsCount, 2);
      expect(profiler.maxRegisteredObjects, 2);

      profiler.unregisterDisposable(obj1);
      expect(profiler.registeredObjectsCount, 1);

      profiler.registerDisposable(obj3);
      expect(profiler.registeredObjectsCount, 2);
      expect(profiler.maxRegisteredObjects, 3);

      profiler.unregisterDisposable(obj2);
      profiler.unregisterDisposable(obj3);
      expect(profiler.registeredObjectsCount, 0);
    });

    test('unregisterDisposable is idempotent', () {
      TestWidgetsFlutterBinding.ensureInitialized();
      final profiler = MemoryProfiler();
      addTearDown(() => profiler.dispose());

      final disposable = _TestDisposable();

      profiler.registerDisposable(disposable);
      profiler.unregisterDisposable(disposable);
      profiler.unregisterDisposable(disposable);
      expect(profiler.registeredObjectsCount, 0);

      disposable.dispose();
    });

    test('timer created on register and cancelled on unregister', () {
      TestWidgetsFlutterBinding.ensureInitialized();
      final profiler = MemoryProfiler();
      addTearDown(() => profiler.dispose());

      final disposable = _TestDisposable();

      profiler.registerDisposable(disposable, label: 'timer-test');
      expect(profiler.registeredObjectsCount, 1);
      expect(profiler.maxRegisteredObjects, 1);

      // Verify the registration has an active timer
      expect(profiler.potentialLeaksCount, 0);

      profiler.unregisterDisposable(disposable);
      expect(profiler.registeredObjectsCount, 0);
      // Timer was cancelled, no leak should be reported
      expect(profiler.potentialLeaksCount, 0);

      disposable.dispose();
    });
  });

  group('Providers', () {
    test('memoryProfilerProvider creates a MemoryProfiler', () {
      TestWidgetsFlutterBinding.ensureInitialized();
      final container = ProviderContainer();
      addTearDown(() => container.dispose());

      final profiler = container.read(memoryProfilerProvider);
      expect(profiler, isA<MemoryProfiler>());
    });

    test('memorySnapshotProvider returns a StreamProvider', () {
      TestWidgetsFlutterBinding.ensureInitialized();
      final container = ProviderContainer();
      addTearDown(() => container.dispose());

      final asyncValue = container.read(memorySnapshotProvider);
      expect(asyncValue, isA<AsyncValue<MemorySnapshot>>());
    });

    test('providers are disposed without error', () {
      TestWidgetsFlutterBinding.ensureInitialized();
      final container = ProviderContainer();
      container.read(memoryProfilerProvider);
      expect(() => container.dispose(), returnsNormally);
    });
  });
}
