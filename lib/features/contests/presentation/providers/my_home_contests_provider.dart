import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';
import '../../data/models/home_contest_model.dart';

final myHomeContestsProvider = StateNotifierProvider<MyHomeContestsNotifier, AsyncValue<List<HomeContestModel>>>((ref) {
  final dio = ref.watch(apiClientProvider);
  return MyHomeContestsNotifier(dio);
});

class MyHomeContestsNotifier extends StateNotifier<AsyncValue<List<HomeContestModel>>> {
  final Dio _dio;
  List<HomeContestModel>? _cachedContests;

  MyHomeContestsNotifier(this._dio) : super(const AsyncValue.loading()) {
    fetchMyHomeContests();
  }

  Future<void> fetchMyHomeContests() async {
    state = const AsyncValue.loading();
    try {
      final response = await _dio.get('/api/v1/users/contests/home');
      final data = response.data as Map<String, dynamic>;
      final list = (data['contests'] as List<dynamic>)
          .map((e) => HomeContestModel.fromJson(e as Map<String, dynamic>))
          .toList();
      _cachedContests = list;
      state = AsyncValue.data(list);
    } catch (e, stack) {
      if (_cachedContests != null) {
        state = AsyncValue.data(_cachedContests!);
      } else {
        state = AsyncValue.error(e, stack);
      }
    }
  }

  Future<void> refresh() async {
    await fetchMyHomeContests();
  }
}
