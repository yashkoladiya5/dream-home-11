class StreakInfo {
  final int currentStreak;
  final int longestStreak;
  final String? lastStreakDate;
  final int? nextMilestone;
  final int? daysToNextMilestone;
  final int? nextMilestoneReward;

  const StreakInfo({
    required this.currentStreak,
    required this.longestStreak,
    this.lastStreakDate,
    this.nextMilestone,
    this.daysToNextMilestone,
    this.nextMilestoneReward,
  });

  factory StreakInfo.fromJson(Map<String, dynamic> json) {
    return StreakInfo(
      currentStreak: (json['currentStreak'] as num?)?.toInt() ?? 0,
      longestStreak: (json['longestStreak'] as num?)?.toInt() ?? 0,
      lastStreakDate: json['lastStreakDate'] as String?,
      nextMilestone: (json['nextMilestone'] as num?)?.toInt(),
      daysToNextMilestone: (json['daysToNextMilestone'] as num?)?.toInt(),
      nextMilestoneReward: (json['nextMilestoneReward'] as num?)?.toInt(),
    );
  }

  double get progress {
    if (nextMilestone == null || currentStreak <= 0) return 0.0;
    return (currentStreak / nextMilestone!).clamp(0.0, 1.0);
  }

  bool get isOnStreak => currentStreak > 0;
}
