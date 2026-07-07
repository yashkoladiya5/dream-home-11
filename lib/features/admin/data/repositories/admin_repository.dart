import '../../../../core/network/base_repository.dart';
import 'package:dio/dio.dart';

abstract class AdminRepository extends BaseRepository {
  AdminRepository(super.dio);

  Future<Response<Map<String, dynamic>>> getDashboard();
  Future<Response<Map<String, dynamic>>> getUsers(Map params);
  Future<Response<Map<String, dynamic>>> getUserById(String id);
  Future<Response<Map<String, dynamic>>> updateUser(String id, Map data);
  Future<Response<Map<String, dynamic>>> getContests(Map params);
  Future<Response<Map<String, dynamic>>> getContestById(String id);
  Future<Response<Map<String, dynamic>>> getKycList(Map params);
  Future<Response<Map<String, dynamic>>> approveKyc(String id);
  Future<Response<Map<String, dynamic>>> rejectKyc(String id, Map data);
  Future<Response<Map<String, dynamic>>> updateConfig(Map config);
  Future<Response<Map<String, dynamic>>> getSupportTickets(Map params);
  Future<Response<Map<String, dynamic>>> compensateContest(String contestId);
  Future<Response<Map<String, dynamic>>> processPendingCompensations();
  Future<Response<Map<String, dynamic>>> getCompensations(Map params);
  Future<Response<Map<String, dynamic>>> getCompensationStats();
  Future<Response<Map<String, dynamic>>> exportCompensations(Map params);
}
