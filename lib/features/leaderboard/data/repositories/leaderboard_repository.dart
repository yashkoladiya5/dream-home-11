import 'package:dio/dio.dart';
import '../models/leaderboard_models.dart';

class LeaderboardRepository {
  final Dio _dio;

  LeaderboardRepository(this._dio);

  String _cycleParam(LeaderboardCycle cycle) {
    switch (cycle) {
      case LeaderboardCycle.weekly:
        return 'weekly';
      case LeaderboardCycle.monthly:
        return 'monthly';
      default:
        return 'all_time';
    }
  }

  Future<LeaderboardResponse> getGlobalLeaderboard({
    int page = 1,
    int limit = 20,
    LeaderboardCycle cycle = LeaderboardCycle.allTime,
  }) async {
    final response = await _dio.get('/api/v1/leaderboard', queryParameters: {
      'page': page,
      'limit': limit,
      'cycle': _cycleParam(cycle),
    });
    return LeaderboardResponse.fromJson(response.data as Map<String, dynamic>);
  }

  Future<LeaderboardResponse> searchUsers({
    required String query,
    int page = 1,
    int limit = 20,
    LeaderboardCycle cycle = LeaderboardCycle.allTime,
  }) async {
    final response = await _dio.get('/api/v1/leaderboard/search', queryParameters: {
      'q': query,
      'page': page,
      'limit': limit,
      'cycle': _cycleParam(cycle),
    });
    return LeaderboardResponse.fromJson(response.data as Map<String, dynamic>);
  }
}
