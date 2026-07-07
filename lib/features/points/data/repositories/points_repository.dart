import '../../../../core/network/base_repository.dart';
import 'package:dio/dio.dart';

abstract class PointsRepository extends BaseRepository {
  PointsRepository(super.dio);

  Future<Response<Map<String, dynamic>>> getPointHistory();
}
