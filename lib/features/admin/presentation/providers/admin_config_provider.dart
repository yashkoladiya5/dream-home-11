import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';
import '../../data/services/admin_api_service.dart';
import 'admin_dashboard_provider.dart';

final adminConfigProvider =
    StateNotifierProvider<
      AdminConfigNotifier,
      AsyncValue<Map<String, dynamic>>
    >((ref) {
      final dio = ref.watch(apiClientProvider);
      final service = ref.watch(adminApiServiceProvider);
      return AdminConfigNotifier(dio, service);
    });

class AdminConfigNotifier
    extends StateNotifier<AsyncValue<Map<String, dynamic>>> {
  final Dio _dio;
  final AdminApiService _service;

  AdminConfigNotifier(this._dio, this._service)
    : super(const AsyncValue.loading());

  Future<void> loadConfig() async {
    state = const AsyncValue.loading();
    try {
      final response = await _dio.get('/api/v1/config');
      state = AsyncValue.data(Map<String, dynamic>.from(response.data as Map));
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<bool> updateConfig(Map<String, dynamic> config) async {
    try {
      final result = await _service.updateConfig(config);
      state = AsyncValue.data(Map<String, dynamic>.from(result));
      return true;
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
      return false;
    }
  }
}
