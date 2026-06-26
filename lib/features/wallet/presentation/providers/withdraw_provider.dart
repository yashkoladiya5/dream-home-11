import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';
import '../../data/models/withdraw_model.dart';

final withdrawProvider = Provider<WithdrawNotifier>((ref) {
  final dio = ref.watch(apiClientProvider);
  return WithdrawNotifier(dio);
});

final withdrawHistoryProvider = FutureProvider.family<WithdrawalHistory, int>((ref, page) async {
  final dio = ref.watch(apiClientProvider);
  final response = await dio.get('/api/v1/payments/withdraw/history', queryParameters: {'page': page, 'limit': 20});
  return WithdrawalHistory.fromJson(response.data as Map<String, dynamic>);
});

class WithdrawNotifier {
  final Dio _dio;

  WithdrawNotifier(this._dio);

  Future<WithdrawResponse?> requestWithdrawal({
    required double amount,
    String? bankAccountNumber,
    String? bankIfsc,
    String? bankName,
    String? upiId,
  }) async {
    try {
      final response = await _dio.post('/api/v1/payments/withdraw', data: {
        'amount': amount,
        if (bankAccountNumber != null) 'bankAccountNumber': bankAccountNumber,
        if (bankIfsc != null) 'bankIfsc': bankIfsc,
        if (bankName != null) 'bankName': bankName,
        if (upiId != null) 'upiId': upiId,
      });
      return WithdrawResponse.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      final message = e.response?.data?['message'] as String? ?? e.message ?? 'Withdrawal failed';
      throw Exception(message);
    }
  }
}
