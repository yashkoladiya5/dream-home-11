import '../../../../core/network/base_repository.dart';
import 'package:dio/dio.dart';

abstract class FeedRepository extends BaseRepository {
  FeedRepository(super.dio);

  Future<Response<Map<String, dynamic>>> getFeed();
}
