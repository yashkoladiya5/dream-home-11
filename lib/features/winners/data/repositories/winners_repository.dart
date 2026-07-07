import '../../../../core/network/base_repository.dart';
import 'package:dio/dio.dart';

abstract class WinnersRepository extends BaseRepository {
  WinnersRepository(super.dio);

  Future<Response<Map<String, dynamic>>> getWinners();
  Future<Response<Map<String, dynamic>>> getWinnersByContest(String contestId);
}
