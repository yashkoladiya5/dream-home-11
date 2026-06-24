class WinnerEntry {
  final String userId;
  final String userName;
  final int points;
  final int rank;

  WinnerEntry({
    required this.userId,
    required this.userName,
    required this.points,
    required this.rank,
  });

  factory WinnerEntry.fromJson(Map<String, dynamic> json) {
    return WinnerEntry(
      userId: json['userId'] as String,
      userName: json['userName'] as String? ?? 'Anonymous',
      points: json['points'] as int? ?? 0,
      rank: json['rank'] as int? ?? 0,
    );
  }
}

class WinnerContest {
  final String contestId;
  final String contestTitle;
  final String prize;
  final DateTime completedAt;
  final List<WinnerEntry> winners;

  WinnerContest({
    required this.contestId,
    required this.contestTitle,
    required this.prize,
    required this.completedAt,
    required this.winners,
  });

  factory WinnerContest.fromJson(Map<String, dynamic> json) {
    return WinnerContest(
      contestId: json['contestId'] as String,
      contestTitle: json['contestTitle'] as String,
      prize: json['prize'] as String? ?? 'N/A',
      completedAt: DateTime.parse(json['completedAt'] as String),
      winners: (json['winners'] as List)
          .map((e) => WinnerEntry.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}
