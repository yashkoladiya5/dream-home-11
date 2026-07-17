import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
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

  // Performs deposit by creating an order and executing a mock verification
  Future<UserProfile?> deposit(double amount) async {
    try {
      final orderRes = await _dio.post('/api/v1/payments/order', data: {'amount': amount});
      final orderId = orderRes.data['orderId'] as String;

      final mockPayId = 'pay_${DateTime.now().millisecondsSinceEpoch}';
      final verifyRes = await _dio.post('/api/v1/payments/verify', data: {
        'orderId': orderId,
        'paymentId': mockPayId,
      });

      if (verifyRes.data['success'] == true) {
        final profileRes = await _dio.get('/api/v1/users/profile');
        return UserProfile.fromJson(profileRes.data as Map<String, dynamic>);
      }
      return null;
    } catch (e) {
      debugPrint('[DepositNotifier] deposit error: $e');
      return null;
    }
  }
}
