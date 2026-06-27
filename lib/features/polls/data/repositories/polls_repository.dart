import 'package:dio/dio.dart';
import '../models/poll_models.dart';

class PollsRepository {
  final Dio _dio;

  PollsRepository(this._dio);

  Future<ActivePollResponse?> getActivePoll() async {
    final response = await _dio.get('/api/v1/polls/active');
    final data = response.data as Map<String, dynamic>;
    if (data.containsKey('poll')) {
      return ActivePollResponse.fromJson(data);
    }
    return null;
  }

  Future<PollVoteResponse> vote({
    required String pollId,
    required int selectedOption,
  }) async {
    final response = await _dio.post('/api/v1/polls/vote', data: {
      'pollId': pollId,
      'selectedOption': selectedOption,
    });
    return PollVoteResponse.fromJson(response.data as Map<String, dynamic>);
  }

  Future<PollResults> getResults(String pollId) async {
    final response = await _dio.get('/api/v1/polls/$pollId/results');
    return PollResults.fromJson(response.data as Map<String, dynamic>);
  }
}
