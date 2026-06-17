import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';
import '../../data/models/user_profile.dart';

final userProfileProvider = StateNotifierProvider<UserProfileNotifier, AsyncValue<UserProfile>>((ref) {
  final dio = ref.watch(apiClientProvider);
  return UserProfileNotifier(dio);
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
    }
  }

  Future<bool> deposit(double amount) async {
    try {
      final response = await _dio.post('/api/v1/users/deposit', data: {'amount': amount});
      final data = UserProfile.fromJson(response.data as Map<String, dynamic>);
      state = AsyncValue.data(data);
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> joinContest(double entryFee, int pointsEarned) async {
    try {
      final response = await _dio.post('/api/v1/users/join-contest', data: {
        'entryFee': entryFee,
        'pointsEarned': pointsEarned,
      });
      final data = UserProfile.fromJson(response.data as Map<String, dynamic>);
      state = AsyncValue.data(data);
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> redeemReward(int pointsCost) async {
    try {
      final response = await _dio.post('/api/v1/users/redeem-reward', data: {'pointsCost': pointsCost});
      final data = UserProfile.fromJson(response.data as Map<String, dynamic>);
      state = AsyncValue.data(data);
      return true;
    } catch (_) {
      return false;
    }
  }
}

