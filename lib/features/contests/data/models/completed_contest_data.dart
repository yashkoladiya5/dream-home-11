import 'contest_model.dart';
import 'completed_member_entry.dart';

class CompletedContestStats {
  final int totalParticipants;
  final int totalPointsAwarded;
  final int averagePoints;

  const CompletedContestStats({
    required this.totalParticipants,
    required this.totalPointsAwarded,
    required this.averagePoints,
  });

  factory CompletedContestStats.fromJson(Map<String, dynamic> json) {
    return CompletedContestStats(
      totalParticipants: (json['totalParticipants'] as num?)?.toInt() ?? 0,
      totalPointsAwarded: (json['totalPointsAwarded'] as num?)?.toInt() ?? 0,
      averagePoints: (json['averagePoints'] as num?)?.toInt() ?? 0,
    );
  }
}

class CompletedContestData {
  final ContestModel contest;
  final List<CompletedMemberEntry> members;
  final CompletedContestStats stats;

  const CompletedContestData({
    required this.contest,
    required this.members,
    required this.stats,
  });

  factory CompletedContestData.fromJson(Map<String, dynamic> json) {
    return CompletedContestData(
      contest: ContestModel.fromJson(json['contest'] as Map<String, dynamic>),
      members: (json['members'] as List<dynamic>)
          .map((e) => CompletedMemberEntry.fromJson(e as Map<String, dynamic>))
          .toList(),
      stats: CompletedContestStats.fromJson(json['stats'] as Map<String, dynamic>),
    );
  }
}
