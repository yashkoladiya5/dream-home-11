class HomeContestModel {
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
  final DateTime startTime;
  final DateTime endTime;
  final String status;
  final String? inviteCode;
  final String? rules;
  final int myPoints;
  final int myRank;
  final int totalMembers;
  final double progressPercentage;
  final int? pointsToFirst;

  HomeContestModel({
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
    required this.startTime,
    required this.endTime,
    required this.status,
    this.inviteCode,
    this.rules,
    required this.myPoints,
    required this.myRank,
    required this.totalMembers,
    required this.progressPercentage,
    this.pointsToFirst,
  });

  factory HomeContestModel.fromJson(Map<String, dynamic> json) {
    return HomeContestModel(
      id: json['id'] as String,
      title: json['title'] as String,
      type: json['type'] as String? ?? 'normal',
      entryFeeInr: double.tryParse(json['entryFeeInr']?.toString() ?? '0') ?? 0.0,
      pointsToJoin: int.tryParse(json['pointsToJoin']?.toString() ?? '') ?? 0,
      maxSlots: int.tryParse(json['maxSlots']?.toString() ?? '') ?? 0,
      filledSlots: int.tryParse(json['filledSlots']?.toString() ?? '') ?? 0,
      prize: json['prize'] as String?,
      badgeText: json['badgeText'] as String?,
      badgeColor: json['badgeColor'] as String?,
      startTime: DateTime.parse(json['startTime'] as String),
      endTime: DateTime.parse(json['endTime'] as String),
      status: json['status'] as String? ?? 'upcoming',
      inviteCode: json['inviteCode'] as String?,
      rules: json['rules'] as String?,
      myPoints: int.tryParse(json['myPoints']?.toString() ?? '') ?? 0,
      myRank: int.tryParse(json['myRank']?.toString() ?? '') ?? 0,
      totalMembers: int.tryParse(json['totalMembers']?.toString() ?? '') ?? 0,
      progressPercentage: double.tryParse(json['progressPercentage']?.toString() ?? '0') ?? 0.0,
      pointsToFirst: json['pointsToFirst'] != null ? int.tryParse(json['pointsToFirst'].toString()) : null,
    );
  }

  int get spotsLeft => maxSlots - filledSlots;

  double get fillPercentage => maxSlots > 0 ? filledSlots / maxSlots : 0;
}
