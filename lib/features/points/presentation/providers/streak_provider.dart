import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';
import '../../data/models/streak_info.dart';

final streakProvider = StateNotifierProvider<StreakNotifier, AsyncValue<StreakInfo>>((ref) {
  final dio = ref.watch(apiClientProvider);
  return StreakNotifier(dio);
});

class StreakNotifier extends StateNotifier<AsyncValue<StreakInfo>> {
  final Dio _dio;

  StreakNotifier(this._dio) : super(const AsyncValue.loading());

  Future<void> fetchStreakInfo() async {
    state = const AsyncValue.loading();
    try {
      final response = await _dio.get('/api/v1/points/streak');
      final data = StreakInfo.fromJson(response.data as Map<String, dynamic>);
      state = AsyncValue.data(data);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }
}
