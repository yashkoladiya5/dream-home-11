import '../../data/models/user_role.dart';

enum AuthStatus {
  initial,
  loading,
  codeSent,
  verified,
  error,
}

class AuthState {
  final String phoneNumber;
  final AuthStatus status;
  final String? errorMessage;
  final String? verificationId;
  final String? idToken;
  final String? sessionToken;
  final UserRole? role;

  AuthState({
    this.phoneNumber = '',
    this.status = AuthStatus.initial,
    this.errorMessage,
    this.verificationId,
    this.idToken,
    this.sessionToken,
    this.role,
  });

  AuthState copyWith({
    String? phoneNumber,
    AuthStatus? status,
    String? errorMessage,
    String? verificationId,
    String? idToken,
    String? sessionToken,
    UserRole? role,
  }) {
    return AuthState(
      phoneNumber: phoneNumber ?? this.phoneNumber,
      status: status ?? this.status,
      errorMessage: errorMessage, // allows resetting to null
      verificationId: verificationId ?? this.verificationId,
      idToken: idToken ?? this.idToken,
      sessionToken: sessionToken ?? this.sessionToken,
      role: role ?? this.role,
    );
  }
}
