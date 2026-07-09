import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';

class BankDetails {
  final String? bankAccountNumber;
  final String? bankIfsc;
  final String? bankName;
  final String? upiId;
  final String? accountHolderName;

  const BankDetails({
    this.bankAccountNumber,
    this.bankIfsc,
    this.bankName,
    this.upiId,
    this.accountHolderName,
  });

  factory BankDetails.fromJson(Map<String, dynamic> json) {
    return BankDetails(
      bankAccountNumber: json['bankAccountNumber'] as String?,
      bankIfsc: json['bankIfsc'] as String?,
      bankName: json['bankName'] as String?,
      upiId: json['upiId'] as String?,
      accountHolderName: json['fullName'] as String?,
    );
  }

  bool get hasAny =>
      (bankAccountNumber != null && bankIfsc != null) || upiId != null;
}

final bankDetailsProvider =
    StateNotifierProvider<BankDetailsNotifier, BankDetails?>((ref) {
  final dio = ref.watch(apiClientProvider);
  return BankDetailsNotifier(dio);
});

class BankDetailsNotifier extends StateNotifier<BankDetails?> {
  final Dio _dio;

  BankDetailsNotifier(this._dio) : super(null) {
    _load();
  }

  Future<void> _load() async {
    try {
      final response = await _dio.get('/api/v1/users/profile');
      state = BankDetails.fromJson(response.data as Map<String, dynamic>);
    } catch (_) {
      state = null;
    }
  }

  Future<bool> updateBankDetails({
    String? bankAccountNumber,
    String? bankIfsc,
    String? bankName,
    String? upiId,
  }) async {
    try {
      final response = await _dio.patch('/api/v1/users/bank-details', data: {
        'bankAccountNumber':? bankAccountNumber,
        'bankIfsc':? bankIfsc,
        'bankName':? bankName,
        'upiId':? upiId,
      });
      state = BankDetails.fromJson(response.data as Map<String, dynamic>);
      return true;
    } catch (_) {
      return false;
    }
  }

  void refresh() => _load();
}
