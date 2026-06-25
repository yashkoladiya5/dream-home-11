import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';
import '../../data/models/saved_payment_method.dart';

final paymentMethodsProvider = FutureProvider<List<SavedPaymentMethod>>((ref) async {
  final dio = ref.watch(apiClientProvider);
  final response = await dio.get('/api/v1/payment-methods');
  return (response.data as List)
      .map((e) => SavedPaymentMethod.fromJson(e as Map<String, dynamic>))
      .toList();
});

final paymentMethodCategoriesProvider = FutureProvider<List<PaymentMethodCategory>>((ref) async {
  final dio = ref.watch(apiClientProvider);
  final response = await dio.get('/api/v1/payment-methods/categories');
  final data = response.data as Map<String, dynamic>;
  return (data['categories'] as List)
      .map((e) => PaymentMethodCategory.fromJson(e as Map<String, dynamic>))
      .toList();
});

final paymentMethodsNotifierProvider = Provider<PaymentMethodsNotifier>((ref) {
  final dio = ref.watch(apiClientProvider);
  return PaymentMethodsNotifier(dio, ref);
});

class PaymentMethodsNotifier {
  final Dio _dio;
  final Ref _ref;

  PaymentMethodsNotifier(this._dio, this._ref);

  Future<bool> addMethod({
    required String category,
    required String label,
    required String displayValue,
    String? providerName,
  }) async {
    try {
      await _dio.post('/api/v1/payment-methods', data: {
        'category': category,
        'label': label,
        'displayValue': displayValue,
        'providerName': ?providerName,
      });
      _ref.invalidate(paymentMethodsProvider);
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> removeMethod(String id) async {
    try {
      await _dio.delete('/api/v1/payment-methods/$id');
      _ref.invalidate(paymentMethodsProvider);
      return true;
    } catch (_) {
      return false;
    }
  }
}
