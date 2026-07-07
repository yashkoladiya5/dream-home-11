import '../../../../core/network/base_repository.dart';
import 'package:dio/dio.dart';

abstract class ConfigRepository extends BaseRepository {
  ConfigRepository(super.dio);

  Future<Response<Map<String, dynamic>>> getConfig();
}
