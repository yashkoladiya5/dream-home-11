import '../../../../core/network/base_repository.dart';
import 'package:dio/dio.dart';

abstract class DashboardRepository extends BaseRepository {
  DashboardRepository(super.dio);

  Future<Response<Map<String, dynamic>>> getDashboardData();
}
