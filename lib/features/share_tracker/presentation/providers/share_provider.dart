import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';
import '../../data/models/share_event.dart';

final shareHistoryProvider = StateNotifierProvider<ShareNotifier, AsyncValue<List<ShareEvent>>>((ref) {
  final dio = ref.watch(apiClientProvider);
  return ShareNotifier(dio);
});

final shareStatsProvider = FutureProvider.family<Map<String, dynamic>, void>((ref, _) async {
  final dio = ref.watch(apiClientProvider);
  final response = await dio.get('/api/v1/shares/stats');
  return response.data as Map<String, dynamic>;
});

class ShareNotifier extends StateNotifier<AsyncValue<List<ShareEvent>>> {
  final Dio _dio;

  ShareNotifier(this._dio) : super(const AsyncValue.loading());

  Future<void> fetchHistory() async {
    state = const AsyncValue.loading();
    try {
      final response = await _dio.get('/api/v1/shares/history');
      final list = (response.data as List)
          .map((e) => ShareEvent.fromJson(e as Map<String, dynamic>))
          .toList();
      state = AsyncValue.data(list);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<bool> logShare({String? contestId, required String shareChannel}) async {
    try {
      final data = <String, dynamic>{'shareChannel': shareChannel};
      if (contestId != null) data['contestId'] = contestId;
      await _dio.post('/api/v1/shares', data: data);
      await fetchHistory();
      return true;
    } catch (e) {
      return false;
    }
  }
}
