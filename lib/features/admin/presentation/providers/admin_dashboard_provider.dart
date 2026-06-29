import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';
import '../../data/services/admin_api_service.dart';
import '../../data/models/dashboard_stats.dart';

final adminApiServiceProvider = Provider<AdminApiService>((ref) {
  final dio = ref.watch(apiClientProvider);
  return AdminApiService(dio);
});

final adminDashboardProvider = FutureProvider<DashboardStats>((ref) async {
  final service = ref.watch(adminApiServiceProvider);
  return service.getDashboardStats();
});
