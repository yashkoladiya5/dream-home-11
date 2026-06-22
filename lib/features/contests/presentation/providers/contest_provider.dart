import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';
import '../../data/models/contest_model.dart';

final contestListProvider = StateNotifierProvider<ContestListNotifier, AsyncValue<List<ContestModel>>>((ref) {
  final dio = ref.watch(apiClientProvider);
  return ContestListNotifier(dio);
});

class ContestListNotifier extends StateNotifier<AsyncValue<List<ContestModel>>> {
  final Dio _dio;

  ContestListNotifier(this._dio) : super(const AsyncValue.loading()) {
    fetchContests();
  }

  Future<void> fetchContests({String? type, String? status}) async {
    state = const AsyncValue.loading();
    try {
      final queryParams = <String, dynamic>{};
      if (type != null) queryParams['type'] = type;
      if (status != null) queryParams['status'] = status;
      queryParams['limit'] = 50;

      final response = await _dio.get('/api/v1/contests', queryParameters: queryParams);
      final data = response.data as Map<String, dynamic>;
      final list = (data['contests'] as List<dynamic>)
          .map((e) => ContestModel.fromJson(e as Map<String, dynamic>))
          .toList();
      state = AsyncValue.data(list);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }
}
