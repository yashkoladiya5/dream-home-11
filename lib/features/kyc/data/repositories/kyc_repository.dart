import '../../../../core/network/base_repository.dart';
import 'package:dio/dio.dart';

abstract class KycRepository extends BaseRepository {
  KycRepository(super.dio);

  Future<Response<Map<String, dynamic>>> getKycStatus();
  Future<Response<Map<String, dynamic>>> submitKyc(Map data);
}
