class ActivityEvent {
  final String id;
  final String type; // 'contest_joined', 'points_earned', 'rank_up', 'bonus', 'milestone'
  final String description;
  final int points;
  final DateTime timestamp;

  const ActivityEvent({
    required this.id,
    required this.type,
    required this.description,
    required this.points,
    required this.timestamp,
  });

  factory ActivityEvent.fromJson(Map<String, dynamic> json) {
    return ActivityEvent(
      id: json['id'] as String? ?? '',
      type: json['activity'] as String? ?? json['type'] as String? ?? 'points_earned',
      description: json['description'] as String? ?? '',
      points: (json['points'] as num?)?.toInt() ?? 0,
      timestamp: json['timestamp'] != null
          ? DateTime.parse(json['timestamp'] as String)
          : DateTime.now(),
    );
  }
}
