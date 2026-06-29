import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'admin_dashboard_provider.dart';
import '../../data/models/admin_user_detail.dart';

final adminUserDetailProvider = FutureProvider.family<AdminUserDetail, String>((ref, userId) async {
  final service = ref.watch(adminApiServiceProvider);
  return service.getUserById(userId);
});
