import '../../../../core/network/base_repository.dart';
import 'package:dio/dio.dart';

abstract class ShareTrackerRepository extends BaseRepository {
  ShareTrackerRepository(super.dio);

  Future<Response<Map<String, dynamic>>> trackShare(String channel);
}
