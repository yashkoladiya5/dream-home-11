import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../../../core/network/api_client.dart';
import 'auth_state.dart';

final secureStorageProvider = Provider<FlutterSecureStorage>((ref) {
  return const FlutterSecureStorage();
});

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final dio = ref.watch(apiClientProvider);
  final storage = ref.watch(secureStorageProvider);
  return AuthNotifier(dio, storage);
});

class AuthNotifier extends StateNotifier<AuthState> {
  final Dio _dio;
  final FlutterSecureStorage _storage;

  AuthNotifier(this._dio, this._storage) : super(AuthState());

  Future<void> sendOtp(String phoneNumber) async {
    state = state.copyWith(status: AuthStatus.loading);
    try {
      final formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : '+91$phoneNumber';
      
      await _dio.post(
        '/api/v1/auth/request-otp',
        data: {
          'phoneNumber': formattedPhone,
        },
      );

      state = state.copyWith(
        phoneNumber: formattedPhone,
        status: AuthStatus.codeSent,
      );
    } on DioException catch (e) {
      final responseData = e.response?.data;
      String errMsg = 'Failed to request OTP code. Please try again.';
      if (responseData is Map && responseData.containsKey('message')) {
        final msg = responseData['message'];
        if (msg is List) {
          errMsg = msg.join(', ');
        } else if (msg is String) {
          errMsg = msg;
        }
      }
      state = state.copyWith(
        status: AuthStatus.error,
        errorMessage: errMsg,
      );
    } catch (e) {
      state = state.copyWith(
        status: AuthStatus.error,
        errorMessage: 'An unexpected connection error occurred.',
      );
    }
  }

  Future<void> verifyOtp(String otp, String deviceId) async {
    state = state.copyWith(status: AuthStatus.loading);
    try {
      final mockFirebaseToken = 'mock-token-${state.phoneNumber}';

      final response = await _dio.post(
        '/api/v1/auth/verify-otp',
        data: {
          'idToken': mockFirebaseToken,
          'deviceId': deviceId,
          'otpCode': otp,
        },
      );

      final token = response.data['token'] as String?;
      if (token != null) {
        await _storage.write(key: 'session_token', value: token);
        state = state.copyWith(
          status: AuthStatus.verified,
          sessionToken: token,
        );
      } else {
        state = state.copyWith(
          status: AuthStatus.error,
          errorMessage: 'Server did not return a valid session token.',
        );
      }
    } on DioException catch (e) {
      final responseData = e.response?.data;
      String errMsg = 'Verification failed. Please try again.';
      if (responseData is Map && responseData.containsKey('message')) {
        final msg = responseData['message'];
        if (msg is List) {
          errMsg = msg.join(', ');
        } else if (msg is String) {
          errMsg = msg;
        }
      }
      state = state.copyWith(
        status: AuthStatus.error,
        errorMessage: errMsg,
      );
    } catch (e) {
      state = state.copyWith(
        status: AuthStatus.error,
        errorMessage: 'An unexpected connection error occurred.',
      );
    }
  }

  Future<bool> checkPersistence() async {
    final token = await _storage.read(key: 'session_token');
    if (token != null && token.isNotEmpty) {
      state = state.copyWith(
        status: AuthStatus.verified,
        sessionToken: token,
      );
      return true;
    }
    return false;
  }

  Future<void> logout() async {
    await _storage.delete(key: 'session_token');
    state = AuthState();
  }
}
