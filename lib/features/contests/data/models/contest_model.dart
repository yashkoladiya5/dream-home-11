class ContestModel {
  final String id;
  final String title;
  final String type;
  final double entryFeeInr;
  final int pointsToJoin;
  final int maxSlots;
  final int filledSlots;
  final String? prize;
  final String? badgeText;
  final String? badgeColor;
  final String? rules;
  final String? inviteCode;
  final DateTime startTime;
  final DateTime endTime;
  final String status;
  final int? myPoints;
  final int? myRank;

  ContestModel({
    required this.id,
    required this.title,
    required this.type,
    required this.entryFeeInr,
    required this.pointsToJoin,
    required this.maxSlots,
    required this.filledSlots,
    this.prize,
    this.badgeText,
    this.badgeColor,
    this.rules,
    this.inviteCode,
    required this.startTime,
    required this.endTime,
    required this.status,
    this.myPoints,
    this.myRank,
  });

  factory ContestModel.fromJson(Map<String, dynamic> json) {
    return ContestModel(
      id: json['id'] as String,
      title: json['title'] as String,
      type: json['type'] as String? ?? 'normal',
      entryFeeInr: double.tryParse(json['entryFeeInr']?.toString() ?? '0') ?? 0.0,
      pointsToJoin: json['pointsToJoin'] as int? ?? 0,
      maxSlots: json['maxSlots'] as int? ?? 0,
      filledSlots: json['filledSlots'] as int? ?? 0,
      prize: json['prize'] as String?,
      badgeText: json['badgeText'] as String?,
      badgeColor: json['badgeColor'] as String?,
      rules: json['rules'] as String?,
      inviteCode: json['inviteCode'] as String?,
      startTime: DateTime.parse(json['startTime'] as String),
      endTime: DateTime.parse(json['endTime'] as String),
      status: json['status'] as String? ?? 'upcoming',
      myPoints: json['myPoints'] as int?,
      myRank: json['myRank'] as int?,
    );
  }

  int get spotsLeft => maxSlots - filledSlots;
  double get fillPercentage => maxSlots > 0 ? filledSlots / maxSlots : 0;
}
