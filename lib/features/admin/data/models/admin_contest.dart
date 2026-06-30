class AdminContestSummary {
  final String id;
  final String title;
  final String entryFeeDisplay;
  final String prizeDisplay;
  final int totalSlots;
  final int filledSlots;
  final String status;
  final String type;

  AdminContestSummary({
    required this.id,
    required this.title,
    required this.entryFeeDisplay,
    required this.prizeDisplay,
    required this.totalSlots,
    required this.filledSlots,
    required this.status,
    required this.type,
  });

  factory AdminContestSummary.fromJson(Map<String, dynamic> json) {
    final entryFeeInr = json['entryFeeInr'] as String? ?? '0';
    final prize = json['prize'] as String? ?? '';
    return AdminContestSummary(
      id: json['id'] as String,
      title: json['title'] as String? ?? '',
      entryFeeDisplay: entryFeeInr,
      prizeDisplay: prize,
      totalSlots: (json['maxSlots'] as num?)?.toInt() ?? 0,
      filledSlots: (json['filledSlots'] as num?)?.toInt() ?? 0,
      status: json['status'] as String? ?? 'upcoming',
      type: json['type'] as String? ?? 'public',
    );
  }
}

class AdminContestDetail {
  final String id;
  final String title;
  final String? description;
  final String entryFeeDisplay;
  final String prizeDisplay;
  final String status;
  final String type;
  final DateTime? startTime;
  final DateTime? endTime;
  final int memberCount;
  final int totalSlots;
  final int filledSlots;
  final String? rules;
  final String compensationStatus;

  AdminContestDetail({
    required this.id,
    required this.title,
    this.description,
    required this.entryFeeDisplay,
    required this.prizeDisplay,
    required this.status,
    required this.type,
    this.startTime,
    this.endTime,
    required this.memberCount,
    required this.totalSlots,
    required this.filledSlots,
    this.rules,
    this.compensationStatus = 'none',
  });

  factory AdminContestDetail.fromJson(Map<String, dynamic> json) {
    final entryFeeInr = json['entryFeeInr'] as String? ?? '0';
    final prize = json['prize'] as String? ?? '';
    return AdminContestDetail(
      id: json['id'] as String,
      title: json['title'] as String? ?? '',
      description: json['description'] as String?,
      entryFeeDisplay: entryFeeInr,
      prizeDisplay: prize,
      status: json['status'] as String? ?? 'upcoming',
      type: json['type'] as String? ?? 'public',
      startTime: json['startTime'] != null ? DateTime.tryParse(json['startTime'] as String) : null,
      endTime: json['endTime'] != null ? DateTime.tryParse(json['endTime'] as String) : null,
      memberCount: (json['memberCount'] as num?)?.toInt() ?? (json['filledSlots'] as num?)?.toInt() ?? 0,
      totalSlots: (json['maxSlots'] as num?)?.toInt() ?? 0,
      filledSlots: (json['filledSlots'] as num?)?.toInt() ?? 0,
      rules: json['rules'] as String?,
      compensationStatus: json['compensationStatus'] as String? ?? 'none',
    );
  }
}
