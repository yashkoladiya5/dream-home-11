import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';
import '../../data/models/contest_model.dart';
import '../../data/models/activity_event.dart';
import '../../data/models/leaderboard_entry.dart';

final contestListProvider = StateNotifierProvider<ContestListNotifier, AsyncValue<List<ContestModel>>>((ref) {
  final dio = ref.watch(apiClientProvider);
  return ContestListNotifier(dio);
});

class ContestListNotifier extends StateNotifier<AsyncValue<List<ContestModel>>> {
  final Dio _dio;
  List<ContestModel>? _cachedContests;
  DateTime? _lastFetch;
  static const Duration _cacheDuration = Duration(seconds: 60);
  final Set<String> _joinedContestIds = {};
  List<ContestModel> _myContests = [];

  ContestListNotifier(this._dio) : super(const AsyncValue.loading()) {
    fetchContests();
  }

  bool isJoined(String contestId) => _joinedContestIds.contains(contestId);

  Future<void> fetchContests({String? type, String? status}) async {
    if (_cachedContests != null && _lastFetch != null &&
        DateTime.now().difference(_lastFetch!) < _cacheDuration &&
        type == null && status == null) {
      state = AsyncValue.data(_cachedContests!);
      return;
    }

    state = const AsyncValue.loading();
    try {
      final queryParams = <String, dynamic>{};
      if (type != null) queryParams['type'] = type;
      if (status != null) queryParams['status'] = status;
      queryParams['limit'] = 50;

      final response = await _dio.get('/api/v1/contests', queryParameters: queryParams);
      final data = response.data as Map<String, dynamic>;
      final list = (data['contests'] as List<dynamic>)
          .map((e) => ContestModel.fromJson(e as Map<String, dynamic>))
          .toList();

      _cachedContests = list;
      _lastFetch = DateTime.now();
      state = AsyncValue.data(list);
    } catch (e, stack) {
      if (_cachedContests != null) {
        state = AsyncValue.data(_cachedContests!);
      } else {
        state = AsyncValue.error(e, stack);
      }
    }
  }

  Future<ContestModel?> lookupContestByCode(String code) async {
    final upperCode = code.toUpperCase();
    debugPrint('[ContestProvider] lookupContestByCode called with: "$code" → uppercased: "$upperCode"');
    try {
      final response = await _dio.get('/api/v1/contests/code/$upperCode');
      debugPrint('[ContestProvider] Response statusCode: ${response.statusCode}');
      debugPrint('[ContestProvider] Response data type: ${response.data.runtimeType}');
      debugPrint('[ContestProvider] Response data: ${response.data}');
      if (response.data == null) {
        debugPrint('[ContestProvider] response.data is null → returning null');
        return null;
      }
      final contest = ContestModel.fromJson(response.data as Map<String, dynamic>);
      debugPrint('[ContestProvider] Parsed ContestModel — id: ${contest.id}, status: "${contest.status}", inviteCode: "${contest.inviteCode}"');
      return contest;
    } on DioException catch (e) {
      debugPrint('[ContestProvider] DioException: type=${e.type}, statusCode=${e.response?.statusCode}, message=${e.message}');
      if (e.response?.statusCode == 404) {
        debugPrint('[ContestProvider] 404 not found → returning null');
        return null;
      }
      debugPrint('[ContestProvider] Non-404 DioException → rethrowing');
      rethrow;
    }
  }

  Future<void> refreshContests() async {
    _lastFetch = null;
    await fetchContests();
  }

  ContestModel? getContestById(String id) {
    if (_cachedContests == null) return null;
    try {
      return _cachedContests!.firstWhere((c) => c.id == id);
    } catch (_) {
      return null;
    }
  }

  List<ContestModel> filterByStatus(String status) {
    if (_cachedContests == null) return [];
    return _cachedContests!.where((c) => c.status == status).toList();
  }

  Future<Map<String, dynamic>?> createPrivateContest({
    required String title,
    required double entryFeeInr,
    required int pointsToJoin,
    required int maxSlots,
    String? prize,
    String? rules,
  }) async {
    final payload = <String, dynamic>{
      'title': title,
      'entryFeeInr': entryFeeInr,
      'pointsToJoin': pointsToJoin,
      'maxSlots': maxSlots,
    };
    if (prize != null) payload['prize'] = prize;
    if (rules != null) payload['rules'] = rules;
    debugPrint('[ContestProvider] createPrivateContest payload: $payload');
    try {
      final response = await _dio.post('/api/v1/contests/private', data: payload);
      final data = response.data as Map<String, dynamic>;
      debugPrint('[ContestProvider] createPrivateContest response: $data');
      final contestData = data['contest'] as Map<String, dynamic>;
      debugPrint('[ContestProvider] contest data includes rules? ${contestData.containsKey('rules')}, rules value: "${contestData['rules']}"');
      final contest = ContestModel.fromJson(contestData);
      _joinedContestIds.add(contest.id);
      if (_cachedContests != null) {
        _cachedContests = [contest, ..._cachedContests!];
        state = AsyncValue.data(_cachedContests!);
      }
      return {'contest': contest, 'inviteCode': data['inviteCode'] as String};
    } catch (e) {
      debugPrint('[ContestProvider] createPrivateContest error: $e');
      return null;
    }
  }

  void updateContestAfterJoin(String contestId) {
    if (_cachedContests == null) return;
    _joinedContestIds.add(contestId);
    _cachedContests = _cachedContests!.map((c) {
      if (c.id == contestId) {
        return ContestModel(
          id: c.id,
          title: c.title,
          type: c.type,
          entryFeeInr: c.entryFeeInr,
          pointsToJoin: c.pointsToJoin,
          maxSlots: c.maxSlots,
          filledSlots: c.filledSlots + 1,
          prize: c.prize,
          badgeText: c.badgeText,
          badgeColor: c.badgeColor,
          rules: c.rules,
          inviteCode: c.inviteCode,
          startTime: c.startTime,
          endTime: c.endTime,
          status: c.status,
        );
      }
      return c;
    }).toList();
    state = AsyncValue.data(_cachedContests!);
  }
}
