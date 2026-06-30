import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';
import '../../data/models/compensation_log.dart';

final myCompensationsProvider = FutureProvider<List<CompensationLog>>((ref) async {
  final dio = ref.watch(apiClientProvider);
  final response = await dio.get('/api/v1/users/me/compensations');
  final data = response.data as Map<String, dynamic>;
  final list = data['compensations'] as List<dynamic>;
  return list.map((e) => CompensationLog.fromJson(e as Map<String, dynamic>)).toList();
});
