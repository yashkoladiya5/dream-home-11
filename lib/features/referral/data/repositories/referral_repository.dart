import '../../../../core/network/base_repository.dart';
import 'package:dio/dio.dart';

abstract class ReferralRepository extends BaseRepository {
  ReferralRepository(super.dio);

  Future<Response<Map<String, dynamic>>> getReferralStats();
  Future<Response<Map<String, dynamic>>> getReferralHistory();
  Future<Response<Map<String, dynamic>>> applyReferralCode(String code);
}
