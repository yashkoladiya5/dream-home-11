import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';
import '../../data/models/referral_stats.dart';

final referralStatsProvider = FutureProvider.autoDispose<ReferralStats>((ref) async {
  final dio = ref.watch(apiClientProvider);
  final response = await dio.get('/api/v1/referral/stats');
  return ReferralStats.fromJson(response.data as Map<String, dynamic>);
});

final referralHistoryProvider = FutureProvider.autoDispose<List<ReferralHistoryItem>>((ref) async {
  final dio = ref.watch(apiClientProvider);
  final response = await dio.get('/api/v1/referral/history');
  final list = response.data as List<dynamic>;
  return list.map((e) => ReferralHistoryItem.fromJson(e as Map<String, dynamic>)).toList();
});

final referralApplyProvider = FutureProvider.autoDispose.family<Map<String, dynamic>, String>((ref, code) async {
  final dio = ref.watch(apiClientProvider);
  final response = await dio.post('/api/v1/referral/apply', data: {'code': code});
  return response.data as Map<String, dynamic>;
});
