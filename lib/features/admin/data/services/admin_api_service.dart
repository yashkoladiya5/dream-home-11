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
      'search':? search,
      'role':? role,
      'isActive':? isActive,
      'tier':? tier,
      'kycStatus':? kycStatus,
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
      'status':? status,
      'type':? type,
      'search':? search,
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
      'status':? status,
      'userId':? userId,
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
      'status':? status,
      'category':? category,
    };
    final response = await _dio.get('/api/v1/admin/support-tickets',
        queryParameters: params);
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> compensateContest(String contestId) async {
    final response = await _dio.post('/api/v1/admin/contests/$contestId/compensate');
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> processPendingCompensations() async {
    final response = await _dio.post('/api/v1/admin/compensations/process-pending');
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getCompensationLogs({
    int page = 1,
    int limit = 20,
    String? status,
  }) async {
    final params = <String, dynamic>{
      'page': page,
      'limit': limit,
      'status':? status,
    };
    final response = await _dio.get('/api/v1/admin/compensations',
        queryParameters: params);
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getCompensationStatsDetailed() async {
    final response = await _dio.get('/api/v1/admin/compensations/stats');
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> exportCompensations({String? status}) async {
    final params = <String, dynamic>{};
    if (status != null) params['status'] = status;
    final response = await _dio.get('/api/v1/admin/compensations/export', queryParameters: params);
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> broadcastNotification({
    required String title,
    required String message,
    String? tier,
  }) async {
    final data = <String, dynamic>{
      'title': title,
      'message': message,
      'tier':? tier,
    };
    final response = await _dio.post('/api/v1/admin/notifications/broadcast', data: data);
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> broadcastSms({
    required String message,
    String? tier,
  }) async {
    final data = <String, dynamic>{
      'message': message,
      'tier':? tier,
    };
    final response = await _dio.post('/api/v1/admin/notifications/broadcast-sms', data: data);
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getAuditLogs({
    int page = 1,
    int limit = 20,
    String? action,
  }) async {
    final params = <String, dynamic>{
      'page': page,
      'limit': limit,
      'action':? action,
    };
    final response = await _dio.get('/api/v1/admin/audit-logs', queryParameters: params);
    return response.data as Map<String, dynamic>;
  }
}
