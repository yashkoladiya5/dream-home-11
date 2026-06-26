import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';

class WithdrawStats {
  final double totalWithdrawn;
  final int pendingCount;
  final int approvedCount;
  final int rejectedCount;
  final int totalCount;

  const WithdrawStats({
    required this.totalWithdrawn,
    required this.pendingCount,
    required this.approvedCount,
    required this.rejectedCount,
    required this.totalCount,
  });

  factory WithdrawStats.fromJson(Map<String, dynamic> json) {
    return WithdrawStats(
      totalWithdrawn: (json['totalWithdrawn'] as num?)?.toDouble() ?? 0,
      pendingCount: (json['pendingCount'] as num?)?.toInt() ?? 0,
      approvedCount: (json['approvedCount'] as num?)?.toInt() ?? 0,
      rejectedCount: (json['rejectedCount'] as num?)?.toInt() ?? 0,
      totalCount: (json['totalCount'] as num?)?.toInt() ?? 0,
    );
  }
}

final withdrawStatsProvider = FutureProvider<WithdrawStats>((ref) async {
  final dio = ref.watch(apiClientProvider);
  final response = await dio.get('/api/v1/payments/withdraw/stats');
  return WithdrawStats.fromJson(response.data as Map<String, dynamic>);
});
