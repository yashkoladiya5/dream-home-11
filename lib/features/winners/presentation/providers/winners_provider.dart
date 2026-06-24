import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';
import '../../data/models/winner.dart';

final winnersProvider = FutureProvider<List<WinnerContest>>((ref) async {
  final dio = ref.watch(apiClientProvider);
  final response = await dio.get('/api/v1/contests/winners');
  return (response.data as List)
      .map((e) => WinnerContest.fromJson(e as Map<String, dynamic>))
      .toList();
});
