import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';
import '../../data/models/kyc_status.dart';

final kycStatusProvider = FutureProvider<KycStatusModel>((ref) async {
  final dio = ref.watch(apiClientProvider);
  final response = await dio.get('/api/v1/kyc/status');
  return KycStatusModel.fromJson(response.data as Map<String, dynamic>);
});

final kycProvider = Provider<KycNotifier>((ref) {
  final dio = ref.watch(apiClientProvider);
  return KycNotifier(dio, ref);
});

class KycNotifier {
  final Dio _dio;
  final Ref _ref;

  KycNotifier(this._dio, this._ref);

  Future<KycSubmissionResponse?> submitKyc({
    required String aadhaarNumber,
    required String panNumber,
    required String fullName,
  }) async {
    try {
      final response = await _dio.post('/api/v1/kyc/submit', data: {
        'aadhaarNumber': aadhaarNumber,
        'panNumber': panNumber,
        'fullName': fullName,
      });
      _ref.invalidate(kycStatusProvider);
      return KycSubmissionResponse.fromJson(response.data as Map<String, dynamic>);
    } catch (_) {
      return null;
    }
  }
}
