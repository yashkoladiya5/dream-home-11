import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';
import '../../data/models/transaction.dart';
import '../../data/models/wallet_summary.dart';

final transactionHistoryProvider = FutureProvider<List<TransactionModel>>((ref) async {
  final dio = ref.watch(apiClientProvider);
  final response = await dio.get('/api/v1/transactions');
  final data = response.data as Map<String, dynamic>;
  return (data['transactions'] as List)
      .map((e) => TransactionModel.fromJson(e as Map<String, dynamic>))
      .toList();
});

final filteredTransactionProvider = FutureProvider.family<List<TransactionModel>, String>((ref, typeFilter) async {
  final dio = ref.watch(apiClientProvider);
  final response = await dio.get('/api/v1/transactions', queryParameters: {'type': typeFilter});
  final data = response.data as Map<String, dynamic>;
  return (data['transactions'] as List)
      .map((e) => TransactionModel.fromJson(e as Map<String, dynamic>))
      .toList();
});

final balanceSummaryProvider = FutureProvider<WalletSummary>((ref) async {
  final dio = ref.watch(apiClientProvider);
  final response = await dio.get('/api/v1/transactions/balance');
  return WalletSummary.fromJson(response.data as Map<String, dynamic>);
});
