class LeaderboardEntry {
  final String userId;
  final String userName;
  final String phoneNumber;
  final int points;
  final int rank;

  const LeaderboardEntry({
    required this.userId,
    required this.userName,
    required this.phoneNumber,
    required this.points,
    required this.rank,
  });

  factory LeaderboardEntry.fromJson(Map<String, dynamic> json) {
    return LeaderboardEntry(
      userId: json['userId'] as String? ?? '',
      userName: json['userName'] as String? ?? 'Anonymous',
      phoneNumber: json['phoneNumber'] as String? ?? '',
      points: (json['points'] as num?)?.toInt() ?? 0,
      rank: (json['rank'] as num?)?.toInt() ?? 0,
    );
  }
}
