import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';
import '../../data/models/user_profile.dart';
import '../../data/models/user_stats.dart';

final userProfileProvider = StateNotifierProvider<UserProfileNotifier, AsyncValue<UserProfile>>((ref) {
  final dio = ref.watch(apiClientProvider);
  return UserProfileNotifier(dio);
});

final userStatsProvider = StateNotifierProvider<UserStatsNotifier, AsyncValue<UserStats>>((ref) {
  final dio = ref.watch(apiClientProvider);
  return UserStatsNotifier(dio);
});

class UserProfileNotifier extends StateNotifier<AsyncValue<UserProfile>> {
  final Dio _dio;

  UserProfileNotifier(this._dio) : super(const AsyncValue.loading()) {
    fetchProfile();
  }

  Future<void> fetchProfile() async {
    state = const AsyncValue.loading();
    try {
      final response = await _dio.get('/api/v1/users/me');
      final data = UserProfile.fromJson(response.data as Map<String, dynamic>);
      state = AsyncValue.data(data);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
      // Log the exact error to find which JSON field fails to parse
      print('PROFILE_LOAD_ERROR: $e');
      print(stack);
    }
  }

  Future<bool> deposit(double amount) async {
    try {
      final orderRes = await _dio.post('/api/v1/payments/order', data: {'amount': amount});
      final orderId = orderRes.data['orderId'] as String;

      final mockPayId = 'pay_${DateTime.now().millisecondsSinceEpoch}';
      final verifyRes = await _dio.post('/api/v1/payments/verify', data: {
        'orderId': orderId,
        'paymentId': mockPayId,
      });

      if (verifyRes.data['success'] == true) {
        await fetchProfile();
        return true;
      }
      return false;
    } catch (_) {
      return false;
    }
  }

  Future<Map<String, dynamic>?> joinContestById(String contestId) async {
    try {
      final response = await _dio.post('/api/v1/contests/$contestId/join');
      final data = response.data as Map<String, dynamic>;
      final userData = UserProfile.fromJson(data['user'] as Map<String, dynamic>);
      state = AsyncValue.data(userData);
      return data;
    } catch (_) {
      return null;
    }
  }

  Future<bool> updateProfile({String? fullName, String? email, String? avatarUrl}) async {
    try {
      final response = await _dio.patch('/api/v1/users/profile', data: {
        'fullName':? fullName,
        'email':? email,
        'avatarUrl':? avatarUrl,
      });
      final data = UserProfile.fromJson(response.data as Map<String, dynamic>);
      state = AsyncValue.data(data);
      return true;
    } catch (_) {
      return false;
    }
  }
}

class UserStatsNotifier extends StateNotifier<AsyncValue<UserStats>> {
  final Dio _dio;

  UserStatsNotifier(this._dio) : super(const AsyncValue.loading());

  Future<void> fetchStats() async {
    state = const AsyncValue.loading();
    try {
      final response = await _dio.get('/api/v1/users/me/stats');
      final data = UserStats.fromJson(response.data as Map<String, dynamic>);
      state = AsyncValue.data(data);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }
}

