class LeaderboardEntry {
  final String userId;
  final double score;
  final int rank;
  final String? fullName;
  final String? avatarUrl;
  final String? currentTier;

  const LeaderboardEntry({
    required this.userId,
    required this.score,
    required this.rank,
    this.fullName,
    this.avatarUrl,
    this.currentTier,
  });

  factory LeaderboardEntry.fromJson(Map<String, dynamic> json) {
    return LeaderboardEntry(
      userId: json['userId'] as String,
      score: (json['score'] as num?)?.toDouble() ?? 0,
      rank: (json['rank'] as num?)?.toInt() ?? 0,
      fullName: json['fullName'] as String?,
      avatarUrl: json['avatarUrl'] as String?,
      currentTier: json['currentTier'] as String?,
    );
  }

  String get initials {
    if (fullName != null && fullName!.isNotEmpty) {
      final parts = fullName!.split(' ');
      if (parts.length >= 2) {
        return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
      }
      return fullName![0].toUpperCase();
    }
    return userId.substring(0, 2).toUpperCase();
  }

  String get tierLabel => currentTier ?? 'bronze';
}

enum LeaderboardCycle { allTime, weekly, monthly, custom }

class LeaderboardResponse {
  final List<LeaderboardEntry> entries;
  final LeaderboardEntry? userRank;
  final int totalCount;
  final LeaderboardCycle cycle;
  final String? contestId;

  const LeaderboardResponse({
    required this.entries,
    this.userRank,
    required this.totalCount,
    this.cycle = LeaderboardCycle.allTime,
    this.contestId,
  });

  factory LeaderboardResponse.fromJson(Map<String, dynamic> json) {
    final cycleStr = (json['cycle'] as String?) ?? 'all_time';
    return LeaderboardResponse(
      entries: (json['entries'] as List<dynamic>?)
              ?.map((e) => LeaderboardEntry.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      userRank: json['userRank'] != null
          ? LeaderboardEntry.fromJson(json['userRank'] as Map<String, dynamic>)
          : null,
      totalCount: (json['totalCount'] as num?)?.toInt() ?? 0,
      cycle: _parseCycle(cycleStr),
      contestId: json['contestId'] as String?,
    );
  }

  static LeaderboardCycle _parseCycle(String cycle) {
    switch (cycle) {
      case 'weekly':
        return LeaderboardCycle.weekly;
      case 'monthly':
        return LeaderboardCycle.monthly;
      case 'custom':
        return LeaderboardCycle.custom;
      default:
        return LeaderboardCycle.allTime;
    }
  }
}
