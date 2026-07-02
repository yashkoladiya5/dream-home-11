import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

enum InitPriority { critical, required, background, idle }

mixin InitializableService {
  bool _initialized = false;
  bool get isInitialized => _initialized;

  String get serviceName;
  Future<void> initialize();

  @protected
  void markInitialized() {
    _initialized = true;
  }
}

class _InitTask {
  final InitializableService service;
  final InitPriority priority;

  _InitTask({required this.service, required this.priority});
}

class AppInitializer {
  final List<_InitTask> _tasks = [];
  final List<InitializableService> _initializedServices = [];
  int _currentIndex = 0;
  bool _allDone = false;
  Completer<void>? _criticalCompleter;

  final _progressController = StreamController<double>.broadcast();
  Stream<double> get progressStream => _progressController.stream;
  bool get isAllInitialized => _allDone;

  final Map<String, int> _timings = {};

  void addService(InitializableService service, InitPriority priority) {
    _tasks.add(_InitTask(service: service, priority: priority));
  }

  Future<void> initializeCritical() async {
    _criticalCompleter = Completer<void>();
    final critical = _tasks
        .where((t) => t.priority == InitPriority.critical)
        .toList();

    for (final task in critical) {
      await _safeInitialize(task.service);
    }

    _criticalCompleter!.complete();
  }

  Future<void> initializeRequired() async {
    await _safeWaitForCritical();

    final required = _tasks
        .where((t) => t.priority == InitPriority.required)
        .toList();

    for (final task in required) {
      await _safeInitialize(task.service);
    }
  }

  Future<void> initializeBackground() async {
    final background = _tasks
        .where((t) => t.priority == InitPriority.background)
        .toList();

    for (final task in background) {
      await _safeInitialize(task.service);
    }
  }

  Future<void> initializeIdle() async {
    final idle = _tasks
        .where((t) => t.priority == InitPriority.idle)
        .toList();

    for (final task in idle) {
      await _safeInitialize(task.service);
    }

    _allDone = true;
    _logTimings();
  }

  Future<void> _safeInitialize(InitializableService service) async {
    final stopwatch = Stopwatch()..start();
    try {
      await service.initialize();
      _initializedServices.add(service);
      stopwatch.stop();
      _timings[service.serviceName] = stopwatch.elapsedMilliseconds.toInt();
      debugPrint('[Startup] ${service.serviceName}: ${stopwatch.elapsedMilliseconds}ms');
    } catch (e) {
      stopwatch.stop();
      debugPrint('[Startup] ${service.serviceName} FAILED: $e');
    }
    _currentIndex++;
    _emitProgress();
  }

  Future<void> _safeWaitForCritical() async {
    if (_criticalCompleter != null && !_criticalCompleter!.isCompleted) {
      await _criticalCompleter!.future;
    }
  }

  void _emitProgress() {
    if (_tasks.isEmpty) {
      _progressController.add(1.0);
      return;
    }
    _progressController.add(_currentIndex / _tasks.length);
  }

  void _logTimings() {
    if (kReleaseMode) return;
    final critical = _sumTimings(InitPriority.critical);
    final required = _sumTimings(InitPriority.required);
    final background = _sumTimings(InitPriority.background);
    final idle = _sumTimings(InitPriority.idle);
    final total = critical + required + background + idle;
    debugPrint(
      '[Startup] Critical: ${critical}ms, Required: ${required}ms, '
      'Background: ${background}ms, Idle: ${idle}ms, Total: ${total}ms',
    );
  }

  int _sumTimings(InitPriority priority) {
    int sum = 0;
    for (final task in _tasks) {
      if (task.priority == priority) {
        sum += _timings[task.service.serviceName] ?? 0;
      }
    }
    return sum;
  }

  void dispose() {
    _progressController.close();
  }
}

class DeferredInitService with InitializableService {
  @override
  final String serviceName;
  final Future<void> Function() initFn;

  DeferredInitService({required this.serviceName, required this.initFn});

  @override
  Future<void> initialize() async {
    await initFn();
    markInitialized();
  }
}

final appInitializerProvider = Provider<AppInitializer>((ref) {
  final initializer = AppInitializer();
  ref.onDispose(() => initializer.dispose());
  return initializer;
});

final initializationProgressProvider = StreamProvider<double>((ref) {
  final initializer = ref.watch(appInitializerProvider);
  return initializer.progressStream;
});

final isFullyInitializedProvider = Provider<bool>((ref) {
  final initializer = ref.watch(appInitializerProvider);
  return initializer.isAllInitialized;
});
