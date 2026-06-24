import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';
import '../../data/models/reward.dart';
import '../../data/models/reward_redemption.dart';

final rewardCatalogProvider = FutureProvider<List<Reward>>((ref) async {
  final dio = ref.watch(apiClientProvider);
  final response = await dio.get('/api/v1/rewards');
  return (response.data as List)
      .map((e) => Reward.fromJson(e as Map<String, dynamic>))
      .toList();
});

final redemptionHistoryProvider =
    StateNotifierProvider<RedemptionNotifier, AsyncValue<List<RewardRedemption>>>((ref) {
  final dio = ref.watch(apiClientProvider);
  return RedemptionNotifier(dio);
});

class RedemptionNotifier extends StateNotifier<AsyncValue<List<RewardRedemption>>> {
  final Dio _dio;

  RedemptionNotifier(this._dio) : super(const AsyncValue.loading());

  Future<void> fetchHistory() async {
    state = const AsyncValue.loading();
    try {
      final response = await _dio.get('/api/v1/rewards/redemptions');
      final list = (response.data as List)
          .map((e) => RewardRedemption.fromJson(e as Map<String, dynamic>))
          .toList();
      state = AsyncValue.data(list);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<Map<String, dynamic>?> redeemReward(String rewardId) async {
    try {
      final response = await _dio.post('/api/v1/rewards/$rewardId/redeem');
      await fetchHistory();
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      final msg = e.response?.data?['message'] as String? ?? e.message ?? 'Redemption failed';
      throw Exception(msg);
    }
  }
}
