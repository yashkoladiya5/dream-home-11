import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';
import '../../data/models/banner.dart';

final bannerProvider = FutureProvider<List<BannerModel>>((ref) async {
  final dio = ref.watch(apiClientProvider);
  final response = await dio.get('/api/v1/banners');
  return (response.data as List)
      .map((e) => BannerModel.fromJson(e as Map<String, dynamic>))
      .toList();
});
