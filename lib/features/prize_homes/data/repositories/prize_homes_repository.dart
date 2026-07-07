import '../../../../core/network/base_repository.dart';
import 'package:dio/dio.dart';

abstract class PrizeHomesRepository extends BaseRepository {
  PrizeHomesRepository(super.dio);

  Future<Response<Map<String, dynamic>>> getPrizeHomes();
}
