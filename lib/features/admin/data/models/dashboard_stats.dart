class DashboardStats {
  final int totalUsers;
  final int activeUsers;
  final int adminUsers;
  final int totalContests;
  final int runningContests;
  final int upcomingContests;
  final int completedContests;
  final double totalDeposits;
  final int totalPointsEarned;
  final int pendingKycCount;
  final int openSupportTickets;
  final List<RecentUser> recentUsers;
  final List<RecentTransaction> recentTransactions;

  DashboardStats({
    required this.totalUsers,
    required this.activeUsers,
    required this.adminUsers,
    required this.totalContests,
    required this.runningContests,
    required this.upcomingContests,
    required this.completedContests,
    required this.totalDeposits,
    required this.totalPointsEarned,
    required this.pendingKycCount,
    required this.openSupportTickets,
    required this.recentUsers,
    required this.recentTransactions,
  });

  factory DashboardStats.fromJson(Map<String, dynamic> json) {
    return DashboardStats(
      totalUsers: json['totalUsers'] as int? ?? 0,
      activeUsers: json['activeUsers'] as int? ?? 0,
      adminUsers: json['adminUsers'] as int? ?? 0,
      totalContests: json['totalContests'] as int? ?? 0,
      runningContests: json['runningContests'] as int? ?? 0,
      upcomingContests: json['upcomingContests'] as int? ?? 0,
      completedContests: json['completedContests'] as int? ?? 0,
      totalDeposits: (json['totalDeposits'] as num?)?.toDouble() ?? 0.0,
      totalPointsEarned: json['totalPointsEarned'] as int? ?? 0,
      pendingKycCount: json['pendingKycCount'] as int? ?? 0,
      openSupportTickets: json['openSupportTickets'] as int? ?? 0,
      recentUsers: (json['recentUsers'] as List?)
              ?.map((e) => RecentUser.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      recentTransactions: (json['recentTransactions'] as List?)
              ?.map(
                  (e) => RecentTransaction.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}

class RecentUser {
  final String id;
  final String phoneNumber;
  final String? fullName;
  final String? avatarUrl;
  final String currentTier;
  final String? role;

  RecentUser({
    required this.id,
    required this.phoneNumber,
    this.fullName,
    this.avatarUrl,
    required this.currentTier,
    this.role,
  });

  factory RecentUser.fromJson(Map<String, dynamic> json) {
    return RecentUser(
      id: json['id'] as String,
      phoneNumber: json['phoneNumber'] as String,
      fullName: json['fullName'] as String?,
      avatarUrl: json['avatarUrl'] as String?,
      currentTier: json['currentTier'] as String? ?? 'bronze',
      role: json['role'] as String?,
    );
  }
}

class RecentTransaction {
  final String id;
  final String type;
  final double amount;
  final String status;
  final String? userPhoneNumber;
  final DateTime createdAt;

  RecentTransaction({
    required this.id,
    required this.type,
    required this.amount,
    required this.status,
    this.userPhoneNumber,
    required this.createdAt,
  });

  factory RecentTransaction.fromJson(Map<String, dynamic> json) {
    return RecentTransaction(
      id: json['id'] as String,
      type: json['type'] as String? ?? 'unknown',
      amount: (json['amount'] as num?)?.toDouble() ?? 0.0,
      status: json['status'] as String? ?? 'pending',
      userPhoneNumber: json['userPhoneNumber'] as String?,
      createdAt: DateTime.tryParse(json['createdAt'] as String? ?? '') ??
          DateTime.now(),
    );
  }
}
