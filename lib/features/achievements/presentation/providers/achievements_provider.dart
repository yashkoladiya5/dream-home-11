import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';
import '../../data/models/achievement.dart';

final achievementsProvider = FutureProvider<List<Achievement>>((ref) async {
  final dio = ref.watch(apiClientProvider);
  final response = await dio.get('/api/v1/achievements');
  return (response.data as List)
      .map((e) => Achievement.fromJson(e as Map<String, dynamic>))
      .toList();
});

final checkAchievementsProvider = FutureProvider.autoDispose<List<Achievement>>((ref) async {
  final dio = ref.watch(apiClientProvider);
  final response = await dio.post('/api/v1/achievements/check');
  return (response.data as List)
      .map((e) => Achievement.fromJson(e as Map<String, dynamic>))
      .toList();
});
