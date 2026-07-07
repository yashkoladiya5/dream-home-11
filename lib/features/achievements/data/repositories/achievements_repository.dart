import '../../../../core/network/base_repository.dart';
import 'package:dio/dio.dart';

abstract class AchievementsRepository extends BaseRepository {
  AchievementsRepository(super.dio);

  Future<Response<Map<String, dynamic>>> getAchievements();
  Future<Response<Map<String, dynamic>>> checkAchievements();
}
