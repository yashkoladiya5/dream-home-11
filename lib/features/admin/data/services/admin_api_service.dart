import 'package:dio/dio.dart';
import '../models/dashboard_stats.dart';
import '../models/admin_user_detail.dart';

class AdminApiService {
  final Dio _dio;

  AdminApiService(this._dio);

  Future<DashboardStats> getDashboardStats() async {
    final response = await _dio.get('/api/v1/admin/dashboard');
    return DashboardStats.fromJson(response.data);
  }

  Future<Map<String, dynamic>> getUsers({
    int page = 1,
    int limit = 20,
    String? search,
    String? role,
    bool? isActive,
    String? tier,
    String? kycStatus,
  }) async {
    final params = <String, dynamic>{
      'page': page,
      'limit': limit,
      if (search != null) 'search': search,
      if (role != null) 'role': role,
      if (isActive != null) 'isActive': isActive,
      if (tier != null) 'tier': tier,
      if (kycStatus != null) 'kycStatus': kycStatus,
    };
    final response =
        await _dio.get('/api/v1/admin/users', queryParameters: params);
    return response.data as Map<String, dynamic>;
  }

  Future<AdminUserDetail> getUserById(String id) async {
    final response = await _dio.get('/api/v1/admin/users/$id');
    return AdminUserDetail.fromJson(response.data);
  }

  Future<Map<String, dynamic>> updateUser(
      String id, Map<String, dynamic> data) async {
    final response = await _dio.patch('/api/v1/admin/users/$id', data: data);
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getContests({
    int page = 1,
    int limit = 20,
    String? status,
    String? type,
    String? search,
  }) async {
    final params = <String, dynamic>{
      'page': page,
      'limit': limit,
      if (status != null) 'status': status,
      if (type != null) 'type': type,
      if (search != null) 'search': search,
    };
    final response =
        await _dio.get('/api/v1/admin/contests', queryParameters: params);
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getContestById(String id) async {
    final response = await _dio.get('/api/v1/admin/contests/$id');
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getKycSubmissions({
    int page = 1,
    int limit = 20,
    String? status,
    String? userId,
  }) async {
    final params = <String, dynamic>{
      'page': page,
      'limit': limit,
      if (status != null) 'status': status,
      if (userId != null) 'userId': userId,
    };
    final response =
        await _dio.get('/api/v1/admin/kyc', queryParameters: params);
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> approveKyc(String id) async {
    final response = await _dio.patch('/api/v1/admin/kyc/$id/approve');
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> rejectKyc(String id, {String? reason}) async {
    final data =
        reason != null ? {'reason': reason} : <String, dynamic>{};
    final response =
        await _dio.patch('/api/v1/admin/kyc/$id/reject', data: data);
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> updateConfig(
      Map<String, dynamic> config) async {
    final response =
        await _dio.patch('/api/v1/admin/config', data: config);
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getSupportTickets({
    int page = 1,
    int limit = 20,
    String? status,
    String? category,
  }) async {
    final params = <String, dynamic>{
      'page': page,
      'limit': limit,
      if (status != null) 'status': status,
      if (category != null) 'category': category,
    };
    final response = await _dio.get('/api/v1/admin/support-tickets',
        queryParameters: params);
    return response.data as Map<String, dynamic>;
  }
}
