import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';
import '../../data/models/payment_order.dart';

final paymentProvider = Provider<PaymentNotifier>((ref) {
  final dio = ref.watch(apiClientProvider);
  return PaymentNotifier(dio);
});

class PaymentNotifier {
  final Dio _dio;

  PaymentNotifier(this._dio);

  Future<PaymentOrder?> createOrder(double amount, {String? paymentMethod}) async {
    try {
      final data = <String, dynamic>{'amount': amount};
      if (paymentMethod != null) data['paymentMethod'] = paymentMethod;
      final response = await _dio.post('/api/v1/payments/order', data: data);
      return PaymentOrder.fromJson(response.data as Map<String, dynamic>);
    } catch (e) {
      debugPrint('[PaymentNotifier] createOrder error: $e');
      return null;
    }
  }

  Future<PaymentVerification?> verifyPayment(String orderId, String paymentId) async {
    try {
      final response = await _dio.post('/api/v1/payments/verify', data: {
        'orderId': orderId,
        'paymentId': paymentId,
      });
      return PaymentVerification.fromJson(response.data as Map<String, dynamic>);
    } catch (e) {
      debugPrint('[PaymentNotifier] verifyPayment error: $e');
      return null;
    }
  }
}
