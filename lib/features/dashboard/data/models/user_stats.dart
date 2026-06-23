class UserStats {
  final int totalContestsJoined;
  final int totalContestsWon;
  final int totalPointsEarned;
  final int totalEntryFeesSpent;
  final double averageRank;
  final int bestRank;
  final double winRate;

  const UserStats({
    required this.totalContestsJoined,
    required this.totalContestsWon,
    required this.totalPointsEarned,
    required this.totalEntryFeesSpent,
    required this.averageRank,
    required this.bestRank,
    required this.winRate,
  });

  factory UserStats.fromJson(Map<String, dynamic> json) {
    return UserStats(
      totalContestsJoined: (json['totalContestsJoined'] as num?)?.toInt() ?? 0,
      totalContestsWon: (json['totalContestsWon'] as num?)?.toInt() ?? 0,
      totalPointsEarned: (json['totalPointsEarned'] as num?)?.toInt() ?? 0,
      totalEntryFeesSpent: (json['totalEntryFeesSpent'] as num?)?.toInt() ?? 0,
      averageRank: (json['averageRank'] as num?)?.toDouble() ?? 0.0,
      bestRank: (json['bestRank'] as num?)?.toInt() ?? 0,
      winRate: (json['winRate'] as num?)?.toDouble() ?? 0.0,
    );
  }
}
