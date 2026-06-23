import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';
import '../../data/models/multiplier_info.dart';

final multiplierProvider = StateNotifierProvider<MultiplierNotifier, AsyncValue<MultiplierInfo>>((ref) {
  final dio = ref.watch(apiClientProvider);
  return MultiplierNotifier(dio);
});

class MultiplierNotifier extends StateNotifier<AsyncValue<MultiplierInfo>> {
  final Dio _dio;

  MultiplierNotifier(this._dio) : super(const AsyncValue.loading());

  Future<void> fetchMultiplierInfo() async {
    state = const AsyncValue.loading();
    try {
      final response = await _dio.get('/api/v1/users/me/multiplier');
      final data = MultiplierInfo.fromJson(response.data as Map<String, dynamic>);
      state = AsyncValue.data(data);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }
}
