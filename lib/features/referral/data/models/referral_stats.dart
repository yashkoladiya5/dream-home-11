class ReferralStats {
  final String referralCode;
  final int totalReferred;
  final int totalRewardsEarned;
  final int totalKycCompleted;

  ReferralStats({
    required this.referralCode,
    required this.totalReferred,
    required this.totalRewardsEarned,
    required this.totalKycCompleted,
  });

  factory ReferralStats.fromJson(Map<String, dynamic> json) {
    return ReferralStats(
      referralCode: json['referralCode'] as String? ?? '',
      totalReferred: (json['totalReferred'] as num?)?.toInt() ?? 0,
      totalRewardsEarned: (json['totalRewardsEarned'] as num?)?.toInt() ?? 0,
      totalKycCompleted: (json['totalKycCompleted'] as num?)?.toInt() ?? 0,
    );
  }
}

class ReferralHistoryItem {
  final String? refereeName;
  final String? refereeAvatarUrl;
  final String status;
  final int signupReward;
  final int kycReward;
  final DateTime createdAt;
  final DateTime? settledAt;

  ReferralHistoryItem({
    this.refereeName,
    this.refereeAvatarUrl,
    required this.status,
    required this.signupReward,
    required this.kycReward,
    required this.createdAt,
    this.settledAt,
  });

  factory ReferralHistoryItem.fromJson(Map<String, dynamic> json) {
    return ReferralHistoryItem(
      refereeName: json['refereeName'] as String?,
      refereeAvatarUrl: json['refereeAvatarUrl'] as String?,
      status: json['status'] as String? ?? 'pending',
      signupReward: (json['signupReward'] as num?)?.toInt() ?? 0,
      kycReward: (json['kycReward'] as num?)?.toInt() ?? 0,
      createdAt: DateTime.parse(json['createdAt'] as String),
      settledAt: json['settledAt'] != null ? DateTime.parse(json['settledAt'] as String) : null,
    );
  }
}
