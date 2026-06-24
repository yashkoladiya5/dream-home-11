class Reminder {
  final String id;
  final String contestId;
  final DateTime remindAt;
  final String status;

  const Reminder({
    required this.id,
    required this.contestId,
    required this.remindAt,
    required this.status,
  });

  factory Reminder.fromJson(Map<String, dynamic> json) {
    return Reminder(
      id: json['id'] as String,
      contestId: json['contestId'] as String,
      remindAt: DateTime.parse(json['remindAt'] as String),
      status: json['status'] as String? ?? 'pending',
    );
  }
}
