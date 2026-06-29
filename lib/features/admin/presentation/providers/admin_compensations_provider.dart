import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';
import '../../data/services/admin_api_service.dart';

final adminCompensationsProvider = FutureProvider.family<Map<String, dynamic>, ({int page, String? status})>((ref, params) async {
  final dio = ref.watch(apiClientProvider);
  final service = AdminApiService(dio);
  return service.getCompensationLogs(page: params.page, limit: 20, status: params.status);
});

final adminCompensationStatsProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final dio = ref.watch(apiClientProvider);
  final service = AdminApiService(dio);
  return service.getCompensationStatsDetailed();
});
