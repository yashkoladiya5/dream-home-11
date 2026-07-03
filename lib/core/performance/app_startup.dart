import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class AppStartupService {
  int _currentPhase = 0;
  bool _isReady = false;
  final Completer<void> _startupComplete = Completer<void>();

  bool get isReady => _isReady;
  int get currentPhase => _currentPhase;
  Future<void> get startupComplete => _startupComplete.future;

  void completePhase0() {
    _currentPhase = 0;
  }

  void completePhase1() {
    _isReady = true;
    _currentPhase = 1;
  }

  void completePhase2() {
    _currentPhase = 2;
  }

  void completePhase3() {
    _currentPhase = 3;
    if (!_startupComplete.isCompleted) {
      _startupComplete.complete();
    }
  }
}

final startupServiceProvider = Provider<AppStartupService>((ref) {
  return AppStartupService();
});
