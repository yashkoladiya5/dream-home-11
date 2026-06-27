class PollOption {
  final String option;
  final int count;
  final int percentage;

  PollOption({
    required this.option,
    required this.count,
    required this.percentage,
  });

  factory PollOption.fromJson(Map<String, dynamic> json) {
    return PollOption(
      option: json['option'] as String? ?? '',
      count: json['count'] as int? ?? 0,
      percentage: json['percentage'] as int? ?? 0,
    );
  }
}

class Poll {
  final String id;
  final String question;
  final List<String> options;
  final int totalVotes;
  final DateTime activeFrom;
  final DateTime activeTo;
  final bool isActive;

  Poll({
    required this.id,
    required this.question,
    required this.options,
    required this.totalVotes,
    required this.activeFrom,
    required this.activeTo,
    required this.isActive,
  });

  factory Poll.fromJson(Map<String, dynamic> json) {
    return Poll(
      id: json['id'] as String? ?? '',
      question: json['question'] as String? ?? '',
      options: (json['options'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
      totalVotes: json['totalVotes'] as int? ?? 0,
      activeFrom: DateTime.parse(json['activeFrom'] as String),
      activeTo: DateTime.parse(json['activeTo'] as String),
      isActive: json['isActive'] as bool? ?? false,
    );
  }
}

class PollVoteResponse {
  final bool success;
  final String message;
  final int pointsAwarded;
  final List<PollOption> results;
  final int userVote;
  final int totalVotes;

  PollVoteResponse({
    required this.success,
    required this.message,
    required this.pointsAwarded,
    required this.results,
    required this.userVote,
    required this.totalVotes,
  });

  factory PollVoteResponse.fromJson(Map<String, dynamic> json) {
    return PollVoteResponse(
      success: json['success'] as bool? ?? false,
      message: json['message'] as String? ?? '',
      pointsAwarded: json['pointsAwarded'] as int? ?? 0,
      results: (json['results'] as List<dynamic>?)
              ?.map((e) => PollOption.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      userVote: json['userVote'] is Map
          ? (json['userVote']['selectedOption'] as int? ?? -1)
          : -1,
      totalVotes: json['totalVotes'] as int? ?? 0,
    );
  }
}

class PollResults {
  final Poll poll;
  final List<PollOption> results;
  final int? userVote;
  final int totalVotes;

  PollResults({
    required this.poll,
    required this.results,
    this.userVote,
    required this.totalVotes,
  });

  factory PollResults.fromJson(Map<String, dynamic> json) {
    return PollResults(
      poll: Poll.fromJson(json['poll'] as Map<String, dynamic>),
      results: (json['results'] as List<dynamic>?)
              ?.map((e) => PollOption.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      userVote: json['userVote'] is Map
          ? (json['userVote']['selectedOption'] as int?)
          : null,
      totalVotes: json['totalVotes'] as int? ?? 0,
    );
  }
}

class ActivePollResponse {
  final Poll poll;
  final int? userVote;

  ActivePollResponse({required this.poll, this.userVote});

  factory ActivePollResponse.fromJson(Map<String, dynamic> json) {
    int? userVote;
    if (json['userVote'] is Map) {
      userVote = (json['userVote'] as Map)['selectedOption'] as int?;
    }
    return ActivePollResponse(
      poll: Poll.fromJson(json['poll'] as Map<String, dynamic>),
      userVote: userVote,
    );
  }
}
