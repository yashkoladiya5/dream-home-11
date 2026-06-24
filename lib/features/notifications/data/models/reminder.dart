class Reminder {
  final String id;
  final String contestId;
  final String? contestTitle;
  final DateTime remindAt;
  final String status;

  const Reminder({
    required this.id,
    required this.contestId,
    this.contestTitle,
    required this.remindAt,
    required this.status,
  });

  factory Reminder.fromJson(Map<String, dynamic> json) {
    final contest = json['contest'] as Map<String, dynamic>?;
    return Reminder(
      id: json['id'] as String,
      contestId: json['contestId'] as String,
      contestTitle: contest?['title'] as String?,
      remindAt: DateTime.parse(json['remindAt'] as String),
      status: json['status'] as String? ?? 'pending',
    );
  }
}
