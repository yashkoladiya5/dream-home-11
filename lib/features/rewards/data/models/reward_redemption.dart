class RewardRedemption {
  final String id;
  final String rewardId;
  final int pointsSpent;
  final String status;
  final DateTime redeemedAt;
  final DateTime? fulfilledAt;
  final String? notes;
  final String? rewardTitle;
  final String? rewardImageUrl;
  final int? rewardPointsRequired;

  RewardRedemption({
    required this.id,
    required this.rewardId,
    required this.pointsSpent,
    required this.status,
    required this.redeemedAt,
    this.fulfilledAt,
    this.notes,
    this.rewardTitle,
    this.rewardImageUrl,
    this.rewardPointsRequired,
  });

  factory RewardRedemption.fromJson(Map<String, dynamic> json) {
    final rewardData = json['reward'] as Map<String, dynamic>?;
    return RewardRedemption(
      id: json['id'] as String,
      rewardId: json['rewardId'] as String,
      pointsSpent: json['pointsSpent'] as int? ?? 0,
      status: json['status'] as String? ?? 'pending',
      redeemedAt: DateTime.parse(json['redeemedAt'] as String),
      fulfilledAt: json['fulfilledAt'] != null ? DateTime.parse(json['fulfilledAt'] as String) : null,
      notes: json['notes'] as String?,
      rewardTitle: rewardData?['title'] as String?,
      rewardImageUrl: rewardData?['imageUrl'] as String?,
      rewardPointsRequired: rewardData?['pointsRequired'] as int?,
    );
  }
}
