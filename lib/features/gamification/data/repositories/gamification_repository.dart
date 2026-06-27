import 'package:dio/dio.dart';
import '../models/spin_models.dart';

class GamificationRepository {
  final Dio _dio;

  GamificationRepository(this._dio);

  Future<SpinResult> spin() async {
    final response = await _dio.post('/api/v1/gamification/spin');
    return SpinResult.fromJson(response.data as Map<String, dynamic>);
  }

  Future<SpinStatus> getSpinStatus() async {
    final response = await _dio.get('/api/v1/gamification/spin/status');
    return SpinStatus.fromJson(response.data as Map<String, dynamic>);
  }
}
