import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';
import '../../data/models/prize_home.dart';

final prizeHomeProvider = FutureProvider<List<PrizeHome>>((ref) async {
  final dio = ref.watch(apiClientProvider);
  final response = await dio.get('/api/v1/prize-homes');
  return (response.data as List)
      .map((e) => PrizeHome.fromJson(e as Map<String, dynamic>))
      .toList();
});

final prizeHomeCitiesProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final dio = ref.watch(apiClientProvider);
  final response = await dio.get('/api/v1/prize-homes/cities');
  return (response.data as List).cast<Map<String, dynamic>>();
});

final prizeHomeDetailProvider = FutureProvider.family<PrizeHome, String>((ref, id) async {
  final dio = ref.watch(apiClientProvider);
  final response = await dio.get('/api/v1/prize-homes/$id');
  return PrizeHome.fromJson(response.data as Map<String, dynamic>);
});
