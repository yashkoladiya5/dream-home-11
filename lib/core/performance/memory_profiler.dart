import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class MemorySnapshot {
  final DateTime timestamp;
  final int registeredObjectsCount;
  final int potentialLeaksCount;
  final int memoryPressureEvents;
  final int maxRegisteredObjects;

  const MemorySnapshot({
    required this.timestamp,
    required this.registeredObjectsCount,
    required this.potentialLeaksCount,
    required this.memoryPressureEvents,
    required this.maxRegisteredObjects,
  });
}

class _Registration {
  final WeakReference<Object> reference;
  final Timer timer;
  final String label;

  _Registration({
    required this.reference,
    required this.timer,
    required this.label,
  });
}

class MemoryProfiler with WidgetsBindingObserver {
  final List<_Registration> _objects = [];
  final Duration _leakTimeout;
  final StreamController<MemorySnapshot> _snapshotController =
      StreamController<MemorySnapshot>.broadcast();

  int _memoryPressureEvents = 0;
  int _maxRegisteredObjects = 0;
  int _potentialLeaksCount = 0;
  int _totalRegistrations = 0;
  Timer? _snapshotTimer;

  Stream<MemorySnapshot> get snapshots => _snapshotController.stream;

  int get registeredObjectsCount => _objects.length;

  int get potentialLeaksCount => _potentialLeaksCount;

  int get memoryPressureEvents => _memoryPressureEvents;

  int get maxRegisteredObjects => _totalRegistrations;

  MemoryProfiler({Duration? leakTimeout})
    : _leakTimeout = leakTimeout ?? const Duration(minutes: 5) {
    if (!kReleaseMode) {
      WidgetsBinding.instance.addObserver(this);
      _snapshotTimer = Timer.periodic(
        const Duration(seconds: 60),
        (_) => _takeSnapshot(),
      );
    }
  }

  @override
  void didHaveMemoryPressure() {
    _memoryPressureEvents++;
    debugPrint(
      '[MemoryProfiler] Memory pressure event #$_memoryPressureEvents',
    );
  }

  void registerDisposable(Object object, {String label = ''}) {
    if (kReleaseMode) return;
    _purgeCollected();

    _totalRegistrations++;
    if (_totalRegistrations > _maxRegisteredObjects) {
      _maxRegisteredObjects = _totalRegistrations;
    }

    final weakRef = WeakReference<Object>(object);

    final timer = Timer(_leakTimeout, () {
      _objects.removeWhere((o) => identical(o.reference, weakRef));
      if (weakRef.target != null) {
        _potentialLeaksCount++;
        debugPrint(
          '[MemoryProfiler] Potential leak detected: $label not disposed within $_leakTimeout',
        );
      }
    });

    _objects.add(_Registration(
      reference: weakRef,
      timer: timer,
      label: label,
    ));

    debugPrint(
      '[MemoryProfiler] Registered: $label ($object) — total: ${_objects.length}',
    );
  }

  void unregisterDisposable(Object object) {
    if (kReleaseMode) return;
    _objects.removeWhere((o) {
      if (o.reference.target == null || identical(o.reference.target, object)) {
        o.timer.cancel();
        return true;
      }
      return false;
    });
    debugPrint(
      '[MemoryProfiler] Unregistered: $object — remaining: ${_objects.length}',
    );
  }

  void _purgeCollected() {
    _objects.removeWhere((o) {
      if (o.reference.target == null) {
        o.timer.cancel();
        return true;
      }
      return false;
    });
  }

  void _takeSnapshot() {
    if (kReleaseMode) return;
    _purgeCollected();

    final snapshot = MemorySnapshot(
      timestamp: DateTime.now(),
      registeredObjectsCount: _objects.length,
      potentialLeaksCount: _potentialLeaksCount,
      memoryPressureEvents: _memoryPressureEvents,
      maxRegisteredObjects: _maxRegisteredObjects,
    );

    _snapshotController.add(snapshot);
    debugPrint(
      '[MemoryProfiler] Snapshot — Registered: ${_objects.length}, '
      'Max: $_maxRegisteredObjects, '
      'Leaks: $_potentialLeaksCount, '
      'Pressure Events: $_memoryPressureEvents',
    );
  }

  void dispose() {
    if (kReleaseMode) return;
    WidgetsBinding.instance.removeObserver(this);
    _snapshotTimer?.cancel();
    for (final obj in _objects) {
      obj.timer.cancel();
    }
    _objects.clear();
    _snapshotController.close();
  }
}

final memoryProfilerProvider = Provider<MemoryProfiler>((ref) {
  final profiler = MemoryProfiler();
  ref.onDispose(() => profiler.dispose());
  return profiler;
});

final memorySnapshotProvider = StreamProvider<MemorySnapshot>((ref) {
  final profiler = ref.watch(memoryProfilerProvider);
  return profiler.snapshots;
});
