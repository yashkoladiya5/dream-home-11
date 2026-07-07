import '../../../../core/network/base_repository.dart';
import 'package:dio/dio.dart';

abstract class BannersRepository extends BaseRepository {
  BannersRepository(super.dio);

  Future<Response<Map<String, dynamic>>> getBanners();
}
