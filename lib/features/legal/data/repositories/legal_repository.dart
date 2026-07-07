import '../../../../core/network/base_repository.dart';
import 'package:dio/dio.dart';

abstract class LegalRepository extends BaseRepository {
  LegalRepository(super.dio);

  Future<Response<Map<String, dynamic>>> getPrivacyPolicy();
  Future<Response<Map<String, dynamic>>> getTermsOfService();
}
