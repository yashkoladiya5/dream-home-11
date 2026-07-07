import '../../../../core/network/base_repository.dart';
import 'package:dio/dio.dart';

abstract class AuthRepository extends BaseRepository {
  AuthRepository(super.dio);

  Future<Response<Map<String, dynamic>>> sendOtp(String phone);
  Future<Response<Map<String, dynamic>>> verifyOtp(String phone, String otp);
  Future<Response<Map<String, dynamic>>> refreshToken(String refreshToken);
  Future<Response<Map<String, dynamic>>> getProfile();
}
