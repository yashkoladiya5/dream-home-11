import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';
import '../../data/models/daily_action.dart';

final dailyActionsProvider = StateNotifierProvider<DailyActionsNotifier, AsyncValue<TodayActionsResponse>>((ref) {
  final dio = ref.watch(apiClientProvider);
  return DailyActionsNotifier(dio);
});

class DailyActionsNotifier extends StateNotifier<AsyncValue<TodayActionsResponse>> {
  final Dio _dio;

  DailyActionsNotifier(this._dio) : super(const AsyncValue.loading());

  Future<void> fetchTodayActions() async {
    state = const AsyncValue.loading();
    try {
      final response = await _dio.get('/api/v1/points/actions/today');
      final data = TodayActionsResponse.fromJson(response.data as Map<String, dynamic>);
      state = AsyncValue.data(data);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<PerformActionResult?> performAction(String action) async {
    try {
      final response = await _dio.post('/api/v1/points/action', data: {'action': action});
      final result = PerformActionResult.fromJson(response.data as Map<String, dynamic>);

      // Refresh the daily actions list after performing
      await fetchTodayActions();

      return result;
    } catch (_) {
      return null;
    }
  }
}
