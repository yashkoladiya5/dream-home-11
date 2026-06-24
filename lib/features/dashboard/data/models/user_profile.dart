class UserProfile {
  final String id;
  final String phoneNumber;
  final String? email;
  final String? fullName;
  final String? avatarUrl;
  final String currentTier;
  final int lifetimePoints;
  final double walletBalanceInr;
  final int pointsBalance;
  final int currentStreak;
  final int longestStreak;
  final KycProfile? kyc;

  UserProfile({
    required this.id,
    required this.phoneNumber,
    this.email,
    this.fullName,
    this.avatarUrl,
    required this.currentTier,
    required this.lifetimePoints,
    required this.walletBalanceInr,
    required this.pointsBalance,
    required this.currentStreak,
    required this.longestStreak,
    this.kyc,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      id: json['id'] as String,
      phoneNumber: json['phoneNumber'] as String,
      email: json['email'] as String?,
      fullName: json['fullName'] as String?,
      avatarUrl: json['avatarUrl'] as String?,
      currentTier: json['currentTier'] as String? ?? 'bronze',
      lifetimePoints: json['lifetimePoints'] as int? ?? 0,
      walletBalanceInr: double.tryParse(json['walletBalanceInr']?.toString() ?? '0.0') ?? 0.0,
      pointsBalance: json['pointsBalance'] as int? ?? 0,
      currentStreak: (json['currentStreak'] as num?)?.toInt() ?? 0,
      longestStreak: (json['longestStreak'] as num?)?.toInt() ?? 0,
      kyc: json['kyc'] != null ? KycProfile.fromJson(json['kyc'] as Map<String, dynamic>) : null,
    );
  }
}

class KycProfile {
  final String id;
  final String status; // 'pending', 'approved', 'rejected'
  final String? rejectionReason;

  KycProfile({
    required this.id,
    required this.status,
    this.rejectionReason,
  });

  factory KycProfile.fromJson(Map<String, dynamic> json) {
    return KycProfile(
      id: json['id'] as String,
      status: json['status'] as String? ?? 'pending',
      rejectionReason: json['rejectionReason'] as String?,
    );
  }
}
