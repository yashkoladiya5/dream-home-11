import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';
import '../../data/services/admin_api_service.dart';

final adminAuditLogsProvider = FutureProvider.family<Map<String, dynamic>, ({int page, String? action})>((ref, params) async {
  final dio = ref.watch(apiClientProvider);
  final service = AdminApiService(dio);
  return service.getAuditLogs(page: params.page, limit: 20, action: params.action);
});
