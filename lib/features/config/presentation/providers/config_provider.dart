import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';
import '../../data/models/system_config.dart';

class ConfigNotifier extends StateNotifier<AsyncValue<SystemConfig>> {
  final Dio _dio;
  Timer? _pollTimer;

  ConfigNotifier(this._dio) : super(const AsyncValue.loading()) {
    _refresh();
  }

  Future<void> _refresh() async {
    try {
      final response = await _dio.get('/api/v1/config');
      final config = SystemConfig.fromJson(response.data as Map<String, dynamic>);
      state = AsyncValue.data(config);
    } catch (e, st) {
      if (state.hasValue != true) {
        state = AsyncValue.error(e, st);
      }
    }
  }

  Future<void> refresh() => _refresh();

  void startPolling({Duration interval = const Duration(seconds: 30)}) {
    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(interval, (_) => _refresh());
  }

  void stopPolling() {
    _pollTimer?.cancel();
    _pollTimer = null;
  }

  bool get isMaintenanceMode => state.valueOrNull?.maintenanceMode ?? false;

  bool isFeatureEnabled(String feature) {
    final config = state.valueOrNull;
    if (config == null) return true;
    switch (feature) {
      case 'spin':
        return config.dailySpinEnabled;
      case 'polls':
        return config.pollsEnabled;
      case 'feed':
        return config.feedEnabled;
      case 'chat':
        return config.chatEnabled;
      case 'referral':
        return config.referralEnabled;
      default:
        return true;
    }
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }
}

final configNotifierProvider = StateNotifierProvider<ConfigNotifier, AsyncValue<SystemConfig>>((ref) {
  final dio = ref.watch(apiClientProvider);
  return ConfigNotifier(dio);
});

final systemConfigProvider = FutureProvider<SystemConfig>((ref) async {
  final configState = ref.watch(configNotifierProvider);
  return configState.when(
    data: (config) => config,
    loading: () => throw Exception('Still loading'),
    error: (e, _) => throw e,
  );
});
