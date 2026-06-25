import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';
import '../../../dashboard/data/models/user_profile.dart';

final depositProvider = Provider<DepositNotifier>((ref) {
  final dio = ref.watch(apiClientProvider);
  return DepositNotifier(dio);
});

class DepositNotifier {
  final Dio _dio;

  DepositNotifier(this._dio);

  Future<UserProfile?> deposit(double amount) async {
    try {
      final response = await _dio.post('/api/v1/users/deposit', data: {'amount': amount});
      return UserProfile.fromJson(response.data as Map<String, dynamic>);
    } catch (_) {
      return null;
    }
  }
}
