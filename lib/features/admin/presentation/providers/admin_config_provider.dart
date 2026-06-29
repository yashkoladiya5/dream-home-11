import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'admin_dashboard_provider.dart';
import '../../data/services/admin_api_service.dart';

final adminConfigProvider = StateNotifierProvider<AdminConfigNotifier, AsyncValue<Map<String, dynamic>>>((ref) {
  final service = ref.watch(adminApiServiceProvider);
  return AdminConfigNotifier(service);
});

class AdminConfigNotifier extends StateNotifier<AsyncValue<Map<String, dynamic>>> {
  final AdminApiService _service;

  AdminConfigNotifier(this._service) : super(const AsyncValue.loading());

  Future<void> loadConfig() async {
    state = const AsyncValue.loading();
    try {
      state = AsyncValue.data({});
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
