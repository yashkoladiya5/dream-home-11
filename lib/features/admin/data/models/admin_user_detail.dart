class AdminUserDetail {
  final String id;
  final String phoneNumber;
  final String? email;
  final String? fullName;
  final String? avatarUrl;
  final String currentTier;
  final String? role;
  final bool isActive;
  final String? state;
  final int contestCount;
  final double totalDeposits;
  final double totalWithdrawals;
  final DateTime createdAt;

  AdminUserDetail({
    required this.id,
    required this.phoneNumber,
    this.email,
    this.fullName,
    this.avatarUrl,
    required this.currentTier,
    this.role,
    required this.isActive,
    this.state,
    required this.contestCount,
    required this.totalDeposits,
    required this.totalWithdrawals,
    required this.createdAt,
  });

  factory AdminUserDetail.fromJson(Map<String, dynamic> json) {
    return AdminUserDetail(
      id: json['id'] as String,
      phoneNumber: json['phoneNumber'] as String,
      email: json['email'] as String?,
      fullName: json['fullName'] as String?,
      avatarUrl: json['avatarUrl'] as String?,
      currentTier: json['currentTier'] as String? ?? 'bronze',
      role: json['role'] as String?,
      isActive: json['isActive'] as bool? ?? true,
      state: json['state'] as String?,
      contestCount: json['contestCount'] as int? ?? 0,
      totalDeposits: (json['totalDeposits'] as num?)?.toDouble() ?? 0.0,
      totalWithdrawals: (json['totalWithdrawals'] as num?)?.toDouble() ?? 0.0,
      createdAt: DateTime.tryParse(json['createdAt'] as String? ?? '') ??
          DateTime.now(),
    );
  }
}

class AdminUserSummary {
  final String id;
  final String phoneNumber;
  final String? fullName;
  final String? avatarUrl;
  final String currentTier;
  final String? role;
  final bool isActive;
  final String? kycStatus;
  final DateTime createdAt;

  AdminUserSummary({
    required this.id,
    required this.phoneNumber,
    this.fullName,
    this.avatarUrl,
    required this.currentTier,
    this.role,
    required this.isActive,
    this.kycStatus,
    required this.createdAt,
  });

  factory AdminUserSummary.fromJson(Map<String, dynamic> json) {
    return AdminUserSummary(
      id: json['id'] as String,
      phoneNumber: json['phoneNumber'] as String,
      fullName: json['fullName'] as String?,
      avatarUrl: json['avatarUrl'] as String?,
      currentTier: json['currentTier'] as String? ?? 'bronze',
      role: json['role'] as String?,
      isActive: json['isActive'] as bool? ?? true,
      kycStatus: json['kycStatus'] as String?,
      createdAt: DateTime.tryParse(json['createdAt'] as String? ?? '') ??
          DateTime.now(),
    );
  }
}
