import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';
import '../../data/models/system_config.dart';

final systemConfigProvider = FutureProvider<SystemConfig>((ref) async {
  final dio = ref.watch(apiClientProvider);
  final response = await dio.get('/api/v1/config');
  return SystemConfig.fromJson(response.data as Map<String, dynamic>);
});
