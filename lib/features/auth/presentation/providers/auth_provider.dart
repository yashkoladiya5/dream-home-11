import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../../../core/network/api_client.dart';
import '../../../../main.dart';
import '../../data/models/user_role.dart';
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

  // Configuration flag to switch between mock and real Firebase Auth.
  static const bool useMockAuth = true;

  AuthNotifier(this._dio, this._storage) : super(AuthState());

  Future<void> sendOtp(String phoneNumber) async {
    state = state.copyWith(status: AuthStatus.loading);
    final formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : '+91$phoneNumber';

    // Check if we should use mock auth or if Firebase is not initialized
    if (useMockAuth || !isFirebaseInitialized) {
      try {
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
    } else {
      // Real Firebase Phone Auth triggers
      try {
        await FirebaseAuth.instance.verifyPhoneNumber(
          phoneNumber: formattedPhone,
          verificationCompleted: (PhoneAuthCredential credential) async {
            // Auto-retrieval or instant verification
            try {
              final userCredential = await FirebaseAuth.instance.signInWithCredential(credential);
              final idToken = await userCredential.user?.getIdToken();
              if (idToken != null) {
                await _verifyIdTokenWithBackend(idToken, 'firebase-device-uuid-999');
              } else {
                state = state.copyWith(
                  status: AuthStatus.error,
                  errorMessage: 'Failed to retrieve Firebase ID token.',
                );
              }
            } catch (e) {
              state = state.copyWith(
                status: AuthStatus.error,
                errorMessage: 'Firebase authentication failed: $e',
              );
            }
          },
          verificationFailed: (FirebaseAuthException e) {
            state = state.copyWith(
              status: AuthStatus.error,
              errorMessage: e.message ?? 'Firebase Phone Auth verification failed.',
            );
          },
          codeSent: (String verificationId, int? resendToken) {
            state = state.copyWith(
              phoneNumber: formattedPhone,
              status: AuthStatus.codeSent,
              verificationId: verificationId,
            );
          },
          codeAutoRetrievalTimeout: (String verificationId) {
            state = state.copyWith(verificationId: verificationId);
          },
        );
      } catch (e) {
        state = state.copyWith(
          status: AuthStatus.error,
          errorMessage: 'An unexpected Firebase Phone Auth error occurred.',
        );
      }
    }
  }

  Future<void> verifyOtp(String otp, String deviceId) async {
    state = state.copyWith(status: AuthStatus.loading);

    if (useMockAuth || !isFirebaseInitialized) {
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
          UserRole? userRole;
          final userData = response.data['user'] as Map<String, dynamic>?;
          if (userData != null && userData['role'] != null) {
            userRole = UserRole.fromString(userData['role'] as String);
          }
          state = state.copyWith(
            status: AuthStatus.verified,
            sessionToken: token,
            role: userRole,
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
    } else {
      // Real Firebase Phone Auth OTP verification
      try {
        if (state.verificationId == null) {
          state = state.copyWith(
            status: AuthStatus.error,
            errorMessage: 'Verification ID is missing. Please request OTP again.',
          );
          return;
        }

        final credential = PhoneAuthProvider.credential(
          verificationId: state.verificationId!,
          smsCode: otp,
        );

        final userCredential = await FirebaseAuth.instance.signInWithCredential(credential);
        final idToken = await userCredential.user?.getIdToken();

        if (idToken != null) {
          await _verifyIdTokenWithBackend(idToken, deviceId);
        } else {
          state = state.copyWith(
            status: AuthStatus.error,
            errorMessage: 'Failed to retrieve Firebase ID token.',
          );
        }
      } catch (e) {
        state = state.copyWith(
          status: AuthStatus.error,
          errorMessage: 'Invalid verification code. Please check and try again.',
        );
      }
    }
  }

  // Private helper to verify real Firebase ID Token with NestJS backend
  Future<void> _verifyIdTokenWithBackend(String idToken, String deviceId) async {
    try {
      final response = await _dio.post(
        '/api/v1/auth/verify-otp',
        data: {
          'idToken': idToken,
          'deviceId': deviceId,
        },
      );

      final token = response.data['token'] as String?;
      if (token != null) {
        await _storage.write(key: 'session_token', value: token);
        UserRole? userRole;
        final userData = response.data['user'] as Map<String, dynamic>?;
        if (userData != null && userData['role'] != null) {
          userRole = UserRole.fromString(userData['role'] as String);
        }
        state = state.copyWith(
          status: AuthStatus.verified,
          sessionToken: token,
          role: userRole,
        );
      } else {
        state = state.copyWith(
          status: AuthStatus.error,
          errorMessage: 'Server did not return a valid session token.',
        );
      }
    } on DioException catch (e) {
      final responseData = e.response?.data;
      String errMsg = 'Backend verification failed. Please try again.';
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
        errorMessage: 'An unexpected connection error occurred with the backend.',
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
      try {
        final response = await _dio.get('/api/v1/users/me');
        final userData = response.data as Map<String, dynamic>?;
        if (userData != null && userData['role'] != null) {
          final userRole = UserRole.fromString(userData['role'] as String);
          state = state.copyWith(role: userRole);
        }
      } catch (_) {}
      return true;
    }
    return false;
  }

  Future<void> logout() async {
    await _storage.delete(key: 'session_token');
    if (isFirebaseInitialized) {
      try {
        await FirebaseAuth.instance.signOut();
      } catch (_) {}
    }
    state = AuthState();
  }
}
