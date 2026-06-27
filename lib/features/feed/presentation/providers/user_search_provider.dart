import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';

class UserSearchResult {
  final String id;
  final String? fullName;
  final String? avatarUrl;
  final String? currentTier;
  final int lifetimePoints;

  UserSearchResult({
    required this.id,
    this.fullName,
    this.avatarUrl,
    this.currentTier,
    required this.lifetimePoints,
  });

  factory UserSearchResult.fromJson(Map<String, dynamic> json) {
    return UserSearchResult(
      id: json['id'] as String,
      fullName: json['fullName'] as String?,
      avatarUrl: json['avatarUrl'] as String?,
      currentTier: json['currentTier'] as String?,
      lifetimePoints: json['lifetimePoints'] as int? ?? 0,
    );
  }
}

final userSearchProvider = StateNotifierProvider<UserSearchNotifier, AsyncValue<List<UserSearchResult>>>((ref) {
  final dio = ref.watch(apiClientProvider);
  return UserSearchNotifier(dio);
});

class UserSearchNotifier extends StateNotifier<AsyncValue<List<UserSearchResult>>> {
  final Dio _dio;
  String _currentQuery = '';

  UserSearchNotifier(this._dio) : super(const AsyncValue.data([]));

  Future<void> search(String query) async {
    _currentQuery = query;
    if (query.trim().isEmpty) {
      state = const AsyncValue.data([]);
      return;
    }

    state = const AsyncValue.loading();
    try {
      final response = await _dio.get('/api/v1/users/search', queryParameters: {
        'q': query.trim(),
        'limit': 30,
      });
      final data = response.data as Map<String, dynamic>;
      final list = (data['users'] as List<dynamic>)
          .map((e) => UserSearchResult.fromJson(e as Map<String, dynamic>))
          .toList();
      state = AsyncValue.data(list);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  void clearSearch() {
    _currentQuery = '';
    state = const AsyncValue.data([]);
  }
}

final topUsersProvider = FutureProvider<List<UserSearchResult>>((ref) async {
  final dio = ref.watch(apiClientProvider);
  try {
    final response = await dio.get('/api/v1/leaderboard', queryParameters: {
      'limit': 20,
      'cycle': 'all_time',
    });
    final data = response.data as Map<String, dynamic>;
    final entries = data['entries'] as List<dynamic>;
    return entries.map((e) {
      final entry = e as Map<String, dynamic>;
      return UserSearchResult(
        id: entry['userId'] as String,
        fullName: entry['fullName'] as String?,
        avatarUrl: entry['avatarUrl'] as String?,
        currentTier: entry['currentTier'] as String?,
        lifetimePoints: (entry['score'] as num?)?.toInt() ?? 0,
      );
    }).toList();
  } catch (e) {
    return [];
  }
});
