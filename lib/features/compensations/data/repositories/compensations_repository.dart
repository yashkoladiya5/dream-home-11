import '../../../../core/network/base_repository.dart';
import 'package:dio/dio.dart';

abstract class CompensationsRepository extends BaseRepository {
  CompensationsRepository(super.dio);

  Future<Response<Map<String, dynamic>>> getCompensationHistory();
}
