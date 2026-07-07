import '../../../../core/network/base_repository.dart';
import 'package:dio/dio.dart';

abstract class ContestsRepository extends BaseRepository {
  ContestsRepository(super.dio);

  Future<Response<Map<String, dynamic>>> getContests();
  Future<Response<Map<String, dynamic>>> getContestById(String id);
  Future<Response<Map<String, dynamic>>> joinContest(String id);
}
